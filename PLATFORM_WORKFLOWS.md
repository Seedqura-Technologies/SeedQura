# Seedqura — Complete Platform Workflows & Functionalities

> Single reference for **everything** the Seedqura platform does: marketing site, Academy LMS, auth, payments, admin, emails, integrations, and deploy.

**Live site:** https://www.seedqura.com  
**Repo:** https://github.com/Seedqura-Technologies/SeedQura  

---

## 1. What Seedqura is

Seedqura is a **company website + Academy LMS** in one monorepo:

| Part | Purpose |
|------|---------|
| **Marketing site** | Brand, research (NeuroVision / healthcare & agriculture AI), team, contact, legal |
| **Academy** | Public course catalog, apply form, paid enrollment |
| **Student portal** | Dashboard, products, purchases, sessions, notifications |
| **Admin portal** | Students, courses, class sessions, enrollments, stats |
| **Backend API** | Auth-backed LMS APIs, Razorpay, Resend email, optional Google Calendar |

---

## 2. Repository structure

```
Seedqura/
├── Frontend/                 # Next.js 16 (App Router) — UI on port 3020
│   ├── src/app/              # Pages (marketing, auth, dashboard, admin)
│   ├── src/components/       # UI, shells, auth forms, sections
│   ├── src/lib/              # api.ts, supabase clients, middleware helpers
│   ├── src/content/legal/    # Privacy, terms, cookies, refund, disclaimer
│   └── data/                 # site.json, courses.json, team.json, legal.json
├── Backend/                  # Express API on port 3001
│   ├── src/routes/           # contact, apply, courses, payments, student, admin
│   ├── src/lib/              # mail, supabase, sessions, google-calendar, redis
│   ├── src/middleware/       # auth, rateLimit
│   ├── scripts/              # migrate, calendar verify/resync helpers
│   └── supabase/schema.sql   # Postgres schema
├── nginx/                    # Optional Docker reverse proxy
├── docker-compose.yml        # Optional full-stack / Redis
├── render.yaml               # Render Blueprint (Backend)
├── DEPLOY.md                 # Production deploy guide
├── PLATFORM.md               # Short LMS runbook
└── WEBSITE_DEVELOPER_GUIDE.md
```

### Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| Backend | Express, TypeScript |
| Auth + DB | Supabase Auth + Postgres |
| Payments | Razorpay (Checkout + verify + webhook) |
| Email | Resend |
| Calendar | Google Calendar API (optional) + `.ics` attachments |
| Rate limit | Redis (optional) or in-memory |
| Deploy | **Vercel** (Frontend) + **Render** (Backend) |

---

## 3. High-level architecture

```
Browser (seedqura.com)
    │
    ├─ Static / SSR pages ──────────────► Vercel (Frontend/)
    │
    └─ /api/* (same origin)
            │
            │  Next.js rewrites (next.config.ts)
            │  API_URL → https://…onrender.com
            ▼
       Render Express (Backend/)
            │
            ├─ Supabase Auth + Postgres
            ├─ Razorpay
            ├─ Resend
            └─ Google Calendar (optional)
```

- Browser never calls Render directly for LMS APIs — Vercel **rewrites** `/api/*` to `API_URL`.
- Auth cookies are set by Supabase on the frontend domain.
- Protected pages use Next middleware; APIs use Bearer JWT + `requireAuth` on Express.

---

## 4. All user-facing routes

### 4.1 Marketing (public)

