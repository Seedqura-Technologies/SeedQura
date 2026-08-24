-- Additive migration: recurring course schedule rules
-- Applied automatically when `npm run db:migrate` runs Backend/supabase/schema.sql.
-- This file is the standalone delta for review / manual apply on an existing DB.
-- Safe to re-run (idempotent: IF NOT EXISTS / exception-guarded constraints).

-- ---------------------------------------------------------------------------
-- course_schedule_rules
-- ---------------------------------------------------------------------------
-- days_of_week: 0=Sunday … 6=Saturday (JS Date.getDay()).
-- Times are local wall-clock in `timezone`; occurrences expand into course_sessions.

create table if not exists public.course_schedule_rules (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days_of_week smallint[] not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Kolkata',
  title text not null,
  instructor_name text not null default '',
  meeting_url text,
  location text not null default '',
  description text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'cancelled')),
  created_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  published_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (end_time > start_time),
  check (cardinality(days_of_week) >= 1),
  check (days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[])
);

create index if not exists course_schedule_rules_course_idx
  on public.course_schedule_rules (course_id, start_date);
create index if not exists course_schedule_rules_status_idx
  on public.course_schedule_rules (status);
create index if not exists course_schedule_rules_created_by_idx
  on public.course_schedule_rules (created_by);

alter table public.course_schedule_rules enable row level security;

drop policy if exists "Admins read course schedule rules" on public.course_schedule_rules;
create policy "Admins read course schedule rules"
  on public.course_schedule_rules for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- course_sessions extensions
-- ---------------------------------------------------------------------------
-- Keep existing google_event_id (do not add a duplicate Google id column).

alter table public.course_sessions
  add column if not exists schedule_rule_id uuid
    references public.course_schedule_rules (id) on delete set null;

alter table public.course_sessions
  add column if not exists calendar_sync_status text;

alter table public.course_sessions
  add column if not exists calendar_event_status text;

update public.course_sessions
set calendar_sync_status = coalesce(
  calendar_sync_status,
  case
    when google_event_id is not null and google_event_id <> '' then 'synced'
    else 'pending'
  end
)
where calendar_sync_status is null;

update public.course_sessions
set calendar_event_status = coalesce(
  calendar_event_status,
  case
    when status = 'cancelled' then 'cancelled'
    when google_event_id is not null and google_event_id <> '' then 'confirmed'
    else 'none'
  end
)
where calendar_event_status is null;

alter table public.course_sessions
  alter column calendar_sync_status set default 'pending';
alter table public.course_sessions
  alter column calendar_event_status set default 'none';

do $$ begin
  alter table public.course_sessions
    alter column calendar_sync_status set not null;
exception when others then null;
end $$;

do $$ begin
  alter table public.course_sessions
    alter column calendar_event_status set not null;
exception when others then null;
end $$;

do $$ begin
  alter table public.course_sessions
    drop constraint if exists course_sessions_calendar_sync_status_check;
  alter table public.course_sessions
    add constraint course_sessions_calendar_sync_status_check
    check (calendar_sync_status in ('pending', 'synced', 'failed', 'cancelled'));
exception when others then null;
end $$;

do $$ begin
  alter table public.course_sessions
    drop constraint if exists course_sessions_calendar_event_status_check;
  alter table public.course_sessions
    add constraint course_sessions_calendar_event_status_check
    check (calendar_event_status in ('none', 'confirmed', 'cancelled'));
exception when others then null;
end $$;

create index if not exists course_sessions_schedule_rule_idx
  on public.course_sessions (schedule_rule_id);
create index if not exists course_sessions_calendar_sync_idx
  on public.course_sessions (calendar_sync_status);

create unique index if not exists course_sessions_rule_starts_uidx
  on public.course_sessions (schedule_rule_id, starts_at)
  where schedule_rule_id is not null;

alter table public.course_sessions
  add column if not exists notify_sent_at timestamptz;

alter table public.course_schedule_rules
  add column if not exists notify_email_sent_at timestamptz;

create index if not exists course_sessions_notify_sent_idx
  on public.course_sessions (notify_sent_at)
  where notify_sent_at is not null;
