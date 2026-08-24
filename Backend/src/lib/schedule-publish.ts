import { getSupabaseAdmin } from "./supabase.js";
import {
  buildScheduleNotificationMetadata,
  createScheduleNotification,
  notifyStudentsCalendarSyncFailed,
} from "./notifications.js";
import {
  schedulePublishedEmail,
  scheduleEmailFormat,
  sendMailInBatches,
} from "./mail.js";
import { getActiveCourseStudents } from "./course-students.js";
import { formatDaysOfWeekLabel } from "./schedule-generator.js";
import {
  deliverSessionCalendarInvites,
  summarizeCalendarInviteChannels,
} from "./sessions.js";
import type { SessionRow } from "./sessions.js";
import type { CalendarInviteChannel } from "./google-calendar.js";

export type PublishScheduleResult = {
  scheduleId: string;
  publishedAt: string;
  publishedBy: string | null;
  sessionsTotal: number;
  calendarCreated: number;
  calendarUpdated: number;
  calendarPending: number;
  calendarFailed: number;
  calendarGoogleInvites: number;
  calendarIcsInvites: number;
  icsEmailsSent: number;
  calendarInviteSummary: "google" | "ics_email" | "mixed" | "none";
  emailsSent: number;
  emailsSkipped: number;
  emailsFailed: number;
  notificationsCreated: number;
  scheduleEmailAlreadySent: boolean;
};

type SessionPublishRow = SessionRow & {
  calendar_sync_status?: string | null;
  notify_sent_at?: string | null;
  calendar_invite_via?: string | null;
  ics_invite_sent_at?: string | null;
};

type ScheduleRulePublishRow = {
  id: string;
  course_id: string;
  title: string;
  instructor_name: string | null;
  meeting_url: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  timezone: string;
  days_of_week: number[];
  status: string;
  published_at: string | null;
  published_by: string | null;
  notify_email_sent_at?: string | null;
};

/**
 * Publish a draft schedule: per-session calendar invites + one schedule email per student.
 */
