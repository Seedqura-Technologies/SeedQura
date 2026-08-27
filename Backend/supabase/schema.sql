-- Seedqura LMS Phase 1 schema
-- Safe to re-run: creates missing objects and upgrades prior platform tables.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  role text not null default 'student' check (role in ('student', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists status text;
alter table public.profiles add column if not exists phone text;
update public.profiles set status = 'active' where status is null or status = '';
alter table public.profiles alter column status set default 'active';
do $$ begin
  alter table public.profiles alter column status set not null;
exception when others then null;
end $$;
do $$ begin
  alter table public.profiles drop constraint if exists profiles_status_check;
  alter table public.profiles
    add constraint profiles_status_check
    check (status in ('active', 'suspended'));
exception when others then null;
end $$;

-- ---------------------------------------------------------------------------
-- Courses (upgrade display_status + publish lifecycle)
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id text primary key,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  category text not null default 'Course',
  level text not null default '',
  duration text not null default '',
  format text not null default '',
  schedule_summary text not null default '',
  price_inr integer,
  currency text not null default 'INR',
  price_display text not null default '',
  banner_url text,
  status text not null default 'draft',
  display_status text not null default 'Open',
  seat_limit integer,
  registration_deadline date,
  featured boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.courses add column if not exists schedule_summary text;
alter table public.courses add column if not exists banner_url text;
alter table public.courses add column if not exists display_status text;
alter table public.courses add column if not exists seat_limit integer;
alter table public.courses add column if not exists registration_deadline date;
alter table public.courses add column if not exists updated_at timestamptz;
update public.courses set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
alter table public.courses alter column updated_at set default now();

-- Move legacy marketing status strings into display_status, then normalize status
update public.courses
set display_status = coalesce(nullif(display_status, ''), nullif(status, ''), 'Open')
where display_status is null
   or display_status = ''
   or status not in ('draft', 'published', 'archived');

update public.courses
set status = case
  when status in ('draft', 'published', 'archived') then status
  when price_inr is not null and price_inr > 0 then 'published'
  when lower(coalesce(display_status, '')) like '%coming%' then 'draft'
  when lower(coalesce(display_status, '')) like '%inquiry%' then 'draft'
  else 'published'
end
where status not in ('draft', 'published', 'archived');

update public.courses set schedule_summary = coalesce(schedule_summary, '') where schedule_summary is null;
update public.courses set display_status = coalesce(display_status, 'Open') where display_status is null;
alter table public.courses alter column schedule_summary set default '';
alter table public.courses alter column display_status set default 'Open';

do $$ begin
  alter table public.courses drop constraint if exists courses_status_check;
  alter table public.courses
    add constraint courses_status_check
    check (status in ('draft', 'published', 'archived'));
exception when others then null;
end $$;

-- ---------------------------------------------------------------------------
-- Enrollments (Phase 1 shape). Recreate if still on legacy application model.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'enrollments'
      and column_name = 'application_id'
  ) or exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payments'
      and column_name = 'application_id'
  ) then
    drop table if exists public.payments cascade;
    drop table if exists public.enrollments cascade;
  end if;
