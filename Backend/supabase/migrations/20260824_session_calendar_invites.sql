-- Track how calendar invites were delivered per session
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

update public.course_sessions
set calendar_invite_via = coalesce(calendar_invite_via, 'none')
where calendar_invite_via is null;
