-- Enrollment-level calendar attendee sync status (add/remove on enrollment lifecycle)
-- Safe to re-run.

alter table public.enrollments
  add column if not exists calendar_sync_status text not null default 'pending';

alter table public.enrollments
  add column if not exists calendar_synced_at timestamptz;

alter table public.enrollments
  add column if not exists calendar_sync_error text;

alter table public.enrollments
  add column if not exists calendar_sync_attempted_at timestamptz;

do $$ begin
  alter table public.enrollments
    drop constraint if exists enrollments_calendar_sync_status_check;
  alter table public.enrollments
    add constraint enrollments_calendar_sync_status_check
    check (calendar_sync_status in ('pending', 'synced', 'failed', 'not_applicable'));
exception when others then null;
end $$;

create index if not exists enrollments_calendar_sync_status_idx
  on public.enrollments (calendar_sync_status, calendar_sync_attempted_at desc);
