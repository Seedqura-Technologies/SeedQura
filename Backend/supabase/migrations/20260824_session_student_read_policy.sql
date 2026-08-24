-- Tighten course_sessions SELECT so enrolled students cannot read draft
-- recurring sessions (or their meeting URLs) before schedule publish.
-- Aligns with Express GET /student/me filtering.

drop policy if exists "Enrolled students read course sessions" on public.course_sessions;

create policy "Enrolled students read course sessions"
  on public.course_sessions for select
  using (
    -- Admins see all sessions
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or (
      -- Active enrollment in this course
      exists (
        select 1 from public.enrollments e
        where e.course_id = course_sessions.course_id
          and e.user_id = auth.uid()
          and e.status = 'active'
      )
      and (
        -- One-time sessions (no recurring rule) — announced on create
        course_sessions.schedule_rule_id is null
        -- Recurring: only after the schedule rule is published
        or exists (
          select 1
          from public.course_schedule_rules r
          where r.id = course_sessions.schedule_rule_id
            and r.status = 'published'
        )
        -- Already announced to students (belt-and-suspenders)
        or course_sessions.notify_sent_at is not null
      )
    )
  );
