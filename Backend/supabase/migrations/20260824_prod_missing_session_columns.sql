-- Apply in Supabase Dashboard → SQL Editor (production).
-- Idempotent: safe to re-run.
-- Fixes Schedule Manager 500 caused by missing session columns.

-- Calendar sync retry metadata
alter table public.course_sessions
  add column if not exists calendar_sync_error text;
alter table public.course_sessions
  add column if not exists calendar_sync_attempted_at timestamptz;
alter table public.course_sessions
  add column if not exists calendar_synced_at timestamptz;

create index if not exists course_sessions_calendar_sync_failed_idx
  on public.course_sessions (course_id, calendar_sync_status)
  where calendar_sync_status = 'failed';

-- Session cancellation fields
alter table public.course_sessions
  add column if not exists cancellation_reason text;
alter table public.course_sessions
  add column if not exists cancelled_at timestamptz;
alter table public.course_sessions
  add column if not exists replacement_planned text;

do $$ begin
  alter table public.course_sessions
    drop constraint if exists course_sessions_replacement_planned_check;
  alter table public.course_sessions
    add constraint course_sessions_replacement_planned_check
    check (
      replacement_planned is null
      or replacement_planned in ('yes', 'no', 'unknown')
    );
exception when others then null;
end $$;

-- Session reschedule audit (if missing)
create table if not exists public.course_session_reschedules (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  previous_starts_at timestamptz not null,
  previous_ends_at timestamptz not null,
  new_starts_at timestamptz not null,
  new_ends_at timestamptz not null,
  mode text not null default 'in_place'
    check (mode in ('in_place', 'replacement_created')),
  note text,
  replacement_session_id uuid references public.course_sessions (id) on delete set null,
  rescheduled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.course_session_reschedules enable row level security;

alter table public.course_sessions
  add column if not exists rescheduled_from_session_id uuid
    references public.course_sessions (id) on delete set null;
