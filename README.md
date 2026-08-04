# Seedqura — Website Repository

Official repository for the **Seedqura** company website.

## Project structure

```
Seedqura/
├── Frontend/          # Next.js marketing site (3 pages + apply)
├── Backend/           # Express API (contact + apply forms)
├── nginx/             # Reverse proxy config (production Docker)
├── docker-compose.yml # Optional infra — not required for daily dev
└── WEBSITE_DEVELOPER_GUIDE.md
```

## Quick start (local dev — no Docker)

Daily UI work runs lightweight: just the frontend. Backend only when testing forms.

### Frontend

```bash
cd Frontend
npm install
cp .env.local.example .env.local
npm run dev
# Open http://localhost:3020
```

### Backend (optional — for form submissions)

```bash
cd Backend
npm install
cp .env.example .env
npm run dev
# Runs on http://localhost:3001
```

Set `API_URL=http://localhost:3001` in `Frontend/.env.local` when testing forms locally.

**No Redis required for local dev.** Rate limiting falls back to in-memory automatically.

## Pages

| Route | Content |
|-------|---------|
| `/` | Home — Hero, Technology, products preview, Contact |
| `/about` | Company story, principles, team |
| `/products` | Course catalog — Academy, courses, partnerships |
| `/research` | ASCII texture hero + publications |
| `/apply` | Seedqura Academy application form |

## Editing content

All editable content lives in `Frontend/data/`:

| File | What to edit |
|------|--------------|
| `site.json` | Company name, email, phone, location, social links |
| `team.json` | Team member names, roles, bios, initials |
| `products.json` | Legacy product cards (optional) |
| `courses.json` | Course catalog — pricing, features, CTAs |
| `focus-areas.json` | Focus area cards |

## Deployment options

### Option A — Vercel + PaaS backend (simplest)

- **Frontend:** Deploy `Frontend/` to [Vercel](https://vercel.com)
  - Set `API_URL` to your backend URL
- **Backend:** Deploy `Backend/` to Railway, Render, or similar
  - Set `FRONTEND_URL` to your Vercel domain
  - Optional: add [Upstash Redis](https://upstash.com) and set `REDIS_URL` for distributed rate limiting

No nginx needed — Vercel is the CDN/reverse proxy for the frontend.

### Option B — Self-hosted Docker (full stack)

For staging or production on your own server:

```bash
# Redis only (when testing rate limits locally)
docker compose --profile infra up -d

# Full stack: nginx + redis + frontend + backend
docker compose --profile prod up -d --build
```

Site available at `http://localhost` (nginx on port 80).

| Service | Internal port | Role |
|---------|---------------|------|
| nginx | 80 | Reverse proxy, gzip, static caching |
| frontend | 3020 | Next.js |
| backend | 3001 | Express API |
| redis | 6379 | Rate limiting, future job queue |

Environment variables for prod compose:

```bash
FRONTEND_URL=http://localhost   # or your domain
```

### Option C — Hybrid local testing

```bash
# Terminal 1 — Redis only
docker compose --profile infra up -d

# Terminal 2 — Backend with Redis
cd Backend
REDIS_URL=redis://localhost:6379 npm run dev

# Terminal 3 — Frontend
cd Frontend
npm run dev
```

## Environment variables

### Frontend (`Frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `API_URL` | For forms | Backend URL for server-side proxy routes |

### Backend (`Backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default `3001` |
| `FRONTEND_URL` | Yes (prod) | CORS origin |
| `REDIS_URL` | No | When unset, uses in-memory rate limiting |
| `CONTACT_WEBHOOK_URL` | No | Future async webhook delivery |
| `APPLY_WEBHOOK_URL` | No | Future async webhook delivery |

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| Backend | Express, TypeScript, Redis (optional), rate-limiter-flexible |
| Infra | Docker Compose, nginx, Redis 7 |

## Full specification

👉 **[WEBSITE_DEVELOPER_GUIDE.md](./WEBSITE_DEVELOPER_GUIDE.md)**
