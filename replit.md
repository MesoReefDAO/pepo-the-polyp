# Pepo the Polyp — Reef Insight App
A full-stack DeSci/marine conservation web app that provides an AI guide to the MesoAmerican Reef knowledge network for users.

## Run & Operate
- `npm run dev`: Start development server (port 5000)
- `npm run build`: Create production build
- `npm run db:push`: Sync database schema
- **Environment Variables**: `PEPO_API_KEY`, `ORCID_CLIENT_ID`, `ORCID_CLIENT_SECRET`, `PRIVY_APP_SECRET`, `VITE_PRIVY_APP_ID`, `DATABASE_URL`, `SESSION_SECRET`

## Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express 5, TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: ORCID OAuth2 (primary), Privy.io (secondary, wallet/email/social)
- **Knowledge Graph**: Bonfires.ai
- **Build Tool**: Vite (frontend), esbuild (backend)

## Where things live
- `client/src/pages/`: Main application pages (e.g., `CommunityLeaderboard.tsx`, `Governance.tsx`, `ReefMapPage.tsx`)
- `client/src/components/`: Reusable UI components (e.g., `PrivyLoginButton.tsx`, `OrcidLoginButton.tsx`, `ReefMap.tsx`, `TelegramChatWidget.tsx`)
- `server/routes.ts`: All API route definitions
- `server/storage.ts`: Database CRUD operations via Drizzle
- `shared/schema.ts`: Drizzle ORM database schema definition
- `client/public/figmaAssets/`: Exported Figma assets
- **DB Schema**: `shared/schema.ts`
- **API Contracts**: `server/routes.ts` defines API endpoints.
- **Frontend Routing**: `client/src/App.tsx` (implicitly via `react-router-dom` setup)

## Architecture decisions
- **Multi-Source Knowledge Fusion**: Chat responses integrate information from six parallel sources (Bonfires.ai, Taxonomy, Scientific Journals, Wikipedia, MesoReefDAO Docs, Memento Mori) for comprehensive answers.
- **Dynamic ORCID Redirects**: The ORCID OAuth flow dynamically derives `redirect_uri` from the incoming request host, allowing a single build to support multiple deployment environments.
- **Ephemeral Autoscale IPFS Storage**: IPFS content uses MemoryBlockstore and PostgreSQL (`ipfs_blocks` table) for persistence, avoiding filesystem dependencies on ephemeral autoscale instances.
- **Conditional Privy.io Integration**: Privy.io authentication is conditionally loaded based on the presence of `VITE_PRIVY_APP_ID`, allowing for flexible auth configurations.
- **ESM-first Server Bundle**: The server is bundled as an ESM module, with CJS packages inlined and ESM-only packages externalized to optimize for modern runtime environments.

## Product
- AI-powered chat guide to the MesoAmerican Reef knowledge network.
- Community features: Leaderboard, public member profiles, contribution tracking.
- Governance module: Adaptive DAO voting via Vocdoni with GitHub repo integration for proposals.
- Interactive Reef Network Map with various marine data layers (EEZ, reef regions, GCRMN, WCS sites, Copernicus Marine data).
- Integrated workspace with Fileverse dDocs and dSheets.
- Profile management with ORCID linking and IPFS-based permanence.
- Contribution points system for user engagement and rewards.
- Live chat widget for real-time interaction with Pepo AI.

## User preferences
- _Populate as you build_

## Gotchas
- **Privy.io Activation**: Privy.io is only active if `VITE_PRIVY_APP_ID` is set.
- **IPFS Pinata**: No Helia/Ceramic packages are used at runtime for IPFS; functionality relies entirely on Pinata SDK.
- **Dynamic ORCID Redirects**: Ensure the `redirect_uri` registered with ORCID matches the dynamically generated URL for your environment.

## Pointers
- **Bonfires.ai**: `https://pepo.app.bonfires.ai`
- **ORCID Developer Tools**: `https://orcid.org/developer-tools`
- **Meso Reef DAO IPFS Gateway**: `teal-advisory-zebra-284.mypinata.cloud`
- **Pepo the Polyp Telegram Bot**: `https://t.me/PepothePolyp_bot`
- **GitHub Repository**: `https://github.com/robioreefeco/pepo-the-polyp`
- **Vocdoni**: `https://vocdoni.io/`