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
