import { getSupabaseAdmin } from "./supabase.js";
import { getActiveCourseStudent } from "./course-students.js";
import {
  buildScheduleNotificationMetadata,
  createScheduleNotification,
  notifyStudentsCalendarSyncFailed,
} from "./notifications.js";
import {
  schedulePublishedEmail,
  scheduleEmailFormat,
  sendMail,
  sessionScheduledEmail,
} from "./mail.js";
import { formatDaysOfWeekLabel } from "./schedule-generator.js";
import { getInvitedSessionIdsForUser } from "./session-student-invites.js";
import {
  inviteStudentToSession,
  summarizeCalendarInviteChannels,
  type SessionRow,
} from "./sessions.js";
import type { CalendarInviteChannel } from "./google-calendar.js";

type ScheduleRuleJoin = {
  id: string;
  status: string;
  title: string;
  instructor_name: string | null;
  meeting_url: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  timezone: string;
  days_of_week: number[];
};

export type SessionWithRule = SessionRow & {
  schedule_rule_id: string | null;
  notify_sent_at?: string | null;
  schedule_rule?: ScheduleRuleJoin | ScheduleRuleJoin[] | null;
};

export type SyncStudentCourseCalendarResult = {
  ok: boolean;
  reason?: "not_enrolled";
  sessionsFound: number;
  sessionsInvited: number;
  sessionsSkipped: number;
  googleInvites: number;
  icsEmailsSent: number;
  scheduleEmailsSent: number;
  oneTimeEmailsSent: number;
  errors: string[];
};

function unwrapRule(
  rule: SessionWithRule["schedule_rule"]
): ScheduleRuleJoin | null {
  if (!rule) return null;
  return Array.isArray(rule) ? rule[0] ?? null : rule;
}

/**
 * Whether a session is visible to students for calendar sync.
 * - Published recurring schedule occurrences only
 * - One-time sessions that were already announced (notify/calendar metadata)
 */
export function isNotifiablePublishedSession(
  session: SessionWithRule,
  nowMs: number = Date.now()
): boolean {
  if (session.status !== "scheduled") return false;
  const startsMs = new Date(session.starts_at).getTime();
  if (!Number.isFinite(startsMs) || startsMs <= nowMs) return false;

  if (session.schedule_rule_id) {
    const rule = unwrapRule(session.schedule_rule);
    return rule?.status === "published";
  }

  return Boolean(
    session.notify_sent_at ||
      session.google_event_id ||
      session.calendar_invite_via ||
      session.ics_invite_sent_at
  );
}

/** Filter to future, published, not-yet-invited sessions for this student. */
export function selectSessionsToInvite(
  sessions: SessionWithRule[],
  alreadyInvited: Set<string>,
  nowMs: number = Date.now()
): SessionWithRule[] {
  return sessions.filter(
    (s) =>
      isNotifiablePublishedSession(s, nowMs) && !alreadyInvited.has(s.id)
  );
}

function sessionTimezone(session: SessionWithRule): string {
  const rule = unwrapRule(session.schedule_rule);
  return rule?.timezone?.trim() || process.env.SESSION_TIMEZONE || "Asia/Kolkata";
}

