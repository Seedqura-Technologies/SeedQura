# Seedqura LMS Platform runbook

## Stack

- **Frontend:** Next.js App Router (`Frontend/`, PM2 `seedqura-frontend`, port **3020**)
- **Backend:** Express (`Backend/`, PM2 `seedqura-backend`, port **3001**)
- **Auth + DB:** Supabase Auth + Postgres
- **Payments:** Razorpay (order → checkout → verify + webhook)
- **Email:** Resend (`RESEND_API_KEY`, `MAIL_FROM`)
- **Calendar:** Google Calendar API (optional service account) + `.ics` email fallback

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

**One-time:** create/update/cancel notifies enrolled students. Calendar invites use Google when supported, otherwise `.ics` via Resend.

**Recurring:** Draft → Preview → Generate → Review → **Publish**. Publish runs the per-session calendar invite workflow and sends one schedule summary email per student.

Statuses: `draft` | `published` | `cancelled` (`published_at`, `published_by`).

### Student calendar invitations

For every **published** session, the backend (`deliverSessionCalendarInvites`):

1. Finds active, paid, non-suspended enrolled students
2. Creates/updates **one** Google Calendar event per session (patch when `google_event_id` exists)
3. Adds student emails as attendees with `sendUpdates=all` when supported
4. Stores `google_event_id`, `calendar_sync_status`, `calendar_invite_via`
5. Falls back to batched `.ics` emails when Google cannot invite attendees

**Credentials stay on the backend** — students never receive service account keys.

#### Google Calendar setup (service account)

```bash
GOOGLE_CLIENT_EMAIL=...@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=calendar-id@group.calendar.google.com
```

Share the calendar with the service account (**Make changes to events**).

#### Important limitation — external attendee invitations

A **plain** Google Cloud service account **cannot** send calendar invitation emails to external student addresses (e.g. personal Gmail). The Calendar API returns a delegation/forbidden error when adding attendees with `sendUpdates=all`.

When that happens, Seedqura:

- Still creates the organizer event on the shared calendar (`calendar_sync_status=synced`)
- Sets `calendar_invite_via=ics_email`
- Sends each student a **separate `.ics` attachment** via Resend (batched)

**Do not claim Google Calendar invitations are working** unless you have verified invites arrive in a test inbox.

#### Enabling real Google attendee invitations (Google Workspace)

Requires **Domain-Wide Delegation** so the service account impersonates a Workspace user:

1. In Google Cloud Console → service account → enable Domain-Wide Delegation
2. In Workspace Admin → Security → API controls → Domain-wide delegation, authorize the client ID with scope `https://www.googleapis.com/auth/calendar`
3. Add to `Backend/.env`:

```bash
GOOGLE_CALENDAR_IMPERSONATE_USER=organizer@your-workspace-domain.com
```

The impersonated user must own or manage `GOOGLE_CALENDAR_ID`. With this configured, `calendar_invite_via=google` and Google emails invitations to external attendees.

#### Without any Google env vars

Sessions still work — students receive `.ics` calendar attachments via Resend only (`calendar_sync_status=pending`, `calendar_invite_via=ics_email`).

## Email

Welcome/credentials, payment, enrollment, and session emails go through Resend. Verify a sending domain in Resend before mailing arbitrary addresses.

## Still later

Certificates, learning materials library, email-template admin UI.