end $$;

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'active', 'rejected', 'refunded')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'awaiting_verification', 'paid', 'failed', 'refunded')),
  progress_pct integer not null default 0 check (progress_pct between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.enrollments add column if not exists payment_status text;
alter table public.enrollments add column if not exists progress_pct integer;
alter table public.enrollments add column if not exists updated_at timestamptz;
alter table public.enrollments add column if not exists calendar_sync_status text not null default 'pending';
alter table public.enrollments add column if not exists calendar_synced_at timestamptz;
alter table public.enrollments add column if not exists calendar_sync_error text;
alter table public.enrollments add column if not exists calendar_sync_attempted_at timestamptz;
alter table public.enrollments add column if not exists utr text;
alter table public.enrollments add column if not exists institution text;
alter table public.enrollments add column if not exists degree text;
alter table public.enrollments add column if not exists year_of_study text;
alter table public.enrollments add column if not exists applicant_phone text;
alter table public.enrollments add column if not exists applicant_name text;
alter table public.enrollments add column if not exists utr_submitted_at timestamptz;

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'enrollments'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%payment_status%'
  loop
    execute format(
      'alter table public.enrollments drop constraint %I',
      r.conname
    );
  end loop;

  begin
    alter table public.enrollments
      add constraint enrollments_payment_status_check
      check (
        payment_status in (
          'pending',
          'awaiting_verification',
          'paid',
          'failed',
          'refunded'
        )
      );
  exception
    when duplicate_object then null;
  end;
end $$;

create index if not exists enrollments_utr_idx
  on public.enrollments (utr)
  where utr is not null and utr <> '';

create index if not exists enrollments_awaiting_verification_idx
  on public.enrollments (payment_status, created_at desc)
  where payment_status = 'awaiting_verification';

update public.enrollments set payment_status = coalesce(payment_status, 'pending');
update public.enrollments set progress_pct = coalesce(progress_pct, 0);
update public.enrollments set updated_at = coalesce(updated_at, created_at, now());

-- ---------------------------------------------------------------------------
-- Payments (enrollment-linked)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount integer not null,
  currency text not null default 'INR',
  status text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'refunded')),
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments (razorpay_order_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Course sessions (Phase 2 scheduling)
-- ---------------------------------------------------------------------------
create table if not exists public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  instructor_name text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meeting_url text,
  location text not null default '',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled', 'completed')),
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_sessions_course_idx
  on public.course_sessions (course_id, starts_at);
create index if not exists course_sessions_starts_idx
  on public.course_sessions (starts_at);

alter table public.course_sessions enable row level security;

drop policy if exists "Enrolled students read course sessions" on public.course_sessions;
create policy "Enrolled students read course sessions"
  on public.course_sessions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or (
      exists (
        select 1 from public.enrollments e
        where e.course_id = course_sessions.course_id
          and e.user_id = auth.uid()
          and e.status = 'active'
      )
      and (
        course_sessions.schedule_rule_id is null
        or exists (
          select 1
          from public.course_schedule_rules r
          where r.id = course_sessions.schedule_rule_id
            and r.status = 'published'
        )
        or course_sessions.notify_sent_at is not null
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Course schedule rules (recurring schedules → expanded into course_sessions)
-- ---------------------------------------------------------------------------
-- days_of_week: JS-style weekday ints — 0=Sunday … 6=Saturday.
-- start_time / end_time are local wall-clock times in `timezone`.
-- Occurrence rows live in course_sessions (linked via schedule_rule_id).
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
  notify_email_sent_at timestamptz,
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

-- Idempotent upgrades for existing DBs (status model + publication audit)
do $$ begin
  update public.course_schedule_rules
  set status = 'published'
  where status = 'active';
exception when others then null;
end $$;

alter table public.course_schedule_rules
  add column if not exists published_at timestamptz;
alter table public.course_schedule_rules
  add column if not exists published_by uuid
    references public.profiles (id) on delete set null;

do $$ begin
  alter table public.course_schedule_rules
    drop constraint if exists course_schedule_rules_status_check;
  alter table public.course_schedule_rules
    add constraint course_schedule_rules_status_check
    check (status in ('draft', 'published', 'cancelled'));
exception when others then null;
end $$;

alter table public.course_schedule_rules
  alter column status set default 'draft';

alter table public.course_sessions
  add column if not exists notify_sent_at timestamptz;

alter table public.course_sessions
  add column if not exists calendar_invite_via text;

alter table public.course_sessions
  add column if not exists ics_invite_sent_at timestamptz;

do $$ begin
  alter table public.course_sessions
    drop constraint if exists course_sessions_calendar_invite_via_check;
  alter table public.course_sessions
    add constraint course_sessions_calendar_invite_via_check
    check (calendar_invite_via is null or calendar_invite_via in ('google', 'ics_email', 'none'));
exception when others then null;
end $$;

alter table public.course_schedule_rules
  add column if not exists notify_email_sent_at timestamptz;

create index if not exists course_sessions_notify_sent_idx
  on public.course_sessions (notify_sent_at)
  where notify_sent_at is not null;

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
-- course_sessions extensions (recurrence link + calendar sync metadata)
-- ---------------------------------------------------------------------------
-- google_event_id already stores the Google Calendar event id — do not duplicate.
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
set calendar_sync_status = 'pending'
where calendar_sync_status = 'skipped';

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

alter table public.course_sessions
  add column if not exists calendar_sync_error text;

alter table public.course_sessions
  add column if not exists calendar_sync_attempted_at timestamptz;

alter table public.course_sessions
  add column if not exists calendar_synced_at timestamptz;

create index if not exists course_sessions_calendar_sync_failed_idx
  on public.course_sessions (course_id, calendar_sync_status)
  where calendar_sync_status = 'failed';

-- Unique occurrence per rule + start (safe re-expand / edit without dupes).
-- Partial: only when linked to a schedule rule.
create unique index if not exists course_sessions_rule_starts_uidx
  on public.course_sessions (schedule_rule_id, starts_at)
  where schedule_rule_id is not null;

-- Per-student session calendar invite tracking (late joiners + deduplication)
create table if not exists public.course_session_student_invites (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  invite_channel text not null
    check (invite_channel in ('google', 'ics_email')),
  invited_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create index if not exists course_session_student_invites_user_idx
  on public.course_session_student_invites (user_id, invited_at desc);

create index if not exists course_session_student_invites_session_idx
  on public.course_session_student_invites (session_id);

alter table public.course_session_student_invites enable row level security;

alter table public.course_sessions
  add column if not exists cancellation_reason text;

alter table public.course_sessions
  add column if not exists replacement_planned text;

alter table public.course_sessions
  add column if not exists cancelled_at timestamptz;

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

-- Session reschedule audit log
create table if not exists public.course_session_reschedules (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  mode text not null check (mode in ('in_place', 'replacement_created')),
  previous_starts_at timestamptz not null,
  previous_ends_at timestamptz not null,
  new_starts_at timestamptz not null,
  new_ends_at timestamptz not null,
  replacement_session_id uuid references public.course_sessions (id) on delete set null,
  rescheduled_by uuid references public.profiles (id) on delete set null,
  note text,
  rescheduled_at timestamptz not null default now()
);

create index if not exists course_session_reschedules_session_idx
  on public.course_session_reschedules (session_id, rescheduled_at desc);

alter table public.course_sessions
  add column if not exists last_rescheduled_at timestamptz;

-- ---------------------------------------------------------------------------
-- Auth trigger
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.course_schedule_rules enable row level security;

drop policy if exists "Courses are publicly readable" on public.courses;
drop policy if exists "Public read published courses" on public.courses;
create policy "Public read published courses"
  on public.courses for select
  using (status = 'published');

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can read own enrollments" on public.enrollments;
drop policy if exists "Users read own enrollments" on public.enrollments;
create policy "Users read own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);
