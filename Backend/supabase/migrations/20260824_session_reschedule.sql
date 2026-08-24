-- Audit log for session reschedules (in-place or replacement)
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

create index if not exists course_session_reschedules_course_idx
  on public.course_session_reschedules (course_id, rescheduled_at desc);

alter table public.course_session_reschedules enable row level security;

alter table public.course_sessions
  add column if not exists last_rescheduled_at timestamptz;
