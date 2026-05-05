# 🌊 Pepo the Polyp 🪸

**AI guide to the MesoAmerican Reef knowledge network, built for MesoReef DAO.** 🧬

Pepo is a full-stack DeSci and marine conservation web app that fuses six parallel knowledge sources into a conversational interface. Researchers, conservationists, and community members can ask questions about coral reef ecology, bleaching events, DeSci governance, and the MesoAmerican Reef ecosystem — then vote on proposals that shape the DAO's direction.

🌊 **Production:** [thepolyp.xyz](https://thepolyp.xyz)  
🐠 **Telegram:** [@PepothePolyp_bot](https://t.me/PepothePolyp_bot)  
✨ **DAO:** [MesoReefDAO](https://github.com/MesoReefDAO)

---

## 🪸 Features

| Feature | Description |
|---------|-------------|
| **🤖 AI Chat** | Conversational interface fusing 6 knowledge sources in parallel |
| **🧬 ORCID Login** | Primary standalone auth for researchers — no wallet required |
| **🔐 Privy Auth** | Wallet + email + Google + Twitter + LinkedIn login |
| **🗳️ Governance** | On-chain DAO voting via Vocdoni — Standard, Approval, and Quadratic voting |
| **🗺️ Reef Network Map** | Leaflet map with Allen Coral Atlas WMS, GCRMN regions, NOAA DHW layer, and member pins |
| **⏱️ ReefMap Timelapse** | Full-width CMS timelapse bar with slider, nav buttons, and year/quarter ticks |
| **🌐 Reef Knowledge Graph** | Live Bonfires.ai graph visualization — interactive on all screen sizes (mobile + desktop) |
| **🏆 Community Leaderboard** | Reputation points, profile cards, and member directory |
| **👤 User Profiles** | Bio, tags, location, ORCID iD badge, IPFS avatar/images |
| **🧭 Onboarding Wizard** | 5-step guided tour for new users — Framer Motion overlay, localStorage flag |
| **📊 Journey / Profile Status** | Collapsible completeness bar — links to ORCID, avatar, bio, display name + points |
| **🗂️ Reef Workspace** | Fileverse dDocs + dSheets for decentralized collaborative documents |
| **📦 IPFS Image Storage** | Pinata-backed IPFS pinning — avatar and reef image archiving |
| **🌍 Multilingual** | i18next with RTL support — English, Spanish, French, Arabic, and more |
| **🍪 Cookie Consent** | GDPR-compliant cookie banner with accept/decline |

---

## 🔬 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Animations | Framer Motion |
| Backend | Express 5, TypeScript (port 5000) |
| Database | PostgreSQL via Drizzle ORM |
| Auth | ORCID OAuth 2.0 (primary) · Privy.io (wallet/social) |
| Voting | Vocdoni SDK (`@vocdoni/sdk`) — on-chain proposals |
| Map | Leaflet · Allen Coral Atlas WMS · GCRMN GeoJSON |
| IPFS | Pinata SDK — cloud pinning + dedicated gateway |
| Knowledge | Bonfires.ai · OpenAlex · Europe PMC · Wikipedia |
| i18n | i18next + react-i18next — RTL-aware language switching |

---

## 🧬 Knowledge Sources

Every chat response fuses up to six sources in parallel:

1. **🪸 Pepo Knowledge Graph** — 165+ community research episodes via Bonfires.ai
2. **🤖 Telegram Bot Taxonomy** — 10 curated categories from `@PepothePolyp_bot`; keyword-matched per query; refreshed every 60 min
3. **📄 Scientific Journals** — peer-reviewed papers via OpenAlex + Europe PMC; coral-reef filtered; cached 15 min
4. **📖 Wikipedia** — scientific reference summaries; keyword-extracted + cached 10 min
5. **🌊 MesoReefDAO Documentation** — DAO mission, programs, tech stack
6. **✨ Memento Mori** — DeSci gaming and robioreefeco collective knowledge ([github.com/robioreefeco/memento-mori](https://github.com/robioreefeco/memento-mori))

---

## 🗳️ Governance (Vocdoni)

The `/governance` page provides adaptive on-chain DAO voting powered by the [Vocdoni](https://vocdoni.io) network. A collapsible **How Voting Works** panel explains all three strategies and census modes before users engage.

### Voting Strategies

| Strategy | How it works |
|----------|-------------|
| **Standard** | Each voter picks exactly one option |
| **Approval** | Voters approve any number of options they support |
| **Quadratic** | Voters distribute 25 credits; cost = credits² — prevents vote concentration |

### Census Modes

| Mode | Description |
|------|-------------|
| **Open Wallet** | Any EVM wallet can be added to the census |
| **Base Network Members** | Census associated with Base chain wallets; dynamic so new members can join |

### GitHub Import

The "New Proposal" form includes an **Import from GitHub** button that fetches open issues and pull requests from any public repository and converts them into ready-made ballot options (e.g. "Merge PR #42: …" or "Resolve #17: …").

### Governance Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_VOCDONI_ORG_ADDRESS` | Vocdoni organization wallet address (required to load proposals) |
| `VITE_VOCDONI_ENV` | Vocdoni environment: `dev` / `stg` (default) / `prod` |
| `VITE_GITHUB_OWNER` | Default GitHub org/user for proposal import (default: `robioreefeco`) |
| `VITE_GITHUB_REPO` | Default GitHub repo for proposal import (default: `memento-mori`) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PEPO_API_KEY` | Bonfires.ai API key |
| `PINATA_JWT` | Pinata JWT for IPFS uploads |
| `VITE_PRIVY_APP_ID` | Privy app ID (browser) |
| `PRIVY_APP_SECRET` | Privy server-side secret |
| `ORCID_CLIENT_ID` | ORCID OAuth client ID |
| `ORCID_CLIENT_SECRET` | ORCID OAuth client secret |
| `SESSION_SECRET` | Express session secret |
| `VITE_VOCDONI_ORG_ADDRESS` | Vocdoni org address for governance |
| `VITE_VOCDONI_ENV` | Vocdoni network (`stg` or `prod`) |
| `GITHUB_TOKEN` | Optional — increases GitHub API rate limit for proposal import |

> `VITE_PRIVY_APP_ID` is optional — the app runs without Privy, using ORCID-only auth.

### Install and Run

```bash
npm install
npm run db:push   # sync database schema
npm run dev       # start dev server on port 5000
```

---

## 🔐 Auth

### ORCID (Primary)

ORCID is the primary standalone login — no wallet required.

1. User clicks "Sign in" → GET `/api/auth/orcid`
2. Server builds ORCID authorization URL with `redirect_uri` derived dynamically from the request host
3. ORCID redirects to `/api/auth/orcid/callback?code=...`
4. Server exchanges code for access token + ORCID iD, creates/updates profile, stores session
5. Redirect to `/profile`

Registered redirect URIs:
- `https://thepolyp.xyz/api/auth/orcid/callback`
- `https://pepothepolyp.replit.app/api/auth/orcid/callback`

### Privy (Wallet + Social)

- Login methods: MetaMask, Coinbase, Rainbow, Rabby, WalletConnect, Google, Twitter, LinkedIn, email
- Default chain: Base
- EVM chains: mainnet, polygon, base, arbitrum, optimism, avalanche

---

## 🌊 API Reference

### Chat & Knowledge Graph

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat` | POST `{ message }` | Send a message to Pepo AI |
| `/api/graph` | GET | Fetch full knowledge graph from Bonfires.ai |
| `/api/graph/data` | GET | Graph nodes and edges |
| `/api/graph/recent` | GET | Recent graph episodes |
| `/api/graph/search` | POST `{ query }` | Search the knowledge graph |
| `/api/graph-embed` | GET | Proxied Bonfires.ai graph page (used by iframe on all screen sizes) |
| `/api/stats` | GET | Network health stats |

### Profiles & Community

| Route | Method | Description |
|-------|--------|-------------|
| `/api/leaderboard` | GET | Ranked list of members |
| `/api/profiles` | GET | All public profiles |
| `/api/profiles/:id` | GET | Single profile with contributions |
| `/api/profiles/me` | GET | Current user's profile |
| `/api/profiles/sync` | POST | Sync Privy user to DB; awards first-login points |
| `/api/profiles/orcid` | POST | Link ORCID iD to authenticated user |
| `/api/profiles/location` | POST | Save geolocation for map pin |
| `/api/contributions` | POST | Record a contribution and award points |
| `/api/map/markers` | GET | Public users with lat/lng for Reef Network Map |

### Auth

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/orcid` | GET | Initiate ORCID OAuth flow |
| `/api/auth/orcid/callback` | GET | ORCID callback — exchanges code for token |
| `/api/auth/orcid/session` | GET | Check current ORCID session |
| `/api/auth/orcid/logout` | POST | Sign out of ORCID session |

### IPFS

| Route | Method | Description |
|-------|--------|-------------|
| `/api/ipfs/upload` | POST (multipart) | Upload image (≤10 MB); pins to Pinata; returns `{ cid, size, mimeType }` |
| `/api/ipfs/cat/:cid` | GET | Stream image bytes for a CID |
| `/api/ipfs/info` | GET | IPFS/Pinata node status |

### Map & Reef Data

| Route | Method | Description |
|-------|--------|-------------|
| `/api/gcrmn/regions` | GET | GCRMN region polygons as GeoJSON |
| `/api/coral-mapping/regions` | GET | CoralMapping GlobalMappingRegions GeoJSON |
| `/api/reef-images` | GET | Approved reef images with lat/lng for map pins |
| `/api/reef-images` | POST | Submit a new reef image pin (ORCID-verified review) |

### GitHub Proxy

| Route | Method | Description |
|-------|--------|-------------|
| `/api/github/issues` | GET `?owner=&repo=&type=` | Open issues and PRs for any public GitHub repo; used by Governance import |

---

## 🏅 Contribution Points

| Action | Points |
|--------|--------|
| First login | +50 |
| Asking a question | +10 (once per day) |
| Linking ORCID iD | +25 (once) |
| Daily coral clean | +5 (once per day) |

Points are stored persistently in PostgreSQL and displayed on the Community leaderboard.

---

## 📁 Project Structure

```
client/src/
  pages/
    Body.tsx                               — Main layout: JourneySection + dashboard
    CommunityLeaderboard.tsx               — Leaderboard + profile cards → /members/:id
    Governance.tsx                         — /governance: Vocdoni voting + HowVotingWorks guide
    PublicProfile.tsx                      — /members/:id public member profile
    UserProfileDashboard.tsx               — /profile: edit bio, tags, links, ORCID
    WorkspacePage.tsx                      — /workspace: Fileverse dDocs + dSheets
    MobileMapPage.tsx                      — /map: full-screen mobile reef map
    ReefMapPage.tsx                        — /reef-map: desktop reef map page
    CurationPage.tsx                       — /curation: content curation tools
    sections/
      ApplicationHeaderSection.tsx         — Top nav with auth button + completeness dot
      ExplorerNavigationSidebarSection.tsx  — Sidebar nav with profile completeness badge
      ReefInsightDashboardSection.tsx      — Bonfires.ai Knowledge Graph + Clean Coral panel
  components/
    SplashScreen.tsx                       — Animated intro screen (session-gated)
    OnboardingWizard.tsx                   — 5-step guided tour overlay (localStorage-gated)
    JourneySection.tsx                     — Collapsible profile completeness bar + points
    ReefMap.tsx                            — Leaflet map: coral layers, timelapse bar, member pins
    PrivyLoginButton.tsx                   — Privy login modal trigger
    OrcidLoginButton.tsx                   — ORCID OAuth redirect button
    IPFSImageUpload.tsx                    — Drag-and-drop IPFS upload widget (Pinata)
    TelegramChatWidget.tsx                 — Floating Telegram bot shortcut
    CookieBanner.tsx                       — GDPR cookie consent banner
    LanguageSwitcher.tsx                   — RTL-aware i18n language picker
  hooks/
    use-orcid-auth.ts                      — ORCID session state
    use-profile-sync.ts                    — Auto-sync Privy user to DB on login
    use-profile-status.ts                  — Shared profile completeness hook (4 checks)
    use-geolocation.ts                     — Geolocation capture + server sync

server/
  routes.ts                                — All API routes
  storage.ts                               — DB CRUD via Drizzle
  ipfs.ts                                  — Pinata IPFS client (upload, gateway URLs)
  db.ts                                    — PostgreSQL connection
  index.ts                                 — Express entry point

shared/
  schema.ts                                — Drizzle schema + Zod types
```

---

## 🚢 Deployment

```bash
npm run build   # Vite frontend → dist/public/ + esbuild server → dist/index.mjs
node dist/index.mjs
```

The server bundle uses ESM. CJS packages are bundled inline by esbuild; ESM-only packages are externalized so `import.meta.url` resolves correctly in each module.

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| 🌊 Production | https://thepolyp.xyz |
| 🐙 GitHub | https://github.com/MesoReefDAO/pepo-the-polyp |
| 🐠 Telegram | https://t.me/PepothePolyp_bot |
| 🪸 MesoReef DAO | https://github.com/MesoReefDAO |
| ✨ Memento Mori | https://github.com/robioreefeco/memento-mori |
| 🔥 Bonfires.ai | https://bonfires.ai |
| 🗳️ Vocdoni | https://vocdoni.io |
| 🧬 ORCID | https://orcid.org |
| 🗺️ Allen Coral Atlas | https://allencoralatlas.org |
| 🌐 GCRMN | https://gcrmn.net |
| 📦 Pinata IPFS | https://pinata.cloud |
