-- Publish workflow: draft | published | cancelled + audit fields
-- Safe to re-run.

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

create index if not exists course_sessions_notify_sent_idx
  on public.course_sessions (notify_sent_at)
  where notify_sent_at is not null;

-- One schedule-publication email per publish cycle (cleared when returned to draft)
alter table public.course_schedule_rules
  add column if not exists notify_email_sent_at timestamptz;

