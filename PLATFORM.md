# Seedqura LMS Platform runbook

## Stack

- **Frontend:** Next.js App Router (`Frontend/`, PM2 `seedqura-frontend`, port **3020**)
- **Backend:** Express (`Backend/`, PM2 `seedqura-backend`, port **3001**)
- **Auth + DB:** Supabase Auth + Postgres
- **Payments:** Razorpay (order → checkout → verify + webhook)
- **Email:** Resend (`RESEND_API_KEY`, `MAIL_FROM`)
- **Calendar:** Google Calendar API (optional service account) + ICS attachments

## First-time setup

1. Copy env examples and fill secrets (do not commit real `.env` files):

```bash
cp Backend/.env.example Backend/.env
cp Frontend/.env.local.example Frontend/.env.local
```

2. Apply schema, seed published courses, bootstrap admin:

```bash
cd Backend && npm run db:migrate
```

Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and either `DATABASE_URL` or `SUPABASE_DB_PASSWORD`.

3. Build and restart:

```bash
cd Backend && npx tsc --noEmit
cd ../Frontend && npm run build
pm2 restart seedqura-backend seedqura-frontend --update-env
```

## Key routes

| Area | Paths |
|------|--------|
| Public catalog | `/products` — Enroll Now → `/enroll/[courseId]` |
| Auth | `/login`, `/signup` |
| Student | `/dashboard` (home / products / purchased + upcoming sessions) |
| Admin | `/admin`, students, courses, **Sessions** (`/admin/courses/[id]/sessions`), enrollments |
| API | `/api/courses`, `/api/payments/*`, `/api/student/*`, `/api/admin/*` |

## Phase 2 — Scheduling

Admin → Courses → **Sessions**:

1. Create/update/cancel a class session (title, time, instructor, meeting URL)
2. All **active enrolled** students get a **Resend** email + in-app notification
3. An **`.ics`** invite is attached (works with Google Calendar / Outlook)
4. If Google is configured, the event is also created/updated on `GOOGLE_CALENDAR_ID` with students as attendees (`sendUpdates=all`)

### Google Calendar setup

1. Create a Google Cloud service account
2. Enable Calendar API
3. Create/share a calendar with the service account (Make changes to events)
4. Set in `Backend/.env`:

```bash
GOOGLE_CLIENT_EMAIL=...@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary-or-calendar-id@group.calendar.google.com
```

Without these vars, sessions still work — students get Resend + ICS only.

## Email

Welcome/credentials, payment, enrollment, and session emails go through Resend. Verify a sending domain in Resend before mailing arbitrary addresses.

## Still later

Certificates, learning materials library, email-template admin UI.
