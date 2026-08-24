import { getSupabaseAdmin } from "./supabase.js";
import {
  buildScheduleNotificationMetadata,
  createScheduleNotification,
  type ScheduleNotificationType,
} from "./notifications.js";
import {
  sendMail,
  sessionCalendarInviteEmail,
  sessionCancelledEmail,
  sessionRescheduledEmail,
  sessionScheduledEmail,
  sendMailInBatches,
  type ReplacementPlanned,
  type RescheduleMode,
} from "./mail.js";
import {
  buildSessionIcsAttachment,
} from "./ics.js";
import {
  deleteCalendarEvent,
  logCalendarSync,
  upsertCalendarEvent,
  type CalendarInviteChannel,
  type CalendarSyncStatus,
} from "./google-calendar.js";
import { getActiveCourseStudents, type ActiveCourseStudent } from "./course-students.js";
import {
  recordSessionStudentInvites,
} from "./session-student-invites.js";

export type SessionRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  instructor_name: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  location: string;
  status: string;
  google_event_id: string | null;
  calendar_sync_status?: string | null;
  calendar_event_status?: string | null;
  calendar_invite_via?: string | null;
  calendar_sync_error?: string | null;
  ics_invite_sent_at?: string | null;
  cancellation_reason?: string | null;
  replacement_planned?: string | null;
  cancelled_at?: string | null;
  schedule_rule_id?: string | null;
};

export type SessionCalendarInviteResult = {
  googleEventId: string | null;
  calendarSyncStatus: CalendarSyncStatus;
  calendarEventStatus: "none" | "confirmed" | "cancelled";
  calendarInviteVia: CalendarInviteChannel;
  calendarSyncError: string | null;
  recreated: boolean;
  attendeeCount: number;
  icsEmailsSent: number;
  icsEmailsSkipped: number;
  invitedViaGoogle: boolean;
};

function defaultSessionTimezone() {
  return process.env.SESSION_TIMEZONE || "Asia/Kolkata";
}

function isoTimestamp(value: string | Date): string {
  return typeof value === "string" ? value : new Date(value).toISOString();
}

async function sendIcsCalendarInvites(opts: {
  session: SessionRow;
  courseName: string;
  students: ActiveCourseStudent[];
  startsAt: string;
  endsAt: string;
  timezone: string;
  force?: boolean;
}): Promise<{ sent: number; skipped: number }> {
  if (opts.students.length === 0) return { sent: 0, skipped: 0 };
  if (!opts.force && opts.session.ics_invite_sent_at) {
    return { sent: 0, skipped: opts.students.length };
  }

  const icsAttachment = buildSessionIcsAttachment({
    sessionId: opts.session.id,
    courseName: opts.courseName,
    sessionTitle: opts.session.title,
    sessionDetails: opts.session.description,
    instructorName: opts.session.instructor_name,
    startsAt: opts.startsAt,
    endsAt: opts.endsAt,
    timezone: opts.timezone,
    meetingUrl: opts.session.meeting_url,
    location: opts.session.location,
    attendeeEmails: opts.students.map((s) => s.email),
  });

  const messages = opts.students.map((student) => {
    const mail = sessionCalendarInviteEmail({
      name: student.fullName,
      courseName: opts.courseName,
      sessionTitle: opts.session.title,
      startsAt: opts.startsAt,
      endsAt: opts.endsAt,
    });
    return {
      to: student.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: [icsAttachment],
    };
  });

  const batch = await sendMailInBatches(messages, { batchSize: 10, delayMs: 250 });
  return {
    sent: batch.sent + batch.skipped,
    skipped: batch.failed > 0 ? batch.failed : 0,
  };
}

function sessionIcsAttachment(opts: {
  session: SessionRow;
  courseName: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  attendeeEmails: string[];
  method?: "REQUEST" | "CANCEL";
  sequence?: number;
}) {
  return buildSessionIcsAttachment({
    sessionId: opts.session.id,
    courseName: opts.courseName,
    sessionTitle: opts.session.title,
    sessionDetails: opts.session.description,
    instructorName: opts.session.instructor_name,
    startsAt: opts.startsAt,
    endsAt: opts.endsAt,
    timezone: opts.timezone,
    meetingUrl: opts.session.meeting_url,
    location: opts.session.location,
    attendeeEmails: opts.attendeeEmails,
    method: opts.method,
    sequence: opts.sequence,
  });
}

