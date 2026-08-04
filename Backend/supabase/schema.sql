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
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  progress_pct integer not null default 0 check (progress_pct between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.enrollments add column if not exists payment_status text;
alter table public.enrollments add column if not exists progress_pct integer;
alter table public.enrollments add column if not exists updated_at timestamptz;
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
      select 1 from public.enrollments e
      where e.course_id = course_sessions.course_id
        and e.user_id = auth.uid()
        and e.status = 'active'
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

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
