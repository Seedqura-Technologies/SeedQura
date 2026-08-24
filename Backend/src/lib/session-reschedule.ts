import { getSupabaseAdmin } from "./supabase.js";
import {
  deliverSessionCalendarInvites,
  syncSessionCalendarAndNotify,
  type SessionRow,
} from "./sessions.js";
import {
  SessionEditError,
  isSessionHistorical,
  isSessionPublishedForStudents,
  type SessionForEdit,
} from "./session-edit.js";

export type RescheduleMode = "in_place" | "replacement_created";

export type RescheduleSessionInput = {
  sessionId: string;
  startsAt: string;
  endsAt: string;
  mode?: RescheduleMode;
  note?: string | null;
  confirmReschedule?: boolean;
  rescheduledBy?: string | null;
};

export type RescheduleSessionResult = {
  session: SessionRow;
  auditId: string;
  mode: RescheduleMode;
  replacementSessionId: string | null;
  notified: number;
  googleEventId: string | null;
  calendarSyncStatus: string | null;
  studentsNotified: boolean;
};

function timesUnchanged(
  session: SessionForEdit,
  startsAt: string,
  endsAt: string
): boolean {
  return (
    new Date(session.starts_at).getTime() === new Date(startsAt).getTime() &&
    new Date(session.ends_at).getTime() === new Date(endsAt).getTime()
  );
}

export function validateSessionReschedule(
  session: SessionForEdit,
  input: Pick<
    RescheduleSessionInput,
    "startsAt" | "endsAt" | "mode" | "confirmReschedule"
  >,
  opts?: { scheduleRuleStatus?: string | null; nowMs?: number }
): {
  isPublished: boolean;
  shouldNotifyStudents: boolean;
  mode: RescheduleMode;
} {
  const nowMs = opts?.nowMs ?? Date.now();
  const mode =
    input.mode === "replacement_created" ? "replacement_created" : "in_place";

  if (session.status === "cancelled") {
    throw new SessionEditError(
      "Cannot reschedule a cancelled session",
      "SESSION_CANCELLED",
      409
    );
  }

  if (session.status !== "scheduled") {
    throw new SessionEditError(
      "Only scheduled sessions can be rescheduled",
      "INVALID_STATUS",
      409
    );
  }

  const startsMs = new Date(session.starts_at).getTime();
  if (!Number.isFinite(startsMs) || startsMs < nowMs) {
    throw new SessionEditError(
      "Only future sessions can be rescheduled",
      "SESSION_NOT_FUTURE",
      409
    );
  }

  if (isSessionHistorical(session, nowMs)) {
    throw new SessionEditError(
      "Cannot reschedule a past session",
      "SESSION_PAST",
      409
    );
  }

  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    throw new SessionEditError(
      "ends_at must be after starts_at",
      "INVALID_TIME_RANGE"
    );
  }

  if (timesUnchanged(session, input.startsAt, input.endsAt)) {
    throw new SessionEditError(
      "New date/time is the same as the current schedule",
      "NO_CHANGE",
      400
    );
  }

  const isPublished = isSessionPublishedForStudents(
    session,
    opts?.scheduleRuleStatus
  );

  if (isPublished && input.confirmReschedule !== true) {
    throw new SessionEditError(
      "This session was published to students. Set confirmReschedule=true to update calendars and notify enrolled students.",
      "CONFIRMATION_REQUIRED",
      409
    );
  }

  return {
    isPublished,
    shouldNotifyStudents: isPublished,
    mode,
  };
}

