-- Session cancellation metadata (soft cancel — row preserved)
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