/**
 * Student calendar invitation workflow for a published course session:
 * 1. Find active enrolled students
 * 2. Create/update Google Calendar event with attendees (when supported)
 * 3. Fall back to .ics email attachments when Google cannot invite
 * 4. Persist google_event_id, calendar_sync_status, calendar_invite_via
 */
export async function deliverSessionCalendarInvites(opts: {
  session: SessionRow;
  courseName: string;
  timezone?: string;
  action: "upsert" | "cancel";
  /** Re-send ICS even if ics_invite_sent_at is set (session updated). */
  forceIcs?: boolean;
  /** When true, sync Google only — caller attaches .ics to its own email. */
  skipIcsEmail?: boolean;
}): Promise<SessionCalendarInviteResult> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const timezone = opts.timezone?.trim() || defaultSessionTimezone();
  const startsAt = isoTimestamp(opts.session.starts_at);
  const endsAt = isoTimestamp(opts.session.ends_at);

  const students = await getActiveCourseStudents(opts.session.course_id);
  const attendeeEmails = students.map((s) => s.email);

  let googleEventId = opts.session.google_event_id;
  let calendarSyncStatus: CalendarSyncStatus = "pending";
  let calendarEventStatus: "none" | "confirmed" | "cancelled" = "none";
  let calendarInviteVia: CalendarInviteChannel = "none";
  let invitedViaGoogle = false;
  let icsEmailsSent = 0;
  let icsEmailsSkipped = 0;
  let calendarSyncError: string | null = null;
  let recreated = false;
  const previousGoogleEventId = googleEventId;

  if (opts.action === "cancel") {
    const result = await deleteCalendarEvent(googleEventId);
    calendarSyncStatus = result.syncStatus;
    calendarEventStatus = "cancelled";
    calendarInviteVia = "none";
    googleEventId = result.eventId ?? null;
    calendarSyncError = result.error ?? null;
  } else {
    const result = await upsertCalendarEvent({
      courseName: opts.courseName,
      sessionTitle: opts.session.title,
      sessionDetails: opts.session.description,
      instructorName: opts.session.instructor_name,
      startsAt,
      endsAt,
      timezone,
      meetingUrl: opts.session.meeting_url,
      location: opts.session.location,
      attendeeEmails,
      googleEventId,
    });

    calendarSyncStatus = result.syncStatus;
    googleEventId = result.eventId ?? googleEventId;
    invitedViaGoogle = result.invitedViaGoogle;
    calendarInviteVia = result.inviteChannel;
    calendarSyncError = result.error ?? null;
    recreated = Boolean(result.recreated);
    calendarEventStatus =
      calendarSyncStatus === "synced" && googleEventId ? "confirmed" : "none";

    if (calendarInviteVia === "ics_email" && !opts.skipIcsEmail) {
      const ics = await sendIcsCalendarInvites({
        session: opts.session,
        courseName: opts.courseName,
        students,
        startsAt,
        endsAt,
        timezone,
        force: opts.forceIcs,
      });
      icsEmailsSent = ics.sent;
      icsEmailsSkipped = ics.skipped;
      if (icsEmailsSent > 0) {
        await recordSessionStudentInvites({
          sessionId: opts.session.id,
          userIds: students.map((s) => s.userId),
          channel: "ics_email",
        });
      }
    } else if (
      calendarInviteVia === "google" &&
      invitedViaGoogle &&
      students.length > 0
    ) {
      await recordSessionStudentInvites({
        sessionId: opts.session.id,
        userIds: students.map((s) => s.userId),
        channel: "google",
      });
    }
  }

  await admin
    .from("course_sessions")
    .update({
      google_event_id: googleEventId,
      calendar_sync_status: calendarSyncStatus,
      calendar_event_status: calendarEventStatus,
      calendar_invite_via: calendarInviteVia,
      calendar_sync_error: calendarSyncError,
      calendar_sync_attempted_at: nowIso,
      calendar_synced_at:
        calendarSyncStatus === "synced" || calendarSyncStatus === "cancelled"
          ? nowIso
          : null,
      ...(icsEmailsSent > 0 ? { ics_invite_sent_at: nowIso } : {}),
      updated_at: nowIso,
    })
    .eq("id", opts.session.id);

  if (recreated && previousGoogleEventId && googleEventId !== previousGoogleEventId) {
    logCalendarSync({
      level: "warn",
      operation: "upsert",
      sessionId: opts.session.id,
      googleEventId,
      recreated: true,
      message: "Stored google_event_id updated after Google event recreation",
    });
  }

  return {
    googleEventId,
    calendarSyncStatus,
    calendarEventStatus,
    calendarInviteVia,
    calendarSyncError,
    recreated,
    attendeeCount: students.length,
    icsEmailsSent,
    icsEmailsSkipped,
    invitedViaGoogle,
  };
}