async function hasScheduleCatchupNotification(
  userId: string,
  scheduleRuleId: string
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .in("type", ["schedule_published", "schedule_catchup"])
    .contains("metadata", { scheduleRuleId })
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/**
 * Sync calendar invites and schedule emails for a student who joined after publish.
 * Only future sessions are included; past sessions are skipped.
 */
export async function syncStudentCourseCalendar(
  studentId: string,
  courseId: string
): Promise<SyncStudentCourseCalendarResult> {
  const result: SyncStudentCourseCalendarResult = {
    ok: false,
    sessionsFound: 0,
    sessionsInvited: 0,
    sessionsSkipped: 0,
    googleInvites: 0,
    icsEmailsSent: 0,
    scheduleEmailsSent: 0,
    oneTimeEmailsSent: 0,
    errors: [],
  };

  const student = await getActiveCourseStudent(studentId, courseId);
  if (!student) {
    return { ...result, reason: "not_enrolled" };
  }

  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const [{ data: course }, { data: sessionRows }] = await Promise.all([
    admin.from("courses").select("id, name, duration").eq("id", courseId).maybeSingle(),
    admin
      .from("course_sessions")
      .select(
        `id, course_id, title, description, instructor_name, starts_at, ends_at,
         meeting_url, location, status, google_event_id, calendar_sync_status,
         calendar_invite_via, ics_invite_sent_at, notify_sent_at, schedule_rule_id,
         schedule_rule:course_schedule_rules(
           id, status, title, instructor_name, meeting_url, location,
           start_time, end_time, timezone, days_of_week
         )`
      )
      .eq("course_id", courseId)
      .eq("status", "scheduled")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true }),
  ]);

  const courseName = course?.name || courseId;
  const courseDuration = (course?.duration || "").trim();
  const allSessions = (sessionRows ?? []) as SessionWithRule[];
  const notifiable = allSessions.filter((s) =>
    isNotifiablePublishedSession(s)
  );

  result.sessionsFound = notifiable.length;
  if (notifiable.length === 0) {
    return { ...result, ok: true };
  }

  const invitedSet = await getInvitedSessionIdsForUser(
    studentId,
    notifiable.map((s) => s.id)
  );
  const toInvite = selectSessionsToInvite(notifiable, invitedSet);
  result.sessionsSkipped = notifiable.length - toInvite.length;

  if (toInvite.length === 0) {
    return { ...result, ok: true };
  }

  const inviteChannels: CalendarInviteChannel[] = [];
  const inviteResults = new Map<
    string,
    Awaited<ReturnType<typeof inviteStudentToSession>>
  >();

  for (const session of toInvite) {
    try {
      const invite = await inviteStudentToSession({
        session,
        student,
        courseName,
        timezone: sessionTimezone(session),
      });
      inviteResults.set(session.id, invite);
      if (invite.skipped) {
        result.sessionsSkipped += 1;
        continue;
      }
      result.sessionsInvited += 1;
      inviteChannels.push(invite.channel);
      if (invite.channel === "google") result.googleInvites += 1;
      if (invite.icsEmailSent) result.icsEmailsSent += 1;

      await createScheduleNotification({
        userId: studentId,
        type: "session_created",
        title: `Class scheduled: ${session.title}`,
        body: `${courseName} · ${new Date(session.starts_at).toLocaleString("en-IN")}`,
        metadata: buildScheduleNotificationMetadata({
          courseId,
          courseName,
          sessionId: session.id,
          sessionTitle: session.title,
          enrollmentId: student.enrollmentId,
          extra: {
            calendarInviteVia: invite.channel,
            catchup: true,
          },
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`session ${session.id}: ${message}`);
      console.error("[syncStudentCourseCalendar] session invite failed", {
        sessionId: session.id,
        studentId,
        err,
      });
      try {
        await notifyStudentsCalendarSyncFailed({
          students: [student],
          courseId,
          courseName,
          sessionId: session.id,
          sessionTitle: session.title,
          syncError: message,
        });
      } catch (notifyErr) {
        console.error("[syncStudentCourseCalendar] calendar_sync_failed notify", notifyErr);
      }
    }
  }

  const calendarInviteSummary = summarizeCalendarInviteChannels(inviteChannels);

  // Schedule summary email — one per published schedule rule (remaining sessions only)
  const byRule = new Map<string, SessionWithRule[]>();
  const oneTimeSessions: SessionWithRule[] = [];

  for (const session of toInvite) {
    if (session.schedule_rule_id) {
      const list = byRule.get(session.schedule_rule_id) ?? [];
      list.push(session);
      byRule.set(session.schedule_rule_id, list);
    } else {
      oneTimeSessions.push(session);
    }
  }

  for (const [ruleId, sessions] of byRule) {
    const rule = unwrapRule(sessions[0]?.schedule_rule);
    if (!rule || rule.status !== "published") continue;

    try {
      const alreadyNotified = await hasScheduleCatchupNotification(
        studentId,
        ruleId
      );
      if (alreadyNotified) continue;

      const firstStarts = sessions[0].starts_at;
      const lastStarts = sessions[sessions.length - 1].starts_at;
      const classDays = formatDaysOfWeekLabel(rule.days_of_week || []);
      const classTime = `${scheduleEmailFormat.formatClock(rule.start_time)} – ${scheduleEmailFormat.formatClock(rule.end_time)}`;

      const mail = schedulePublishedEmail({
        name: student.fullName,
        courseName,
        scheduleTitle: rule.title,
        courseDuration,
        classDays,
        classTime,
        timezone: rule.timezone,
        instructor: rule.instructor_name || "",
        meetingUrl: rule.meeting_url,
        location: rule.location,
        sessionCount: sessions.length,
        firstClassDate: scheduleEmailFormat.formatDateInZone(
          firstStarts,
          rule.timezone
        ),
        lastClassDate: scheduleEmailFormat.formatDateInZone(
          lastStarts,
          rule.timezone
        ),
        calendarInviteSummary,
        joinedLate: true,
      });

      await sendMail({
        to: student.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });

      await createScheduleNotification({
        userId: studentId,
        type: "schedule_published",
        title: `Upcoming schedule: ${rule.title}`,
        body: `${courseName} · ${sessions.length} upcoming session(s)`,
        metadata: buildScheduleNotificationMetadata({
          courseId,
          courseName,
          scheduleRuleId: ruleId,
          enrollmentId: student.enrollmentId,
          extra: {
            sessionCount: sessions.length,
            calendarInviteSummary,
            joinedLate: true,
          },
        }),
      });

      result.scheduleEmailsSent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`schedule ${ruleId}: ${message}`);
      console.error("[syncStudentCourseCalendar] schedule email failed", {
        ruleId,
        studentId,
        err,
      });
    }
  }

  // One-time future sessions — info email when Google handled the invite (ICS email already sent)
  for (const session of oneTimeSessions) {
    const invite = inviteResults.get(session.id);
    if (invite?.icsEmailSent) continue;

    try {
      const startsAt =
        typeof session.starts_at === "string"
          ? session.starts_at
          : new Date(session.starts_at).toISOString();
      const endsAt =
        typeof session.ends_at === "string"
          ? session.ends_at
          : new Date(session.ends_at).toISOString();

      const mail = sessionScheduledEmail({
        name: student.fullName,
        courseName,
        sessionTitle: session.title,
        startsAt,
        endsAt,
        meetingUrl: session.meeting_url,
        instructorName: session.instructor_name,
        action: "created",
        calendarInviteVia:
          invite?.channel === "google"
            ? "google"
            : (session.calendar_invite_via as "google" | "ics_email" | "none") ||
              "none",
      });

      await sendMail({ to: student.email, ...mail });
      result.oneTimeEmailsSent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`one-time session ${session.id}: ${message}`);
    }
  }

  return {
    ...result,
    ok: result.errors.length === 0,
  };
}
