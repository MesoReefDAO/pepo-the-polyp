import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes, pinProfileAsync } from "./routes";
import { serveStatic } from "./static";
import { storage } from "./storage";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

// Trust Replit's reverse proxy so express-rate-limit reads X-Forwarded-For correctly
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ─── Security headers via Helmet ──────────────────────────────────────────────
app.use(
  helmet({
    // Content-Security-Policy - carefully tuned for Privy, Bonfires iframe, and Vite
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'", // required by Vite HMR in dev
          "https://*.privy.io",
          "https://privy.io",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        mediaSrc: ["'self'"],
        // Allow iframes from the knowledge graph, Privy auth widget, and social OAuth
        // "'self'" is required for our /api/graph-embed proxy route (same-origin iframe)
        frameSrc: [
          "'self'",
          "https://pepo.app.bonfires.ai",
          "https://*.privy.io",
          "https://privy.io",
          "https://accounts.google.com",
          "https://*.google.com",
        ],
        // Allow outbound fetch/XHR to known services
        connectSrc: [
          "'self'",
          "wss:",
          "https://*.privy.io",
          "https://privy.io",
          "https://auth.privy.io",
          "https://pepo.app.bonfires.ai",
          "https://orcid.org",
          "https://pub.orcid.org",
          "https://mesoreefdao.org",
          // Google OAuth
          "https://accounts.google.com",
          "https://*.googleapis.com",
          // Twitter/X
          "https://api.twitter.com",
          "https://api.x.com",
          // LinkedIn
          "https://www.linkedin.com",
          "https://api.linkedin.com",
          // WalletConnect (used by Privy wallet connector)
          "https://*.walletconnect.com",
          "https://*.walletconnect.org",
          "https://explorer-api.walletconnect.com",
          "wss://*.walletconnect.com",
          "wss://*.walletconnect.org",
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'", "https://orcid.org"],
        frameAncestors: ["'none'"], // Prevent clickjacking - this page cannot be iframed
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    // HSTS - only enforce in production (HTTPS only)
    hsts: process.env.NODE_ENV === "production"
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
    // X-Content-Type-Options: nosniff (default ON)
    // X-Frame-Options: SAMEORIGIN (default ON - we still set frameAncestors in CSP for belt-and-suspenders)
    // X-XSS-Protection: disabled (modern browsers use CSP instead)
    xssFilter: false,
    // Cross-Origin-Opener-Policy: must NOT be same-origin to allow wallet popup flows (Privy/WalletConnect)
    crossOriginOpenerPolicy: false,
    // Referrer-Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // Don't advertise the server stack
    hidePoweredBy: true,
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Most routes stay tightly capped to limit large-payload attacks. Profile/IPFS
// write routes carry larger JSON blobs (bios, tag lists, IPFS image CID arrays,
// and legacy data-URL avatars), so they get a higher limit. Image file uploads
// are multipart and handled by multer separately, so they are unaffected here.
const captureRawBody = (req: Request, _res: Response, buf: Buffer) => {
  req.rawBody = buf;
};
const standardJson = express.json({ limit: "100kb", verify: captureRawBody });
const largeJson = express.json({ limit: "5mb", verify: captureRawBody });
app.use((req, res, next) => {
  const usesLargeLimit =
    req.path === "/api/ipfs/profile" || req.path.startsWith("/api/profiles");
  return (usesLargeLimit ? largeJson : standardJson)(req, res, next);
});
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// ─── Sessions (used for ORCID auth) ───────────────────────────────────────────
// Use PostgreSQL-backed session store so sessions survive server restarts.
// NOTE: We create the session table ourselves rather than relying on
// connect-pg-simple's `createTableIfMissing`. That option reads the library's
// `table.sql` from a path relative to the bundled module, which resolves to a
// non-existent `dist/table.sql` in production builds and makes every
// session.save() throw ENOENT (breaking ORCID sign-in). Creating the table via
// explicit SQL avoids any filesystem dependency.
// The orcid_sessions table is created in the startup IIFE below (awaited before
// the server accepts traffic) so the first session write never races it.
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool,
    tableName: "orcid_sessions",
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET || "mesoreefdao-orcid-session-secret-dev",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ─── Request logging ──────────────────────────────────────────────────────────
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// ─── Routes + static + error handler ─────────────────────────────────────────
(async () => {
  // Idempotent schema migrations (safe to run every startup)
  await pool.query(
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_address text NOT NULL DEFAULT '';`
  ).catch(err => console.error("[migration] wallet_address:", err));

  // Ensure the connect-pg-simple session table exists (we create it ourselves
  // instead of using createTableIfMissing, which reads a bundled table.sql that
  // is absent in the production build). Awaited so it is ready before any
  // session write. Schema mirrors connect-pg-simple's table.sql.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "orcid_sessions" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "orcid_sessions_pkey" PRIMARY KEY ("sid")
    );
    CREATE INDEX IF NOT EXISTS "IDX_orcid_sessions_expire" ON "orcid_sessions" ("expire");
  `).catch(err => console.error("[migration] orcid_sessions:", err));

  await registerRoutes(httpServer, app);

  // Seed Corals of the World species catalog (831 fact sheets) - idempotent,
  // skips if already populated. One HTTP GET to the public CoTW index page.
  (async () => {
    try {
      const { seedCotwSpecies } = await import("./seedCotwSpecies");
      const r = await seedCotwSpecies();
      if (r.skipped) {
        log(`CoTW species seed: already populated (${r.total} species)`);
      } else {
        log(`CoTW species seed: fetched=${r.fetched} inserted=${r.inserted} total=${r.total}`);
      }
      if (r.warning) console.warn(`[cotw-seed] ${r.warning}`);
    } catch (err) {
      console.error("[cotw-seed] startup seed failed:", err);
    }
  })();

  // Seed the Coral Trait Database (coraltraits.org) - idempotent, skips if
  // already populated, advisory-locked so concurrent autoscale instances don't
  // race. Ensures production self-seeds on first deploy (~5k species, ~148k
  // measurements). Fire-and-forget so it never blocks server startup.
  (async () => {
    try {
      const { seedCoralTraits } = await import("./seedCoralTraits");
      const r = await seedCoralTraits();
      if (r.skipped) {
        log(`Coral Traits seed: skipped (${r.reason}) - species=${r.species} measurements=${r.measurements}`);
      } else {
        log(`Coral Traits seed: seeded species=${r.species} measurements=${r.measurements}`);
      }
    } catch (err) {
      console.error("[coraltraits-seed] startup seed failed:", err);
    }
  })();

  // Backfill + recalculate points for all users on every startup (idempotent)
  storage.syncAllUserPoints()
    .then(({ synced, pointsAdded }) => {
      log(`Points sync complete - ${synced} profiles synced, ${pointsAdded} pts backfilled`);
    })
    .catch((err) => {
      console.error("[points-sync] startup sync failed:", err);
    });

  // Backfill IPFS pinning for any profiles still missing a CID (fire-and-forget, idempotent)
  // Individual logins and profile saves keep existing CIDs fresh automatically.
  storage.getAllProfilesRaw()
    .then(async (allProfiles) => {
      const unpinned = allProfiles.filter(p => !p.ipfsCid);
      if (unpinned.length === 0) {
        log(`IPFS backfill: all ${allProfiles.length} profiles already pinned`);
        return;
      }
      log(`IPFS backfill: pinning ${unpinned.length} of ${allProfiles.length} profiles`);
      for (const p of unpinned) {
        void pinProfileAsync(p as Record<string, unknown>, p.id);
      }
    })
    .catch((err) => {
      console.error("[ipfs-backfill] startup pin failed:", err);
    });

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    { port, host: "0.0.0.0", reusePort: true },
    () => { log(`serving on port ${port}`); },
  );
})();