| Route | What it does |
|-------|----------------|
| `/` | Home — hero, NeuroVision / domains, contact |
| `/about` | Company story + team |
| `/research` | Research narrative (healthcare / agri AI) |
| `/academy` | **Course catalog** (live DB courses, fallback `data/courses.json`) |
| `/apply` | Academy application form → `POST /api/apply` |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/cookies` | Cookie Policy |
| `/refund-policy` | Refund Policy |
| `/disclaimer` | Disclaimer |

**Nav:** Home · Research · About · Academy · Login / Dashboard|Admin  

**Note:** Older docs/emails may say `/products`. The live catalog page is **`/academy`**. Student dashboard still has a tab labeled “Products” that lists courses for enrollment.

### 4.2 Auth

| Route | What it does |
|-------|----------------|
| `/login` | Email/password login (Supabase) |
| `/signup` | Create account via backend register + auto sign-in |
| `/forgot-password` | Send password reset email |
| `/auth/callback` | Exchange OAuth/recovery `code` for session |
| `/auth/update-password` | Set new password after reset |
| `/auth/check-email` | “Check your inbox” helper page |

### 4.3 Student (auth required)

| Route | What it does |
|-------|----------------|
| `/dashboard` | Home — welcome, profile, upcoming classes, notifications |
| `/dashboard?tab=products` | Browse courses → Enroll / Inquire |
| `/dashboard?tab=purchased` | Paid/active enrollments + progress |
| `/enroll/[courseId]` | Razorpay checkout (or dev-complete without keys) |

### 4.4 Admin (auth + `role=admin` required)

| Route | What it does |
|-------|----------------|
| `/admin` | Stats: students, courses, enrollments, paid |
| `/admin/students` | Search/list students; suspend/activate |
| `/admin/students/[id]` | Student detail + enrollments |
| `/admin/courses` | Create / edit / delete / publish courses |
| `/admin/courses/[courseId]/sessions` | Schedule class sessions; notify students |
| `/admin/enrollments` | Manage paid enrollments (approve / reject / …) |

---

## 5. Roles & access control

| Role | Where stored | Can do |
|------|----------------|--------|
| **student** | `profiles.role` | Dashboard, enroll, pay, see sessions/notifications |
| **admin** | `profiles.role` | All student capabilities + full `/admin` + `/api/admin/*` |
| **suspended** | `profiles.status = suspended` | Login may work; **API returns 403** |

**Middleware** (`Frontend/src/middleware.ts`):

- Protects `/dashboard/*`, `/admin/*`, `/enroll/*` → redirect to `/login?next=…`
- Logged-in users on `/login`, `/signup`, `/forgot-password` → bounce to `/dashboard` or `/admin`

**API** (`Backend/src/middleware/auth.ts`):

- `requireAuth` — validates Bearer JWT via Supabase (+ short in-memory cache)
- `requireAdmin` — requires `profile.role === "admin"`

**Bootstrap admin:** set `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then:

```bash
cd Backend && npm run db:migrate
```

---

## 6. Complete workflows (step-by-step)

### 6.1 Student signup

```
1. User opens /signup
2. Accepts Terms + Privacy (LegalConsentCheckbox)
3. Frontend POST /api/student/register { email, password, fullName }
4. Backend:
   - Creates Supabase Auth user (email_confirm: true — no Supabase confirm mail)
   - Upserts profiles row (role: student, status: active)
   - Responds immediately
   - Background: Resend welcome email (includes password) + in-app "welcome" notification
5. Frontend signInWithPassword → navigate to /dashboard (or ?next=)
```

### 6.2 Login (student or admin)

```
1. /login → signInWithPassword
2. If destination is /dashboard and profile/metadata role is admin → /admin
3. Else → /dashboard (or safe ?next=)
4. Hard navigation (fast) so cookies apply cleanly
```

### 6.3 Forgot / reset password

```
1. /forgot-password → Supabase resetPasswordForEmail
   redirectTo = {origin}/auth/callback?next=/auth/update-password
2. User clicks email link → /auth/callback exchanges code
3. /auth/update-password → updateUser({ password })
4. Redirect to /login?reset=1
```

### 6.4 Browse & enroll (paid course)

```
1. /academy or /dashboard?tab=products
2. Click Enroll → /enroll/[courseId] (must be logged in)
3. Accept legal consent
4. POST /api/payments/order { courseId }
   - Creates/finds enrollment (pending_payment)
   - Creates Razorpay order (or returns devMode if keys missing)
5a. Production: Razorpay Checkout → POST /api/payments/verify (signature)
5b. Dev: POST /api/payments/verify { devComplete: true }
6. Backend activates enrollment (paid / active), records payment
7. Background: payment success email + enrollment confirmation email + notifications
8. Redirect → /dashboard?tab=purchased
9. If user closes Razorpay: POST /api/payments/failed
```

**Webhook (backup):** Razorpay → `POST /api/payments/webhook` on Render (`payment.captured`) also activates enrollment.

### 6.5 Student dashboard daily use

| Tab | Data source | Actions |
|-----|-------------|---------|
| **Home** | `GET /api/student/me` | See welcome, profile status, upcoming sessions, notifications; **Mark all read** |
| **Products** | `GET /api/courses` (lazy-loaded) | Enroll Now / Inquire |
| **Purchased** | enrollments from `/me` | View status, payment, progress %; session CTA |

Upcoming sessions = **active** enrollments ∩ `course_sessions` with `status=scheduled` and `starts_at >= now`.

### 6.6 Admin — manage courses

```
1. /admin/courses
2. Create course (id/slug, name, price_inr, status draft|published, …)
3. Publish when ready → appears on /academy and student Products
4. Delete or edit anytime
```

### 6.7 Admin — schedule a class (sessions)

**One-time sessions** (existing behavior):

```
1. /admin/courses/[courseId]/sessions → One-time tab
2. Add session → saves row + calendar + email + in-app notify immediately
3. Edit / delete similarly re-notifies
```

**Recurring schedules** (explicit publish — no email on draft/generate):

```
Draft Schedule
      ↓
Preview          POST …/schedules/preview
      ↓
Generate Sessions  POST …/schedules/:id/generate   (DB rows only)
      ↓
Admin Review
      ↓
Publish Schedule   POST …/schedules/:id/publish
      ↓
Per-session calendar invites (deliverSessionCalendarInvites)
      ↓
Schedule summary email + in-app notifications
```

| Status | Meaning |
|--------|---------|
| `draft` | Editable; sessions not shown to students as upcoming; no notify |
| `published` | Students see sessions; `published_at` / `published_by` set |
| `cancelled` | Soft-cancel; future sessions cancelled |

**Per-session calendar invite workflow** (`deliverSessionCalendarInvites`):

1. Find active, paid enrolled students (`getActiveCourseStudents`)
2. Upsert one Google Calendar event per session (patch when `google_event_id` exists)
3. Add student emails as attendees with `sendUpdates=all` when Workspace delegation allows
4. Store `google_event_id`, `calendar_sync_status`, `calendar_invite_via` (`google` | `ics_email` | `none`)
5. **Fallback:** if Google cannot invite external attendees (default service-account setup), send batched `.ics` emails via Resend per session

**Google limitation:** plain service accounts cannot email calendar invites to external students. Requires `GOOGLE_CALENDAR_IMPERSONATE_USER` + Domain-Wide Delegation — see `PLATFORM.md`. Emails do not claim Google invites unless `calendar_invite_via=google`.

- Structural edits on a **published** rule return it to **draft** (regenerate, then publish again).
- Publish is **idempotent**: calendar upserts patch existing events; schedule summary email skipped when `notify_email_sent_at` is set; ICS fallback skipped when `ics_invite_sent_at` is set.
- Publish sends **one** schedule summary email per student plus per-session calendar delivery (Google or `.ics`).
- Students’ upcoming list includes one-time sessions **or** sessions under a **published** rule only.

**Without Google Calendar env:** students receive `.ics` calendar attachments via Resend only.

### 6.8 Admin — enrollments

```
1. /admin/enrollments (defaults to payment_status=paid)
2. PATCH status: active | rejected | pending_payment | refunded
3. Approve/reject → decision email + in-app notification
```

### 6.9 Admin — students

```
1. /admin/students — search by name/email; filter active/suspended
2. /admin/students/[id] — profile + enrollments/payments
3. PATCH status → active | suspended
```

### 6.10 Contact & Apply (marketing forms)

```
Contact (home / #contact) → POST /api/contact  (rate-limited, logged)
Apply (/apply)           → POST /api/apply    (rate-limited, logged)
```

Both require legal consent checkboxes. Delivery today is primarily **server log** (webhook env vars reserved for future).

### 6.11 Cookies / consent

- Site-wide `CookieConsent` banner (localStorage `seedqura-consent`)
- Signup, enroll, contact, apply require explicit Terms/Privacy acceptance
- Consent version tracked via `Frontend/data/legal.json`

---

## 7. Backend API reference

Base URL (via rewrite): `https://www.seedqura.com/api/...` → Express.

Health: **`GET /health`**

### Public

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/contact` | Contact form |
| `POST` | `/api/apply` | Academy apply form |
| `GET` | `/api/courses` | Published courses |
| `GET` | `/api/courses/:id` | One published course |

### Student (`Authorization: Bearer <access_token>` unless noted)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/student/register` | No | Create student account |
| `POST` | `/api/student/welcome-email` | No | Deprecated welcome resend |
| `GET` | `/api/student/me` | Yes | Profile, enrollments, notifications, upcoming sessions |
| `PATCH` | `/api/student/me` | Yes | Update full_name, phone |
| `POST` | `/api/student/notifications/:id/read` | Yes | Mark one read |
| `POST` | `/api/student/notifications/read-all` | Yes | Mark all read |

### Payments

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/payments/order` | Yes | Create order + enrollment |
| `POST` | `/api/payments/verify` | Yes | Verify payment / activate |
| `POST` | `/api/payments/failed` | Yes | Mark failed |
| `POST` | `/api/payments/webhook` | Razorpay signature | Capture → activate |

### Admin (auth + admin role)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/stats` | Counts (short cache) |
| `GET` | `/api/admin/students` | List (`q`, `status`) |
| `GET` | `/api/admin/students/:id` | Detail |
| `PATCH` | `/api/admin/students/:id` | Suspend / activate |
| `GET` | `/api/admin/courses` | All courses |
| `POST` | `/api/admin/courses` | Create |
| `PATCH` | `/api/admin/courses/:id` | Update |
| `DELETE` | `/api/admin/courses/:id` | Delete |
| `GET` | `/api/admin/enrollments` | List |
| `PATCH` | `/api/admin/enrollments/:id` | Change status + notify |
| `GET` | `/api/admin/courses/:courseId/sessions` | List sessions |
| `POST` | `/api/admin/courses/:courseId/sessions` | Create + notify |
| `PATCH` | `/api/admin/sessions/:id` | Update + notify |
| `DELETE` | `/api/admin/sessions/:id` | Cancel-notify + delete |

---

## 8. Database (Supabase Postgres)

Core tables (see `Backend/supabase/schema.sql`):

| Table | Purpose |
|-------|---------|
| `profiles` | id (auth user), full_name, email, role, status, phone |
| `courses` | Catalog: pricing, publish status, display_status, features, … |
| `enrollments` | user ↔ course; status; payment_status; progress_pct |
| `payments` | Razorpay order/payment ids, amounts, status |
| `notifications` | In-app alerts (type, title, body, read_at) |
| `course_sessions` | Scheduled classes; meeting_url; calendar event id |

---

## 9. Email & notification matrix

| Trigger | Resend email | In-app `type` |
|---------|--------------|---------------|
| Register | Welcome + credentials | `welcome` |
| Payment success | Payment confirmed + enrollment confirmed | `payment_success` |
| Payment failed | Payment failed | `payment_failed` |
| Admin approve/reject | Decision email | `enrollment_approved` / `enrollment_rejected` |
| Session create/update/cancel/reschedule | Session email (+ `.ics` when relevant) | `session_created` / `session_updated` / `session_cancelled` / `session_rescheduled` |
| Schedule publish | Schedule published email | `schedule_published` |
| Session or schedule calendar sync failure (student-facing) | — | `calendar_sync_failed` |
| Enrollment activate / reject / refund | Calendar add/remove (no dedicated email) | — |

**Student notification payload** (`GET /api/student/me` → `notifications[]`): each item includes `title`, `body`, `type`, `read` / `readAt`, `timestamp` (`created_at`), optional `course` `{ id, name }`, optional `session` `{ id, title }`, and sanitized `metadata` (operational fields like `googleEventId` / raw sync errors are stripped). Mark one read: `POST /api/student/notifications/:id/read`; mark all: `POST /api/student/notifications/read-all`.

**Scheduling security controls:**
- All `/api/admin/*` schedule/session routes require `requireAuth` + `requireAdmin`.
- Students have no session mutation routes; RLS on `course_sessions` is SELECT-only and limited to active enrollments **and** published/announced sessions (draft recurring rows and meeting URLs are not readable via PostgREST).
- `course_schedule_rules` SELECT is admin-only.
- Google Calendar credentials and Supabase service role stay in backend env only.
- Meeting URLs must be `http(s)` on schedule and session create/edit.
- Schedule publish is rate-limited (`schedule_publish`) in addition to admin auth.
- Calendar log / student notification paths sanitize provider errors so secrets are not returned to clients.

**Enrollment calendar sync:** `syncEnrollmentCalendar(enrollmentId)` adds the student to future published session events on activation, removes them on reject/refund. Status tracked on `enrollments.calendar_sync_status`; retry via `POST /admin/enrollments/:id/sync-calendar`.

**Offline E2E:** `npm run test:e2e` runs `schedule-e2e-scenario.test.ts` (AI/ML Foundation Sat+Sun scenario with mocked Supabase/Google/Resend) covering publish, edit, cancel, mid-course catch-up, duplicate guards, and failure modes.

**Session calendar retry:** Failed or pending Google sync on published future sessions can be retried via `POST /admin/sessions/:id/retry-calendar-sync`. Patches existing `google_event_id` when valid; recreates only if Google reports the event missing. Status on `course_sessions.calendar_sync_status` with `calendar_sync_error` for admin display.

**Schedule Manager (`/admin/schedules`):** Operational dashboard via `GET /admin/schedule-dashboard` with filters (course, date range, instructor, status, calendar sync status). Shows stats, all sessions, recurring schedules, and actions (create, preview, publish, edit, reschedule, cancel, retry sync).

Templates live in `Backend/src/lib/mail.ts` (branded HTML).

---

## 10. Integrations checklist

| Service | Required? | Used for |
|---------|-----------|----------|
| **Supabase** | Yes | Auth + DB |
| **Razorpay** | For real payments | Orders, Checkout, verify, webhook |
| **Resend** | For real email | All transactional mail (`MAIL_FROM`) |
| **Google Calendar** | Optional | Calendar events for sessions |
| **Redis** | Optional | Distributed rate limits (contact/apply/register) |

---

## 11. Environment variables

### Frontend (`Frontend/.env.local`)

| Variable | Purpose |
|----------|---------|
| `API_URL` | Backend origin for rewrites (**needed at Vercel build time**) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Checkout key |

### Backend (`Backend/.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | Default `3001` |
| `FRONTEND_URL` | CORS origin (e.g. `https://www.seedqura.com`) |
| `NEXT_PUBLIC_SITE_URL` | Links inside emails |
| `NEXT_PUBLIC_SUPABASE_URL` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin access |
| `SUPABASE_DB_PASSWORD` / `DATABASE_URL` | Migrations |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First admin via migrate |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verify |
| `RESEND_API_KEY` / `MAIL_FROM` | Email |
| `REDIS_URL` | Optional rate limiting |
| `GOOGLE_CLIENT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_CALENDAR_ID` | Optional calendar |
| `SESSION_TIMEZONE` | Default `Asia/Kolkata` |

Never commit real `.env` / `.env.local` files.

---

## 12. Local development

```bash
# Terminal 1 — Backend
cd Backend
cp .env.example .env   # fill secrets
npm install
npm run db:migrate     # first time
npm run dev            # http://localhost:3001

# Terminal 2 — Frontend
cd Frontend
cp .env.local.example .env.local
# set API_URL=http://localhost:3001
npm install
npm run dev            # http://localhost:3020
```

Without Razorpay keys, enroll uses **devComplete** path so you can test activation locally.

---

## 13. Production deploy

### Recommended: Vercel + Render

| Piece | Host | Root |
|-------|------|------|
| Frontend | Vercel | `Frontend/` |
| Backend | Render (`render.yaml`) | `Backend/` |
| Domain | seedqura.com → Vercel | |

1. Set Frontend `API_URL` to Render URL (no trailing slash) — **build + runtime**.
2. Set Backend `FRONTEND_URL=https://www.seedqura.com`.
3. Supabase Auth Site URL + redirect: `https://www.seedqura.com`, `…/auth/callback`.
4. Razorpay webhook URL → **Render** `/api/payments/webhook`.
5. Resend: verify domain; set `MAIL_FROM=Seedqura <hello@yourdomain>`.

Full steps: **[DEPLOY.md](./DEPLOY.md)**. Short LMS notes: **[PLATFORM.md](./PLATFORM.md)**.

### Alternatives

- Docker Compose `prod` profile (nginx + FE + BE + redis)
- PM2 (`ecosystem.config.cjs`) on a VPS

---

## 14. UI / theme system

- Dark design system in `Frontend/src/app/globals.css` (surfaces, accent `#22D3A5`, glass cards, nav-link, input-premium, btn-admin, …)
- Marketing: `SiteShell` (header/footer)
- Student/Admin: shared `AppShell` via `DashboardShell` / `AdminShell`
- Brand assets: `/logo.png`, `/logo-mark.png`, favicons, OG image

---

## 15. Performance notes (current)

Implemented to keep login/dashboard fast:

- Token cache in `apiFetch`; singleton Supabase browser client
- Middleware uses cookie `getSession` (APIs still validate JWT)
- Dashboard loads `/student/me` first; courses only on Products tab
- `/student/me` runs enrollments + notifications in parallel
- Short auth cache + admin stats cache on backend
- Next.js rewrites remove an extra serverless proxy hop

---

## 16. Not shipped yet (placeholders / future)

- Learning materials library
- Certificates
- Email-template admin UI
- Live contact/apply webhook delivery (env reserved; handlers log today)
- Dedicated `/products` marketing page (use `/academy`)

---

## 17. Quick “who does what” map

| Actor | Primary paths |
|-------|----------------|
| Visitor | `/`, `/about`, `/research`, `/academy`, `/apply`, legal pages |
| Student | `/signup` → `/login` → `/dashboard` → `/enroll/[id]` → purchased + sessions |
| Admin | `/login` → `/admin` → students / courses / sessions / enrollments |
| System | Resend emails, notifications, Razorpay webhook, optional Google Calendar |

---

## 18. Key source files (cheat sheet)

| Area | Path |
|------|------|
| Student API | `Backend/src/routes/student.ts` |
| Admin API | `Backend/src/routes/admin.ts` |
| Payments | `Backend/src/routes/payments.ts` |
| Auth middleware | `Backend/src/middleware/auth.ts` |
| Email | `Backend/src/lib/mail.ts` |
| Sessions + calendar | `Backend/src/lib/sessions.ts`, `google-calendar.ts` |
| Schema | `Backend/supabase/schema.sql` |
| Login / Signup | `Frontend/src/components/auth/*` |
| Student dashboard | `Frontend/src/app/dashboard/DashboardClient.tsx` |
| App shell | `Frontend/src/components/layout/AppShell.tsx` |
| API client | `Frontend/src/lib/api.ts` |
| Rewrites | `Frontend/next.config.ts` |
| Middleware | `Frontend/src/middleware.ts` |

---

*This file is the master workflow map. For deploy specifics use `DEPLOY.md`; for a short LMS ops checklist use `PLATFORM.md`.*