async function writeRescheduleAudit(opts: {
  sessionId: string;
  courseId: string;
  mode: RescheduleMode;
  previousStartsAt: string;
  previousEndsAt: string;
  newStartsAt: string;
  newEndsAt: string;
  replacementSessionId?: string | null;
  rescheduledBy?: string | null;
  note?: string | null;
}): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("course_session_reschedules")
    .insert({
      session_id: opts.sessionId,
      course_id: opts.courseId,
      mode: opts.mode,
      previous_starts_at: opts.previousStartsAt,
      previous_ends_at: opts.previousEndsAt,
      new_starts_at: opts.newStartsAt,
      new_ends_at: opts.newEndsAt,
      replacement_session_id: opts.replacementSessionId ?? null,
      rescheduled_by: opts.rescheduledBy ?? null,
      note: opts.note?.trim() || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function rescheduleInPlace(opts: {
  session: SessionRow;
  previousStartsAt: string;
  previousEndsAt: string;
  newStartsAt: string;
  newEndsAt: string;
  courseName: string;
  scheduleTimezone?: string;
  shouldNotifyStudents: boolean;
  note?: string | null;
  rescheduledBy?: string | null;
}): Promise<{
  session: SessionRow;
  auditId: string;
  notified: number;
  googleEventId: string | null;
  calendarSyncStatus: string | null;
}> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const previousGoogleEventId = opts.session.google_event_id;

  const { data: updated, error } = await admin
    .from("course_sessions")
    .update({
      starts_at: opts.newStartsAt,
      ends_at: opts.newEndsAt,
      last_rescheduled_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", opts.session.id)
    .select("*")
    .single();
  if (error) throw error;

  const auditId = await writeRescheduleAudit({
    sessionId: opts.session.id,
    courseId: opts.session.course_id,
    mode: "in_place",
    previousStartsAt: opts.previousStartsAt,
    previousEndsAt: opts.previousEndsAt,
    newStartsAt: opts.newStartsAt,
    newEndsAt: opts.newEndsAt,
    rescheduledBy: opts.rescheduledBy,
    note: opts.note,
  });

  let notified = 0;
  let googleEventId: string | null = updated.google_event_id;
  let calendarSyncStatus: string | null = updated.calendar_sync_status ?? null;

  if (opts.shouldNotifyStudents) {
    const notify = await syncSessionCalendarAndNotify({
      session: updated as SessionRow,
      courseName: opts.courseName,
      timezone: opts.scheduleTimezone,
      action: "rescheduled",
      previousStartsAt: opts.previousStartsAt,
      previousEndsAt: opts.previousEndsAt,
      rescheduleNote: opts.note,
      rescheduleMode: "in_place",
    });
    notified = notify.notified;
    googleEventId = notify.googleEventId;
    calendarSyncStatus = notify.calendarSyncStatus;

    if (
      previousGoogleEventId &&
      googleEventId &&
      googleEventId !== previousGoogleEventId
    ) {
      await admin
        .from("course_sessions")
        .update({
          google_event_id: previousGoogleEventId,
          updated_at: nowIso,
        })
        .eq("id", opts.session.id);
      googleEventId = previousGoogleEventId;
    }
  } else if (updated.google_event_id) {
    const cal = await deliverSessionCalendarInvites({
      session: updated as SessionRow,
      courseName: opts.courseName,
      timezone: opts.scheduleTimezone,
      action: "upsert",
    });
    googleEventId = cal.googleEventId;
    calendarSyncStatus = cal.calendarSyncStatus;
  }

  const { data: refreshed } = await admin
    .from("course_sessions")
    .select("*")
    .eq("id", opts.session.id)
    .single();

  return {
    session: (refreshed || updated) as SessionRow,
    auditId,
    notified,
    googleEventId,
    calendarSyncStatus,
  };
}

async function rescheduleAsReplacement(opts: {
  session: SessionRow;
  previousStartsAt: string;
  previousEndsAt: string;
  newStartsAt: string;
  newEndsAt: string;
  courseName: string;
  scheduleTimezone?: string;
  shouldNotifyStudents: boolean;
  note?: string | null;
  rescheduledBy?: string | null;
}): Promise<{
  session: SessionRow;
  auditId: string;
  replacementSessionId: string;
  notified: number;
  googleEventId: string | null;
  calendarSyncStatus: string | null;
}> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  if (opts.session.google_event_id) {
    await deliverSessionCalendarInvites({
      session: opts.session,
      courseName: opts.courseName,
      timezone: opts.scheduleTimezone,
      action: "cancel",
    });
  }

  await admin
    .from("course_sessions")
    .update({
      status: "cancelled",
      cancellation_reason:
        opts.note?.trim() ||
        "Rescheduled — this session was replaced by a new session at a different date/time.",
      replacement_planned: "yes",
      cancelled_at: nowIso,
      calendar_event_status: "cancelled",
      calendar_sync_status: "cancelled",
      updated_at: nowIso,
    })
    .eq("id", opts.session.id);

  const { data: replacement, error: insErr } = await admin
    .from("course_sessions")
    .insert({
      course_id: opts.session.course_id,
      schedule_rule_id: opts.session.schedule_rule_id,
      title: opts.session.title,
      description: opts.session.description,
      instructor_name: opts.session.instructor_name,
      starts_at: opts.newStartsAt,
      ends_at: opts.newEndsAt,
      meeting_url: opts.session.meeting_url,
      location: opts.session.location,
      status: "scheduled",
      last_rescheduled_at: nowIso,
    })
    .select("*")
    .single();
  if (insErr) throw insErr;

  const auditId = await writeRescheduleAudit({
    sessionId: opts.session.id,
    courseId: opts.session.course_id,
    mode: "replacement_created",
    previousStartsAt: opts.previousStartsAt,
    previousEndsAt: opts.previousEndsAt,
    newStartsAt: opts.newStartsAt,
    newEndsAt: opts.newEndsAt,
    replacementSessionId: replacement.id,
    rescheduledBy: opts.rescheduledBy,
    note: opts.note,
  });

  let notified = 0;
  let googleEventId: string | null = null;
  let calendarSyncStatus: string | null = null;

  if (opts.shouldNotifyStudents) {
    const notify = await syncSessionCalendarAndNotify({
      session: replacement as SessionRow,
      courseName: opts.courseName,
      timezone: opts.scheduleTimezone,
      action: "rescheduled",
      previousStartsAt: opts.previousStartsAt,
      previousEndsAt: opts.previousEndsAt,
      rescheduleNote: opts.note,
      rescheduleMode: "replacement_created",
    });
    notified = notify.notified;
    googleEventId = notify.googleEventId;
    calendarSyncStatus = notify.calendarSyncStatus;
  }

  const { data: refreshed } = await admin
    .from("course_sessions")
    .select("*")
    .eq("id", replacement.id)
    .single();

  return {
    session: (refreshed || replacement) as SessionRow,
    auditId,
    replacementSessionId: replacement.id,
    notified,
    googleEventId,
    calendarSyncStatus,
  };
}

/** Reschedule a future session in-place (default) or as a new replacement row. */
export async function rescheduleSessionSafely(
  input: RescheduleSessionInput
): Promise<RescheduleSessionResult> {
  const admin = getSupabaseAdmin();

  const { data: existing, error: findErr } = await admin
    .from("course_sessions")
    .select("*")
    .eq("id", input.sessionId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!existing) {
    throw new SessionEditError("Session not found", "NOT_FOUND", 404);
  }

  let scheduleRuleStatus: string | null = null;
  let scheduleTimezone: string | undefined;
  if (existing.schedule_rule_id) {
    const { data: rule } = await admin
      .from("course_schedule_rules")
      .select("status, timezone")
      .eq("id", existing.schedule_rule_id)
      .maybeSingle();
    scheduleRuleStatus = rule?.status ?? null;
    scheduleTimezone = rule?.timezone ?? undefined;
  }

  const validation = validateSessionReschedule(
    existing as SessionForEdit,
    {
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      mode: input.mode,
      confirmReschedule: input.confirmReschedule,
    },
    { scheduleRuleStatus }
  );

  const { data: course } = await admin
    .from("courses")
    .select("name")
    .eq("id", existing.course_id)
    .maybeSingle();
  const courseName = course?.name || existing.course_id;

  const previousStartsAt =
    typeof existing.starts_at === "string"
      ? existing.starts_at
      : new Date(existing.starts_at).toISOString();
  const previousEndsAt =
    typeof existing.ends_at === "string"
      ? existing.ends_at
      : new Date(existing.ends_at).toISOString();

  const common = {
    session: existing as SessionRow,
    previousStartsAt,
    previousEndsAt,
    newStartsAt: input.startsAt,
    newEndsAt: input.endsAt,
    courseName,
    scheduleTimezone,
    shouldNotifyStudents: validation.shouldNotifyStudents,
    note: input.note,
    rescheduledBy: input.rescheduledBy,
  };

  if (validation.mode === "replacement_created") {
    const result = await rescheduleAsReplacement(common);
    return {
      session: result.session,
      auditId: result.auditId,
      mode: "replacement_created",
      replacementSessionId: result.replacementSessionId,
      notified: result.notified,
      googleEventId: result.googleEventId,
      calendarSyncStatus: result.calendarSyncStatus,
      studentsNotified: validation.shouldNotifyStudents,
    };
  }

  const result = await rescheduleInPlace(common);
  return {
    session: result.session,
    auditId: result.auditId,
    mode: "in_place",
    replacementSessionId: null,
    notified: result.notified,
    googleEventId: result.googleEventId,
    calendarSyncStatus: result.calendarSyncStatus,
    studentsNotified: validation.shouldNotifyStudents,
  };
}
