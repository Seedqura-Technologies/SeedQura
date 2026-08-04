# Deploy Seedqura — Vercel + Render + seedqura.com

Target setup:

```
https://seedqura.com          → Vercel (Frontend/)
https://api.seedqura.com      → Render  (Backend/)   [optional custom domain]
  or https://seedqura-api.onrender.com
```

Browser → Vercel `/api/*` → proxies server-side to Render via `API_URL`.

---

## 0. Before you start

Have ready:

- GitHub repo: `https://github.com/seedqura/seedqura`
- Supabase project URL, anon key, **service role** key, DB password
- Razorpay key id + secret (+ webhook secret when you enable webhooks)
- Resend API key (verify domain `seedqura.com` in Resend)
- Admin email/password for first migrate

Run DB migrate once against production Supabase (from your machine):

```bash
cd Backend
cp .env.example .env
# fill Supabase + ADMIN_* + NEXT_PUBLIC_SITE_URL=https://seedqura.com
npm install
npm run db:migrate
```

---

## 1. Deploy backend on Render

1. Go to [Render](https://dashboard.render.com) → **New** → **Blueprint** (or **Web Service**).
2. Connect `seedqura/seedqura`.
3. If using Blueprint, apply root `render.yaml`.
4. If creating a Web Service manually:

| Setting | Value |
|---------|--------|
| Root Directory | `Backend` |
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

5. Environment variables:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://seedqura.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://seedqura.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |
| `SUPABASE_DB_PASSWORD` | DB password |
| `ADMIN_EMAIL` | e.g. `admin@seedqura.com` |
| `ADMIN_PASSWORD` | strong password |
| `RAZORPAY_KEY_ID` | … |
| `RAZORPAY_KEY_SECRET` | … |
| `RAZORPAY_WEBHOOK_SECRET` | … (after webhook setup) |
| `RESEND_API_KEY` | … |
| `MAIL_FROM` | `Seedqura <hello@seedqura.com>` |
| `REDIS_URL` | optional (Upstash) |
| `SESSION_TIMEZONE` | `Asia/Kolkata` |

6. Deploy. Copy the service URL, e.g. `https://seedqura-api.onrender.com`.
7. Open `https://YOUR-RENDER-URL/health` — expect `{ "ok": true, ... }`.

### Optional: `api.seedqura.com` on Render

1. Render service → **Custom Domains** → `api.seedqura.com`
2. At your DNS provider, add the CNAME Render shows (usually to `*.onrender.com`).

---

## 2. Deploy frontend on Vercel

1. Go to [Vercel](https://vercel.com) → **Add New Project** → import `seedqura/seedqura`.
2. Configure:

| Setting | Value |
|---------|--------|
| Framework Preset | Next.js |
| Root Directory | `Frontend` |
| Build Command | `npm run build` (default) |
| Output | default |

3. Environment variables:

| Key | Value | Notes |
|-----|--------|--------|
| `API_URL` | `https://seedqura-api.onrender.com` (or `https://api.seedqura.com`) | **No** trailing slash. Server-only. |
| `NEXT_PUBLIC_SITE_URL` | `https://seedqura.com` | |
| `NEXT_PUBLIC_SUPABASE_URL` | same as backend | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key id | Client checkout |

4. Deploy. You get a `*.vercel.app` URL first — confirm the site loads.

---

## 3. Attach domain `seedqura.com` (Vercel)

1. Vercel project → **Settings** → **Domains** → add:
   - `seedqura.com`
   - `www.seedqura.com` (redirect www → apex, or the reverse — pick one)
2. At your domain registrar DNS for `seedqura.com`, add what Vercel shows, typically:

| Type | Name | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` (confirm in Vercel UI) |
| CNAME | `www` | `cname.vercel-dns.com` (confirm in Vercel UI) |

3. Wait for SSL (usually minutes). Open `https://seedqura.com`.

4. Keep `FRONTEND_URL` / `NEXT_PUBLIC_SITE_URL` as **`https://seedqura.com`** (exact match — no `www` if you redirect www away).

---

## 4. Wire external services

### Supabase Auth

Dashboard → Authentication → URL configuration:

- **Site URL:** `https://seedqura.com`
- **Redirect URLs:**  
  `https://seedqura.com/**`  
  `https://seedqura.com/auth/callback`

### Razorpay webhook

Point to the **backend** (not Vercel):

`https://YOUR-RENDER-URL/api/payments/webhook`  
(or `https://api.seedqura.com/api/payments/webhook`)

### Resend

Verify domain `seedqura.com`, then use `MAIL_FROM=Seedqura <hello@seedqura.com>`.

---

## 5. Smoke test

- [ ] `https://seedqura.com` loads  
- [ ] `/products` shows courses  
- [ ] Contact / Apply submit without 500  
- [ ] Signup / Login  
- [ ] `/dashboard` after login  
- [ ] Enroll + payment (or dev bypass if Razorpay keys empty)  
- [ ] Admin login → `/admin`  
- [ ] Render `/health` OK  

---

## Notes

- **Render free tier** sleeps after idle; first request can take ~30s. Upgrade if you need always-on.
- Do **not** put the Render URL in `NEXT_PUBLIC_*` unless you intentionally want the browser to call the API directly.
- Secrets (`.env`, service role, Razorpay) stay in Vercel/Render dashboards — never commit them.