/** @deprecated Prefer getActiveCourseStudents — kept for call-site compatibility. */
export async function getActiveEnrolledStudents(courseId: string) {
  const students = await getActiveCourseStudents(courseId);
  return students.map((s) => ({
    id: s.userId,
    full_name: s.fullName,
    email: s.email,
    enrollment_id: s.enrollmentId,
  }));
}

/** @deprecated Use deliverSessionCalendarInvites — thin wrapper for calendar-only sync. */
export async function syncSessionGoogleCalendar(opts: {
  session: SessionRow;
  courseName: string;
  timezone?: string;
  action: "upsert" | "cancel";
}) {
  const result = await deliverSessionCalendarInvites(opts);
  return {
    googleEventId: result.googleEventId,
    calendarSyncStatus: result.calendarSyncStatus,
    calendarEventStatus: result.calendarEventStatus,
    attendeeCount: result.attendeeCount,
    invitedViaGoogle: result.invitedViaGoogle,
  };
}

export async function syncSessionCalendarAndNotify(opts: {
  session: SessionRow;
  courseName: string;
  timezone?: string;
  action: "created" | "updated" | "cancelled" | "rescheduled";
  cancellationReason?: string | null;
  replacementPlanned?: ReplacementPlanned;
  previousStartsAt?: string;
  previousEndsAt?: string;
  rescheduleNote?: string | null;
  rescheduleMode?: RescheduleMode;
}) {
  const students = await getActiveCourseStudents(opts.session.course_id);
  const startsAt = isoTimestamp(opts.session.starts_at);
  const endsAt = isoTimestamp(opts.session.ends_at);

  const timezone = opts.timezone?.trim() || defaultSessionTimezone();

  const isReschedule = opts.action === "rescheduled";

  const calendar = await deliverSessionCalendarInvites({
    session: opts.session,
    courseName: opts.courseName,
    timezone,
    action: opts.action === "cancelled" ? "cancel" : "upsert",
    forceIcs: opts.action === "updated" || isReschedule,
    skipIcsEmail: true,
  });

  const hadIcsInvites =
    opts.session.calendar_invite_via === "ics_email" ||
    Boolean(opts.session.ics_invite_sent_at);

  const attachIcsCancel =
    opts.action === "cancelled" && hadIcsInvites;

  const attachIcsRequest =
    opts.action !== "cancelled" &&
    (isReschedule
      ? hadIcsInvites || calendar.calendarInviteVia === "ics_email"
      : calendar.calendarInviteVia === "ics_email" ||
        calendar.calendarSyncStatus === "pending");

  const icsSequence =
    opts.action === "cancelled"
      ? 1
      : isReschedule
        ? 2
        : opts.action === "updated"
          ? 1
          : 0;

  const icsAttachment = attachIcsCancel
    ? sessionIcsAttachment({
        session: opts.session,
        courseName: opts.courseName,
        startsAt,
        endsAt,
        timezone,
        attendeeEmails: students.map((s) => s.email),
        method: "CANCEL",
        sequence: icsSequence,
      })
    : attachIcsRequest
      ? sessionIcsAttachment({
          session: opts.session,
          courseName: opts.courseName,
          startsAt,
          endsAt,
          timezone,
          attendeeEmails: students.map((s) => s.email),
          method: "REQUEST",
          sequence: icsSequence,
        })
      : null;

  const previousStartsAt = opts.previousStartsAt
    ? isoTimestamp(opts.previousStartsAt)
    : startsAt;
  const previousEndsAt = opts.previousEndsAt
    ? isoTimestamp(opts.previousEndsAt)
    : endsAt;

  for (const student of students) {
    const mail =
      opts.action === "cancelled"
        ? sessionCancelledEmail({
            name: student.fullName,
            courseName: opts.courseName,
            sessionTitle: opts.session.title,
            startsAt: previousStartsAt,
            endsAt: previousEndsAt,
            instructorName: opts.session.instructor_name,
            cancellationReason: opts.cancellationReason,
            replacementPlanned: opts.replacementPlanned,
            timezone,
          })
        : isReschedule
          ? sessionRescheduledEmail({
              name: student.fullName,
              courseName: opts.courseName,
              sessionTitle: opts.session.title,
              previousStartsAt,
              previousEndsAt,
              newStartsAt: startsAt,
              newEndsAt: endsAt,
              instructorName: opts.session.instructor_name,
              timezone,
              mode: opts.rescheduleMode,
              note: opts.rescheduleNote,
            })
          : sessionScheduledEmail({
              name: student.fullName,
              courseName: opts.courseName,
              sessionTitle: opts.session.title,
              startsAt,
              endsAt,
              meetingUrl: opts.session.meeting_url,
              instructorName: opts.session.instructor_name,
              action: opts.action === "created" ? "created" : "updated",
              calendarInviteVia: calendar.calendarInviteVia,
            });

    await sendMail({
      to: student.email,
      ...mail,
      attachments: icsAttachment ? [icsAttachment] : undefined,
    });

    const notifyBody = isReschedule
      ? `${opts.courseName} · was ${new Date(previousStartsAt).toLocaleDateString("en-IN", { timeZone: timezone })} → now ${new Date(startsAt).toLocaleDateString("en-IN", { timeZone: timezone })}`
      : opts.action === "cancelled"
        ? `${opts.courseName} · ${new Date(previousStartsAt).toLocaleDateString("en-IN", { timeZone: timezone })}${opts.cancellationReason ? ` · ${opts.cancellationReason}` : ""}`
        : `${opts.courseName} · ${new Date(startsAt).toLocaleString("en-IN")}`;

    const notifyType: ScheduleNotificationType = isReschedule
      ? "session_rescheduled"
      : opts.action === "cancelled"
        ? "session_cancelled"
        : opts.action === "created"
          ? "session_created"
          : "session_updated";

    await createScheduleNotification({
      userId: student.userId,
      type: notifyType,
      title: isReschedule
        ? `Class rescheduled: ${opts.session.title}`
        : opts.action === "cancelled"
          ? `Class cancelled: ${opts.session.title}`
          : `Class ${opts.action === "created" ? "scheduled" : "updated"}: ${opts.session.title}`,
      body: notifyBody,
      metadata: buildScheduleNotificationMetadata({
        courseId: opts.session.course_id,
        courseName: opts.courseName,
        sessionId: opts.session.id,
        sessionTitle: opts.session.title,
        scheduleRuleId: opts.session.schedule_rule_id ?? null,
        enrollmentId: student.enrollmentId,
        extra: {
          calendarSyncStatus: calendar.calendarSyncStatus,
          calendarInviteVia: calendar.calendarInviteVia,
          ...(isReschedule
            ? {
                previousStartsAt,
                previousEndsAt,
                newStartsAt: startsAt,
                newEndsAt: endsAt,
                rescheduleMode: opts.rescheduleMode ?? "in_place",
                rescheduleNote: opts.rescheduleNote ?? null,
              }
            : {}),
          ...(opts.action === "cancelled"
            ? {
                cancellationReason: opts.cancellationReason ?? null,
                replacementPlanned: opts.replacementPlanned ?? "unknown",
              }
            : {}),
        },
      }),
    });
  }

  if (icsAttachment && students.length > 0 && attachIcsRequest) {
    const admin = getSupabaseAdmin();
    await admin
      .from("course_sessions")
      .update({ ics_invite_sent_at: new Date().toISOString() })
      .eq("id", opts.session.id);
    await recordSessionStudentInvites({
      sessionId: opts.session.id,
      userIds: students.map((s) => s.userId),
      channel: "ics_email",
    });
  }

  return {
    notified: students.length,
    googleEventId: calendar.googleEventId,
    calendarSyncStatus: calendar.calendarSyncStatus,
    calendarEventStatus: calendar.calendarEventStatus,
    calendarInviteVia: calendar.calendarInviteVia,
    invitedViaGoogle: calendar.invitedViaGoogle,
    icsEmailsSent: calendar.icsEmailsSent,
  };
}

