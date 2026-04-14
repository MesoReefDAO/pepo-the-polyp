import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { rateLimit } from "express-rate-limit";

const PEPO_API_KEY = process.env.PEPO_API_KEY || "";
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || "";
const PRIVY_APP_ID = process.env.PRIVY_APP_ID || "";
const BONFIRES_BASE = "https://pepo.app.bonfires.ai";
const BONFIRE_ID = "69372cce6b69184280de3a89";
const ORCID_CLIENT_ID = process.env.ORCID_CLIENT_ID || "";
const ORCID_CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET || "";
const ORCID_BASE = "https://orcid.org";

const orcidStateStore = new Map<string, { createdAt: number }>();

// ─── Rate limiters ─────────────────────────────────────────────────────────────
// General API: 120 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Chat endpoint: 20 requests per 15 minutes per IP (calls external AI API)
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Chat rate limit reached. Please wait a few minutes before sending more messages." },
});

// Auth endpoints: 10 per 15 minutes (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Please try again later." },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function verifyPrivyToken(token: string): Promise<boolean> {
  if (!PRIVY_APP_SECRET || !PRIVY_APP_ID || !token) return false;
  try {
    const res = await fetch(`https://auth.privy.io/api/v1/users/me`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "privy-app-id": PRIVY_APP_ID,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function sanitizeString(value: unknown, maxLength = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

// ─── Routes ────────────────────────────────────────────────────────────────────
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Apply general rate limiting to all /api routes
  app.use("/api", generalLimiter);

  // Proxy: fetch knowledge graph data
  app.get("/api/graph", async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${BONFIRES_BASE}/graph`, {
        headers: {
          "Authorization": `Bearer ${PEPO_API_KEY}`,
          "Content-Type": "application/json",
          "x-api-key": PEPO_API_KEY,
        },
      });
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: "Graph unavailable" });
      }
      const data = await response.json();
      return res.json(data);
    } catch {
      return res.status(500).json({ error: "Graph unavailable" });
    }
  });

  // Proxy: search knowledge graph
  app.post("/api/graph/search", async (req: Request, res: Response) => {
    const query = sanitizeString(req.body?.query, 500);
    if (!query) return res.status(400).json({ error: "query must be a non-empty string under 500 characters" });

    try {
      const response = await fetch(`${BONFIRES_BASE}/api/graph/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PEPO_API_KEY}`,
          "Content-Type": "application/json",
          "x-api-key": PEPO_API_KEY,
        },
        body: JSON.stringify({ bonfire_id: BONFIRE_ID, query }),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Search unavailable" });
      }
      const data = await response.json();
      return res.json(data);
    } catch {
      return res.status(500).json({ error: "Search unavailable" });
    }
  });

  // Chat endpoint: query Pepo AI via Bonfires (stricter rate limit)
  app.post("/api/chat", chatLimiter, async (req: Request, res: Response) => {
    const message = sanitizeString(req.body?.message, 2000);
    if (!message) return res.status(400).json({ error: "message must be a non-empty string under 2000 characters" });

    try {
      const response = await fetch(`${BONFIRES_BASE}/api/graph/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PEPO_API_KEY}`,
          "Content-Type": "application/json",
          "x-api-key": PEPO_API_KEY,
        },
        body: JSON.stringify({ bonfire_id: BONFIRE_ID, query: message }),
      });

      if (!response.ok) {
        console.log("[Pepo API] graph/query failed:", response.status);
        return res.json({ response: generatePepoResponse(message), source: "local" });
      }

      const data = await response.json() as any;

      if (data.success && Array.isArray(data.episodes) && data.episodes.length > 0) {
        const reply = await buildPepoReply(message, data.episodes);
        return res.json({ response: reply, source: "bonfires" });
      }

      // No Bonfires episodes — still enrich with Wikipedia + MesoReef
      const [wikiCtx, mesoCtx] = await Promise.all([
        fetchWikipediaContext(message),
        fetchMesoReefContext(message),
      ]);
      let fallbackReply = generatePepoResponse(message);
      if (wikiCtx) fallbackReply += `\n\n🌐 **Scientific Reference:**\n${wikiCtx.slice(0, 500)}...`;
      if (mesoCtx) {
        const relevantLines = mesoCtx.split("\n")
          .filter(line => line.toLowerCase().split(" ").some(w => w.length > 4 && message.toLowerCase().includes(w)))
          .slice(0, 4).join("\n");
        if (relevantLines.trim()) fallbackReply += `\n\n🐠 **MesoReefDAO:**\n${relevantLines.trim()}`;
      }
      return res.json({ response: fallbackReply, source: "enriched-local" });
    } catch (err) {
      console.log("[Pepo API] error:", err);
      return res.json({ response: generatePepoResponse(message), source: "local" });
    }
  });

  // Graph stats
  app.get("/api/stats", async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${BONFIRES_BASE}/stats`, {
        headers: {
          "Authorization": `Bearer ${PEPO_API_KEY}`,
          "x-api-key": PEPO_API_KEY,
        },
      });
      if (!response.ok) {
        return res.json({ knowledgeDensity: "8.4 TB", networkHealth: "99.2%", nodeConnections: 3420 });
      }
      const data = await response.json();
      return res.json(data);
    } catch {
      return res.json({ knowledgeDensity: "8.4 TB", networkHealth: "99.2%", nodeConnections: 3420 });
    }
  });

  // ORCID OAuth: initiate login
  app.get("/api/auth/orcid", authLimiter, (req: Request, res: Response) => {
    if (!ORCID_CLIENT_ID) {
      return res.status(500).json({ error: "ORCID not configured" });
    }
    const state = crypto.randomBytes(32).toString("hex"); // upgraded from 16 to 32 bytes
    orcidStateStore.set(state, { createdAt: Date.now() });
    // Clean up stale states (older than 10 minutes)
    for (const [k, v] of orcidStateStore.entries()) {
      if (Date.now() - v.createdAt > 10 * 60 * 1000) orcidStateStore.delete(k);
    }
    const host = req.headers.host || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/auth/orcid/callback`;
    const params = new URLSearchParams({
      client_id: ORCID_CLIENT_ID,
      response_type: "code",
      scope: "/authenticate",
      redirect_uri: redirectUri,
      state,
    });
    return res.redirect(`${ORCID_BASE}/oauth/authorize?${params.toString()}`);
  });

  // ORCID OAuth: callback
  app.get("/api/auth/orcid/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;

    if (!code || !state || !orcidStateStore.has(state)) {
      return res.redirect("/?orcid_error=invalid_state");
    }
    orcidStateStore.delete(state);

    const host = req.headers.host || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/auth/orcid/callback`;

    try {
      const tokenRes = await fetch(`${ORCID_BASE}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
          client_id: ORCID_CLIENT_ID,
          client_secret: ORCID_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });
      if (!tokenRes.ok) {
        return res.redirect("/profile?orcid_error=token_failed");
      }
      const token = await tokenRes.json() as { access_token: string; orcid: string; name: string };
      const orcid = token.orcid;
      const name = token.name || "";
      const params = new URLSearchParams({ orcid_id: orcid, orcid_name: encodeURIComponent(name) });
      return res.redirect(`/profile?${params.toString()}`);
    } catch {
      return res.redirect("/profile?orcid_error=server_error");
    }
  });

  // Privy token verification endpoint
  app.post("/api/auth/verify", authLimiter, async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || sanitizeString(req.body?.token, 4096);
      if (!token) return res.status(401).json({ valid: false, error: "No token provided" });
      const valid = await verifyPrivyToken(token);
      return res.json({ valid });
    } catch {
      return res.status(500).json({ valid: false });
    }
  });

  return httpServer;
}

// ─── Knowledge cache (TTL: 10 min) ────────────────────────────────────────────
const knowledgeCache = new Map<string, { value: string; expiresAt: number }>();

function getCached(key: string): string | null {
  const entry = knowledgeCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.value;
}

function setCached(key: string, value: string, ttlMs = 10 * 60 * 1000): void {
  knowledgeCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ─── Wikipedia knowledge ───────────────────────────────────────────────────────
function extractWikiSearchTerms(query: string): string {
  // Remove common question words and extract meaningful keywords
  const stopWords = new Set(["what", "how", "why", "when", "where", "who", "which", "is", "are", "does", "do",
    "can", "could", "would", "should", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "causes", "cause", "tell", "me", "about", "explain", "describe"]);
  const terms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  // Prefer reef-adjacent science terms if present
  const scienceTerms = terms.filter(w =>
    ["coral", "reef", "bleach", "mesoamerican", "mesophotic", "marine", "ocean", "biodiversity",
     "ecosystem", "algae", "symbiodinium", "dhw", "restoration", "conservation", "dao", "desci",
     "thermal", "temperature", "climate", "species", "habitat"].some(k => w.includes(k))
  );
  const finalTerms = scienceTerms.length > 0 ? scienceTerms : terms.slice(0, 4);
  return finalTerms.join(" ").trim() || query.slice(0, 60);
}

async function fetchWikipediaContext(query: string): Promise<string> {
  const searchTerms = extractWikiSearchTerms(query);
  const cacheKey = `wiki:${searchTerms}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Search Wikipedia using extracted science/reef keywords
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchTerms)}&limit=2&format=json&namespace=0`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) });
    if (!searchRes.ok) return "";
    const [, titles] = await searchRes.json() as [string, string[], string[], string[]];
    if (!titles || titles.length === 0) return "";

    // Fetch summaries for the top results
    const summaries: string[] = [];
    for (const title of titles.slice(0, 2)) {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(5000) });
      if (!summaryRes.ok) continue;
      const summaryData = await summaryRes.json() as { extract?: string; title?: string };
      if (summaryData.extract) {
        summaries.push(`**${summaryData.title}**: ${summaryData.extract.slice(0, 400)}`);
      }
    }

    const result = summaries.join("\n\n");
    if (result) setCached(cacheKey, result);
    return result;
  } catch {
    return "";
  }
}

// ─── MesoReefDAO knowledge ────────────────────────────────────────────────────
const MESOREEFDAO_KNOWLEDGE = `
MesoReefDAO is a decentralized science (DeSci) initiative dedicated to the conservation and regeneration of the Mesoamerican Barrier Reef — the world's second-largest coral reef system, stretching 1,000 km along the coasts of Mexico, Belize, Guatemala, and Honduras.

**Mission**: Scale global coral reef restoration by combining decentralized science, marine biotechnology, community innovation, and blockchain-based governance.

**Key Programs**:
- **Regen Reef Projects**: Field-based coral restoration and biotech research on the Mesoamerican and Mesophotic reefs (below 40m depth).
- **Modular Wetlabs**: Mobile laboratory units for coral and fish biotechnology, enabling in-situ research and assisted evolution experiments.
- **IoT & AI Monitoring**: Real-time ecological sensors (DHW trackers, bleaching alerts) integrated with AI to detect thermal anomalies and trigger restoration protocols.
- **DAO Governance**: On-chain proposals and voting for reef conservation funding, with transparency over how regenerative finance flows into blue economy development.
- **IP-NFTs & DeSci**: Decentralized frameworks for managing biodiversity patents and open-access research protocols.
- **Mesophotic Reefs**: Focus on reefs below 40m as thermal refugia — less studied but critically important for coral survival under climate change.

**Technology Stack**: IoT sensors, Marine Degree Heating Weeks (DHW) monitoring, CRISPR-assisted coral evolution, multi-omics research, blockchain governance (on-chain proposals), and AI-powered species distribution modeling.

**Community**: MesoReefDAO brings together marine biologists, local fishing communities, NGOs, policymakers, and DeSci contributors across the Caribbean and beyond.

**Conservation Focus**: Coral bleaching prevention, thermally resilient genotype identification, blue carbon offsetting, biodiversity incentives, and transparent impact reporting through on-chain mechanisms.
`.trim();

async function fetchMesoReefContext(query: string): Promise<string> {
  const lc = query.toLowerCase();
  const keywords = ["dao", "mesoreefdao", "meso", "regen", "wetlab", "governance", "proposal", "nft", "desci",
    "coral", "reef", "bleach", "conservation", "restoration", "monitoring", "iot", "ai", "marine",
    "mesophotic", "biotechnology", "token", "blockchain", "fund"];
  if (!keywords.some(k => lc.includes(k))) return "";

  // Return a relevant excerpt from the curated DAO knowledge
  return MESOREEFDAO_KNOWLEDGE;
}

// ─── Reply builder ────────────────────────────────────────────────────────────
async function buildPepoReply(query: string, episodes: any[]): Promise<string> {
  // Fetch Wikipedia and MesoReefDAO context in parallel
  const [wikiContext, mesoContext] = await Promise.all([
    fetchWikipediaContext(query),
    fetchMesoReefContext(query),
  ]);

  const top = episodes.slice(0, 3);
  const names = top.map((e: any) => e.name).filter(Boolean);
  const summaries = top
    .map((e: any) => {
      const c = e.content?.content || e.summary || "";
      return c ? c.slice(0, 250).replace(/\s+/g, " ").trim() : "";
    })
    .filter(Boolean);

  let reply = `I've searched the Reef Knowledge Network for **"${query}"** and found ${episodes.length} community knowledge nodes`;
  const sources: string[] = ["Pepo Knowledge Graph"];
  if (wikiContext) sources.push("Wikipedia");
  if (mesoContext) sources.push("MesoReefDAO Docs");
  reply += ` across ${sources.join(", ")}.\n\n`;

  // Community knowledge graph results
  if (names.length > 0) {
    reply += `🔬 **From the Community Knowledge Graph:**\n`;
    names.forEach((name: string, i: number) => {
      reply += `• **${name}**`;
      if (summaries[i]) reply += `\n  ${summaries[i]}...`;
      reply += "\n";
    });
    reply += "\n";
  }

  // Wikipedia context
  if (wikiContext) {
    reply += `🌐 **Scientific Reference (Wikipedia):**\n${wikiContext.slice(0, 600)}...\n\n`;
  }

  // MesoReefDAO context
  if (mesoContext) {
    const relevantLines = mesoContext
      .split("\n")
      .filter(line => {
        const lc = query.toLowerCase();
        return line.toLowerCase().split(" ").some(w => w.length > 4 && lc.includes(w));
      })
      .slice(0, 5)
      .join("\n");
    if (relevantLines.trim()) {
      reply += `🐠 **MesoReefDAO Context:**\n${relevantLines.trim()}\n\n`;
    }
  }

  reply += `Want me to expand on any of these knowledge nodes or explore a related cluster?`;
  return reply;
}

// ─── Fallback response ────────────────────────────────────────────────────────
function generatePepoResponse(userMessage: string): string {
  const lc = userMessage.toLowerCase();
  if (lc.includes("coral") || lc.includes("bleach")) {
    return "I'm analyzing the reef knowledge network for coral bleaching data. The MesoAmerican Reef has experienced severe thermal stress events — DHW levels above 8 trigger widespread coral mortality. I track thermally resilient genotypes and mesophotic refugia as key adaptation strategies. Ask me anything specific about bleaching events, DHW metrics, or reef restoration!";
  }
  if (lc.includes("dao") || lc.includes("governance") || lc.includes("proposal")) {
    return "MesoReefDAO governs reef conservation through on-chain proposals — transparent funding of Regen Reef projects, wetlab research, IoT monitoring, and biodiversity offsetting. Which governance area would you like to explore?";
  }
  if (lc.includes("graph") || lc.includes("node") || lc.includes("knowledge")) {
    return "The Pepo Knowledge Graph holds hundreds of community episodes covering coral ecology, DeSci governance, marine biotechnology, IoT monitoring, and conservation economics. Which quadrant shall we explore?";
  }
  if (lc.includes("temperature") || lc.includes("heat") || lc.includes("thermal") || lc.includes("dhw")) {
    return "Sea surface temperatures across the MesoAmerican Reef corridor are monitored in real-time using Marine Degree Heating Weeks (DHW). At 4 DHW bleaching begins; at 8+ DHW widespread mortality occurs. MesoReefDAO integrates IoT sensors and AI to track these thresholds and activate restoration protocols.";
  }
  if (lc.includes("mesophotic") || lc.includes("deep") || lc.includes("refugia")) {
    return "Mesophotic reefs (40–150m depth) are among MesoReefDAO's key research priorities. These deep reefs remain cooler and may act as thermal refugia — seed banks for thermally resilient coral genotypes. Less studied but critically important for climate adaptation strategies.";
  }
  if (lc.includes("telegram")) {
    return "You can reach me on Telegram at @PepothePolyp_bot! Click the Telegram Bot link in the sidebar to open our chat directly. I'll send you real-time reef alerts and knowledge graph insights there too.";
  }
  return "Greetings, Explorer. I am Pepo, your guide to the MesoAmerican Reef knowledge network — powered by the Pepo Knowledge Graph, Wikipedia science, and MesoReefDAO documentation. I can help you explore coral bleaching data, DAO governance, thermal stress events, mesophotic reefs, marine biotechnology, and species distribution. What would you like to explore?";
}
