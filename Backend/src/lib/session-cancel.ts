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
import type { ReplacementPlanned } from "./mail.js";

export type CancelSessionInput = {
  sessionId: string;
  cancellationReason?: string | null;
  replacementPlanned?: ReplacementPlanned;
  /** Required when cancelled session was published to students. */
  confirmPublishedCancel?: boolean;
};

export type CancelSessionResult = {
  session: SessionRow;
  notified: number;
  googleEventId: string | null;
  calendarSyncStatus: string | null;
  calendarEventStatus: string | null;
  studentsNotified: boolean;
  scheduleRuleUnchanged: true;
};

function normalizeReplacementPlanned(
  value: unknown
): ReplacementPlanned {
  const v = String(value ?? "unknown").trim().toLowerCase();
  if (v === "yes" || v === "no") return v;
  return "unknown";
}

export function validateSessionCancellation(
  session: SessionForEdit,
  opts: {
    scheduleRuleStatus?: string | null;
    confirmPublishedCancel?: boolean;
    nowMs?: number;
  }
): {
  isPublished: boolean;
  isFuture: boolean;
  requiresConfirmation: boolean;
  shouldNotifyStudents: boolean;
} {
  const nowMs = opts.nowMs ?? Date.now();

  if (session.status === "cancelled") {
    throw new SessionEditError(
      "Session is already cancelled",
      "ALREADY_CANCELLED",
      409
    );
  }

  if (session.status === "completed") {
    throw new SessionEditError(
      "Cannot cancel a completed session",
      "SESSION_COMPLETED",
      409
    );
  }

  if (isSessionHistorical(session, nowMs) && session.status !== "scheduled") {
    throw new SessionEditError(
      "Cannot cancel a past session",
      "SESSION_PAST",
      409
    );
  }

  const startsMs = new Date(session.starts_at).getTime();
  const isFuture =
    session.status === "scheduled" &&
    Number.isFinite(startsMs) &&
    startsMs >= nowMs;

  if (!isFuture) {
    throw new SessionEditError(
      "Only future scheduled sessions can be cancelled",
      "SESSION_NOT_FUTURE",
      409
    );
  }

  const isPublished = isSessionPublishedForStudents(
    session,
    opts.scheduleRuleStatus
  );

  const requiresConfirmation =
    isPublished && opts.confirmPublishedCancel !== true;

  if (requiresConfirmation) {
    throw new SessionEditError(
      "This session was published to students. Set confirmPublishedCancel=true to cancel the calendar event and notify enrolled students.",
      "CONFIRMATION_REQUIRED",
      409
    );
  }

  return {
    isPublished,
    isFuture,
    requiresConfirmation: false,
    shouldNotifyStudents: isPublished,
  };
}

/**
 * Cancel a single future course session (soft cancel).
 * Does not cancel the parent schedule rule or other sessions.
 */
export async function cancelSessionSafely(
  input: CancelSessionInput
): Promise<CancelSessionResult> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

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

  const validation = validateSessionCancellation(existing as SessionForEdit, {
    scheduleRuleStatus,
    confirmPublishedCancel: input.confirmPublishedCancel,
  });

  const reason = String(input.cancellationReason ?? "").trim() || null;
  const replacementPlanned = normalizeReplacementPlanned(
    input.replacementPlanned
  );

  const { data: session, error: updateErr } = await admin
    .from("course_sessions")
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      replacement_planned: replacementPlanned,
      cancelled_at: nowIso,
      calendar_event_status: "cancelled",
      updated_at: nowIso,
    })
    .eq("id", input.sessionId)
    .select("*")
    .single();
  if (updateErr) throw updateErr;

  const { data: course } = await admin
    .from("courses")
    .select("name")
    .eq("id", session.course_id)
    .maybeSingle();
  const courseName = course?.name || session.course_id;

  let notified = 0;
  let googleEventId: string | null = session.google_event_id;
  let calendarSyncStatus: string | null = session.calendar_sync_status ?? null;
  let calendarEventStatus: string | null =
    session.calendar_event_status ?? "cancelled";

  if (validation.shouldNotifyStudents) {
    const notify = await syncSessionCalendarAndNotify({
      session: session as SessionRow,
      courseName,
      timezone: scheduleTimezone,
      action: "cancelled",
      cancellationReason: reason,
      replacementPlanned,
    });
    notified = notify.notified;
    googleEventId = notify.googleEventId;
    calendarSyncStatus = notify.calendarSyncStatus;
    calendarEventStatus = notify.calendarEventStatus;
  } else if (session.google_event_id) {
    const cal = await deliverSessionCalendarInvites({
      session: session as SessionRow,
      courseName,
      timezone: scheduleTimezone,
      action: "cancel",
    });
    googleEventId = cal.googleEventId;
    calendarSyncStatus = cal.calendarSyncStatus;
    calendarEventStatus = cal.calendarEventStatus;
    await admin
      .from("course_sessions")
      .update({
        google_event_id: googleEventId,
        calendar_sync_status: calendarSyncStatus,
        calendar_event_status: calendarEventStatus,
        updated_at: nowIso,
      })
      .eq("id", session.id);
  } else {
    await admin
      .from("course_sessions")
      .update({
        calendar_sync_status: "cancelled",
        calendar_event_status: "cancelled",
        updated_at: nowIso,
      })
      .eq("id", session.id);
    calendarSyncStatus = "cancelled";
  }

  const { data: refreshed } = await admin
    .from("course_sessions")
    .select("*")
    .eq("id", session.id)
    .single();

  return {
    session: (refreshed || session) as SessionRow,
    notified,
    googleEventId,
    calendarSyncStatus,
    calendarEventStatus,
    studentsNotified: validation.shouldNotifyStudents,
    scheduleRuleUnchanged: true,
  };
}