export function summarizeCalendarInviteChannels(
  channels: CalendarInviteChannel[]
): "google" | "ics_email" | "mixed" | "none" {
  const used = new Set(channels.filter((c) => c !== "none"));
  if (used.size === 0) return "none";
  if (used.size === 1) {
    return used.has("google") ? "google" : "ics_email";
  }
  return "mixed";
}

export type InviteStudentToSessionResult = {
  channel: CalendarInviteChannel;
  googlePatched: boolean;
  icsEmailSent: boolean;
  skipped: boolean;
};

/**
 * Add one enrolled student to a published session's calendar workflow.
 * Patches Google attendee list (all active students) when supported; otherwise
 * sends an individual .ics email to this student only.
 */
export async function inviteStudentToSession(opts: {
  session: SessionRow;
  student: ActiveCourseStudent;
  courseName: string;
  timezone?: string;
}): Promise<InviteStudentToSessionResult> {
  const timezone = opts.timezone?.trim() || defaultSessionTimezone();
  const startsAt = isoTimestamp(opts.session.starts_at);
  const endsAt = isoTimestamp(opts.session.ends_at);

  const allStudents = await getActiveCourseStudents(opts.session.course_id);
  const attendeeEmails = allStudents.map((s) => s.email);

  let calendarInviteVia: CalendarInviteChannel =
    (opts.session.calendar_invite_via as CalendarInviteChannel) || "none";
  let googlePatched = false;

  if (opts.session.status !== "scheduled") {
    return { channel: "none", googlePatched: false, icsEmailSent: false, skipped: true };
  }

  const shouldTryGoogle =
    calendarInviteVia === "google" || calendarInviteVia === "none";

  if (shouldTryGoogle && attendeeEmails.length > 0) {
    const result = await upsertCalendarEvent({
      courseName: opts.courseName,
      sessionTitle: opts.session.title,
      sessionDetails: opts.session.description,
      instructorName: opts.session.instructor_name,
      startsAt,
      endsAt,
      timezone,
      meetingUrl: opts.session.meeting_url,
      location: opts.session.location,
      attendeeEmails,
      googleEventId: opts.session.google_event_id,
    });

    googlePatched = result.syncStatus === "synced" && Boolean(result.eventId);
    calendarInviteVia = result.inviteChannel;

    if (result.eventId && result.eventId !== opts.session.google_event_id) {
      const admin = getSupabaseAdmin();
      await admin
        .from("course_sessions")
        .update({
          google_event_id: result.eventId,
          calendar_sync_status: result.syncStatus,
          calendar_invite_via: result.inviteChannel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", opts.session.id);
    }
  }

  if (calendarInviteVia === "google" && googlePatched) {
    await recordSessionStudentInvites({
      sessionId: opts.session.id,
      userIds: [opts.student.userId],
      channel: "google",
    });
    return {
      channel: "google",
      googlePatched: true,
      icsEmailSent: false,
      skipped: false,
    };
  }

  // ICS path — single student only (does not re-email existing students)
  const icsAttachment = buildSessionIcsAttachment({
    sessionId: opts.session.id,
    courseName: opts.courseName,
    sessionTitle: opts.session.title,
    sessionDetails: opts.session.description,
    instructorName: opts.session.instructor_name,
    startsAt,
    endsAt,
    timezone,
    meetingUrl: opts.session.meeting_url,
    location: opts.session.location,
    attendeeEmails: [opts.student.email],
  });

  const mail = sessionCalendarInviteEmail({
    name: opts.student.fullName,
    courseName: opts.courseName,
    sessionTitle: opts.session.title,
    startsAt,
    endsAt,
  });

  await sendMail({
    to: opts.student.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments: [icsAttachment],
  });

  await recordSessionStudentInvites({
    sessionId: opts.session.id,
    userIds: [opts.student.userId],
    channel: "ics_email",
  });

  return {
    channel: "ics_email",
    googlePatched,
    icsEmailSent: true,
    skipped: false,
  };
}

export type RemoveStudentFromSessionResult = {
  googlePatched: boolean;
  icsCancelSent: boolean;
  skipped: boolean;
};

/**
 * Remove one student from a future session's calendar attendance.
 * Patches Google attendee list (remaining active students) or sends ICS CANCEL.
 * Does not modify past sessions.
 */
export async function removeStudentFromSessionCalendar(opts: {
  session: SessionRow;
  student: { userId: string; fullName: string; email: string };
  courseName: string;
  inviteChannel: "google" | "ics_email";
  timezone?: string;
}): Promise<RemoveStudentFromSessionResult> {
  const timezone = opts.timezone?.trim() || defaultSessionTimezone();
  const startsAt = isoTimestamp(opts.session.starts_at);
  const endsAt = isoTimestamp(opts.session.ends_at);

  if (opts.session.status !== "scheduled") {
    return { googlePatched: false, icsCancelSent: false, skipped: true };
  }

  if (new Date(opts.session.starts_at).getTime() <= Date.now()) {
    return { googlePatched: false, icsCancelSent: false, skipped: true };
  }

  let googlePatched = false;
  let icsCancelSent = false;

  if (
    opts.inviteChannel === "google" &&
    opts.session.google_event_id
  ) {
    const remaining = await getActiveCourseStudents(opts.session.course_id);
    const result = await upsertCalendarEvent({
      courseName: opts.courseName,
      sessionTitle: opts.session.title,
      sessionDetails: opts.session.description,
      instructorName: opts.session.instructor_name,
      startsAt,
      endsAt,
      timezone,
      meetingUrl: opts.session.meeting_url,
      location: opts.session.location,
      attendeeEmails: remaining.map((s) => s.email),
      googleEventId: opts.session.google_event_id,
    });

    googlePatched = result.syncStatus === "synced";
    const admin = getSupabaseAdmin();
    await admin
      .from("course_sessions")
      .update({
        calendar_sync_status: result.syncStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opts.session.id);
  }

  if (opts.inviteChannel === "ics_email") {
    const icsAttachment = buildSessionIcsAttachment({
      sessionId: opts.session.id,
      courseName: opts.courseName,
      sessionTitle: opts.session.title,
      sessionDetails: opts.session.description,
      instructorName: opts.session.instructor_name,
      startsAt,
      endsAt,
      timezone,
      meetingUrl: opts.session.meeting_url,
      location: opts.session.location,
      attendeeEmails: [opts.student.email],
      method: "CANCEL",
      sequence: 1,
    });

    await sendMail({
      to: opts.student.email,
      subject: `Calendar update: removed from ${opts.session.title} (${opts.courseName})`,
      html: `<p>Hi ${opts.student.fullName || "there"},</p><p>You have been removed from <strong>${opts.session.title}</strong> for ${opts.courseName}. Open the attached calendar cancellation to remove this class from your calendar.</p>`,
      text: `You have been removed from ${opts.session.title} (${opts.courseName}). Open the attached calendar cancellation to remove this class from your calendar.`,
      attachments: [icsAttachment],
    });
    icsCancelSent = true;
  }

  return { googlePatched, icsCancelSent, skipped: false };
}
