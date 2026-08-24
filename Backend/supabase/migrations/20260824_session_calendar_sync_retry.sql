-- Session-level calendar sync retry metadata
-- Safe to re-run.

alter table public.course_sessions
  add column if not exists calendar_sync_error text;

alter table public.course_sessions
  add column if not exists calendar_sync_attempted_at timestamptz;

alter table public.course_sessions
  add column if not exists calendar_synced_at timestamptz;

create index if not exists course_sessions_calendar_sync_failed_idx
  on public.course_sessions (course_id, calendar_sync_status)
  where calendar_sync_status = 'failed';
