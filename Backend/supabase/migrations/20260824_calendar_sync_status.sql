-- Align calendar_sync_status with pending | synced | failed | cancelled
-- Safe to re-run.

update public.course_sessions
set calendar_sync_status = 'pending'
where calendar_sync_status = 'skipped';

do $$ begin
  alter table public.course_sessions
    drop constraint if exists course_sessions_calendar_sync_status_check;
  alter table public.course_sessions
    add constraint course_sessions_calendar_sync_status_check
    check (calendar_sync_status in ('pending', 'synced', 'failed', 'cancelled'));
exception when others then null;
end $$;
