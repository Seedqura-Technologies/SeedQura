import { getSupabaseAdmin } from "./supabase.js";
import {
  deliverSessionCalendarInvites,
  type SessionRow,
} from "./sessions.js";
import {
  isGoogleCalendarConfigured,
  logCalendarSync,
  sanitizeCalendarLogMessage,
  type CalendarSyncStatus,
} from "./google-calendar.js";
import { SessionEditError } from "./session-edit.js";

export type SessionCalendarSyncLabel =
  | "Synced"
  | "Pending"
  | "Failed"
  | "Cancelled";

export type RetrySessionCalendarSyncResult = {
  ok: boolean;
  sessionId: string;
  googleEventId: string | null;
  calendarSyncStatus: CalendarSyncStatus;
  calendarSyncError: string | null;
  recreated: boolean;
  attendeeCount: number;
  icsEmailsSent: number;
};

type SessionForRetry = SessionRow & {
  notify_sent_at?: string | null;
  calendar_invite_via?: string | null;
  calendar_sync_error?: string | null;
  schedule_rule?: { status: string; timezone?: string } | { status: string; timezone?: string }[] | null;
};

/** Admin-facing label for course_sessions.calendar_sync_status. */
export function sessionCalendarSyncLabel(session: {
  status: string;
  calendar_sync_status?: string | null;
  calendar_event_status?: string | null;
  google_event_id?: string | null;
}): SessionCalendarSyncLabel {
  if (session.status === "cancelled") return "Cancelled";
  const raw = (session.calendar_sync_status || "").toLowerCase();
  if (raw === "cancelled" || session.calendar_event_status === "cancelled") {
    return "Cancelled";
  }
  if (raw === "failed") return "Failed";
  if (raw === "pending") return "Pending";
  if (raw === "synced" || session.google_event_id) return "Synced";
  return "Pending";
}

/** Whether admin retry is allowed for this session's calendar sync. */
export function canRetrySessionCalendarSync(
  session: {
    status: string;
    starts_at: string;
    calendar_sync_status?: string | null;
    notify_sent_at?: string | null;
    google_event_id?: string | null;
    calendar_invite_via?: string | null;
    schedule_rule_id?: string | null;
    schedule_rule?: { status: string } | { status: string }[] | null;
  },
  nowMs: number = Date.now()
): boolean {
  if (session.status === "cancelled") return false;
  if (new Date(session.starts_at).getTime() < nowMs) return false;

  const raw = (session.calendar_sync_status || "").toLowerCase();
  if (raw !== "failed" && raw !== "pending") return false;

  if (session.google_event_id || session.calendar_invite_via) return true;
  if (session.notify_sent_at) return true;

  if (session.schedule_rule_id) {
    const rule = Array.isArray(session.schedule_rule)
      ? session.schedule_rule[0]
      : session.schedule_rule;
    return rule?.status === "published";
  }

  return false;
}

function sessionTimezone(session: SessionForRetry): string {
  const rule = Array.isArray(session.schedule_rule)
    ? session.schedule_rule[0]
    : session.schedule_rule;
  return rule?.timezone?.trim() || process.env.SESSION_TIMEZONE || "Asia/Kolkata";
}

/**
 * Retry Google Calendar sync for a session using stored session/event data.
 * Patches the existing google_event_id when present; recreates only if Google
 * reports the event missing. Does not re-email students.
 */
export async function retrySessionCalendarSync(
  sessionId: string
): Promise<RetrySessionCalendarSyncResult> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: session, error } = await admin
    .from("course_sessions")
    .select(
      `id, course_id, title, description, instructor_name, starts_at, ends_at,
       meeting_url, location, status, google_event_id, calendar_sync_status,
       calendar_event_status, calendar_invite_via, ics_invite_sent_at,
       notify_sent_at, schedule_rule_id, calendar_sync_error,
       schedule_rule:course_schedule_rules(status, timezone)`
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!session) {
    throw new SessionEditError("Session not found", "NOT_FOUND", 404);
  }

  const row = session as SessionForRetry;

  if (!canRetrySessionCalendarSync(row)) {
    throw new SessionEditError(
      "Calendar retry is only available for failed or pending sync on published future sessions",
      "RETRY_NOT_ALLOWED",
      409
    );
  }

  if (!isGoogleCalendarConfigured()) {
    throw new SessionEditError(
      "Google Calendar is not configured on the server",
      "CALENDAR_NOT_CONFIGURED",
      503
    );
  }

  await admin
    .from("course_sessions")
    .update({
      calendar_sync_attempted_at: nowIso,
      calendar_sync_error: null,
      updated_at: nowIso,
    })
    .eq("id", sessionId);

  logCalendarSync({
    level: "info",
    operation: "retry",
    sessionId,
    googleEventId: row.google_event_id,
    message: "Admin retry started",
  });

  const { data: course } = await admin
    .from("courses")
    .select("name")
    .eq("id", row.course_id)
    .maybeSingle();

  const courseName = course?.name || row.course_id;
  const action = row.status === "cancelled" ? "cancel" : "upsert";

  let cal;
  try {
    cal = await deliverSessionCalendarInvites({
      session: row,
      courseName,
      timezone: sessionTimezone(row),
      action,
      forceIcs:
        row.calendar_invite_via === "ics_email" ||
        Boolean(row.ics_invite_sent_at),
    });
  } catch (err) {
    const message = sanitizeCalendarLogMessage(
      err instanceof Error ? err.message : String(err)
    );
    await admin
      .from("course_sessions")
      .update({
        calendar_sync_status: "failed",
        calendar_sync_error: message.slice(0, 2000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    logCalendarSync({
      level: "error",
      operation: "retry",
      sessionId,
      googleEventId: row.google_event_id,
      syncStatus: "failed",
      error: message,
    });

    return {
      ok: false,
      sessionId,
      googleEventId: row.google_event_id,
      calendarSyncStatus: "failed",
      calendarSyncError: message,
      recreated: false,
      attendeeCount: 0,
      icsEmailsSent: 0,
    };
  }

  const { data: refreshed } = await admin
    .from("course_sessions")
    .select("google_event_id, calendar_sync_status, calendar_sync_error")
    .eq("id", sessionId)
    .maybeSingle();

  const syncStatus = (cal.calendarSyncStatus ||
    refreshed?.calendar_sync_status ||
    "failed") as CalendarSyncStatus;
  const syncError = refreshed?.calendar_sync_error ?? null;
  const recreated = cal.recreated;

  logCalendarSync({
    level: syncStatus === "failed" ? "error" : "info",
    operation: "retry",
    sessionId,
    googleEventId: cal.googleEventId ?? refreshed?.google_event_id,
    syncStatus,
    attendeeCount: cal.attendeeCount,
    recreated,
    error: syncError ?? undefined,
    message: syncStatus === "synced" ? "Admin retry succeeded" : undefined,
  });

  return {
    ok: syncStatus === "synced" || syncStatus === "cancelled",
    sessionId,
    googleEventId: cal.googleEventId ?? refreshed?.google_event_id ?? null,
    calendarSyncStatus: syncStatus,
    calendarSyncError: syncError,
    recreated,
    attendeeCount: cal.attendeeCount,
    icsEmailsSent: cal.icsEmailsSent,
  };
}