export async function publishScheduleRule(opts: {
  scheduleRuleId: string;
  publishedBy: string | null;
}): Promise<PublishScheduleResult> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: ruleRaw, error: ruleErr } = await admin
    .from("course_schedule_rules")
    .select("*")
    .eq("id", opts.scheduleRuleId)
    .maybeSingle();
  if (ruleErr) throw ruleErr;
  if (!ruleRaw) throw new Error("Schedule not found");
  const rule = ruleRaw as ScheduleRulePublishRow;
  if (rule.status === "cancelled") {
    throw new Error("Cannot publish a cancelled schedule");
  }

  const { data: course } = await admin
    .from("courses")
    .select("id, name, duration")
    .eq("id", rule.course_id)
    .maybeSingle();
  const courseName = course?.name || rule.course_id;
  const courseDuration = (course?.duration || "").trim();

  const { data: sessionRows, error: sessErr } = await admin
    .from("course_sessions")
    .select(
      "id, course_id, title, description, instructor_name, starts_at, ends_at, meeting_url, location, status, google_event_id, calendar_sync_status, calendar_invite_via, ics_invite_sent_at, notify_sent_at"
    )
    .eq("schedule_rule_id", opts.scheduleRuleId)
    .eq("status", "scheduled")
    .order("starts_at", { ascending: true });
  if (sessErr) throw sessErr;

  const sessions = (sessionRows ?? []) as SessionPublishRow[];
  if (sessions.length === 0) {
    throw new Error("No sessions to publish. Generate sessions first, then publish.");
  }

  const students = await getActiveCourseStudents(rule.course_id);

  let calendarCreated = 0;
  let calendarUpdated = 0;
  let calendarPending = 0;
  let calendarFailed = 0;
  let calendarGoogleInvites = 0;
  let calendarIcsInvites = 0;
  let icsEmailsSent = 0;
  const inviteChannels: CalendarInviteChannel[] = [];
  const calendarFailedSessions: {
    session: SessionPublishRow;
    syncError: string | null;
  }[] = [];

  for (const session of sessions) {
    const hadEvent = Boolean(session.google_event_id);
    const cal = await deliverSessionCalendarInvites({
      session,
      courseName,
      timezone: rule.timezone,
      action: "upsert",
    });

    inviteChannels.push(cal.calendarInviteVia);

    if (cal.calendarSyncStatus === "synced") {
      if (hadEvent) calendarUpdated += 1;
      else calendarCreated += 1;
    } else if (cal.calendarSyncStatus === "failed") {
      calendarFailed += 1;
      calendarFailedSessions.push({
        session,
        syncError: cal.calendarSyncError,
      });
    } else {
      calendarPending += 1;
    }

    if (cal.calendarInviteVia === "google") calendarGoogleInvites += 1;
    if (cal.calendarInviteVia === "ics_email") calendarIcsInvites += 1;
    icsEmailsSent += cal.icsEmailsSent;
  }

  const calendarInviteSummary = summarizeCalendarInviteChannels(inviteChannels);

  const firstStarts =
    typeof sessions[0].starts_at === "string"
      ? sessions[0].starts_at
      : new Date(sessions[0].starts_at).toISOString();
  const lastStarts =
    typeof sessions[sessions.length - 1].starts_at === "string"
      ? sessions[sessions.length - 1].starts_at
      : new Date(sessions[sessions.length - 1].starts_at).toISOString();

  const classDays = formatDaysOfWeekLabel(rule.days_of_week || []);
  const classTime = `${scheduleEmailFormat.formatClock(rule.start_time)} – ${scheduleEmailFormat.formatClock(rule.end_time)}`;
  const firstClassDate = scheduleEmailFormat.formatDateInZone(
    firstStarts,
    rule.timezone
  );
  const lastClassDate = scheduleEmailFormat.formatDateInZone(
    lastStarts,
    rule.timezone
  );

  const alreadyEmailed = Boolean(rule.notify_email_sent_at);
  let emailsSent = 0;
  let emailsSkipped = 0;
  let emailsFailed = 0;
  let notificationsCreated = 0;

  if (alreadyEmailed) {
    emailsSkipped = students.length;
  } else if (students.length > 0) {
    const messages = students.map((student) => {
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
        firstClassDate,
        lastClassDate,
        calendarInviteSummary,
      });
      return {
        to: student.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      };
    });

    const batch = await sendMailInBatches(messages, {
      batchSize: 10,
      delayMs: 250,
    });
    emailsSent = batch.sent + batch.skipped;
    emailsFailed = batch.failed;
    emailsSkipped = 0;

    for (const student of students) {
      await createScheduleNotification({
        userId: student.userId,
        type: "schedule_published",
        title: `Schedule published: ${rule.title}`,
        body: `${courseName} · ${sessions.length} session(s) · ${firstClassDate} → ${lastClassDate}`,
        metadata: buildScheduleNotificationMetadata({
          courseId: rule.course_id,
          courseName,
          scheduleRuleId: opts.scheduleRuleId,
          enrollmentId: student.enrollmentId,
          extra: {
            sessionCount: sessions.length,
            calendarInviteSummary,
          },
        }),
      });
      notificationsCreated += 1;
    }

    for (const { session, syncError } of calendarFailedSessions) {
      await notifyStudentsCalendarSyncFailed({
        students,
        courseId: rule.course_id,
        courseName,
        sessionId: session.id,
        sessionTitle: session.title,
        syncError,
      });
      notificationsCreated += students.length;
    }

    const sessionIds = sessions.map((s) => s.id);
    await admin
      .from("course_sessions")
      .update({ notify_sent_at: nowIso, updated_at: nowIso })
      .in("id", sessionIds);
  }

  const { error: pubErr } = await admin
    .from("course_schedule_rules")
    .update({
      status: "published",
      published_at: nowIso,
      published_by: opts.publishedBy,
      // Only mark emailed when at least one attempt fully succeeded.
      // If Resend fails for everyone, leave unset so a later publish can retry.
      // If there were no eligible students yet, leave unset for mid-course catch-up / re-publish.
      ...(alreadyEmailed || emailsFailed > 0 || students.length === 0
        ? {}
        : { notify_email_sent_at: nowIso }),
      updated_at: nowIso,
    })
    .eq("id", opts.scheduleRuleId);
  if (pubErr) throw pubErr;

  return {
    scheduleId: opts.scheduleRuleId,
    publishedAt: nowIso,
    publishedBy: opts.publishedBy,
    sessionsTotal: sessions.length,
    calendarCreated,
    calendarUpdated,
    calendarPending,
    calendarFailed,
    calendarGoogleInvites,
    calendarIcsInvites,
    icsEmailsSent,
    calendarInviteSummary,
    emailsSent: alreadyEmailed ? 0 : emailsSent,
    emailsSkipped,
    emailsFailed,
    notificationsCreated,
    scheduleEmailAlreadySent: alreadyEmailed,
  };
}
