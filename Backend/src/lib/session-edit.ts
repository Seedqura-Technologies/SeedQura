import { getSupabaseAdmin } from "./supabase.js";
import {
  syncSessionCalendarAndNotify,
  type SessionRow,
} from "./sessions.js";
import { normalizeOptionalHttpUrl } from "./url.js";

/** Fields that affect calendar invites and student-facing session details. */
export const SESSION_CALENDAR_FIELDS = [
  "title",
  "description",
  "instructor_name",
  "starts_at",
  "ends_at",
  "meeting_url",
  "location",
] as const;

export type SessionCalendarField = (typeof SESSION_CALENDAR_FIELDS)[number];

export type SessionEditBody = Partial<
  Record<
    SessionCalendarField | "status" | "confirmPublishedEdit",
    string | boolean | null
  >
>;

export type SessionForEdit = SessionRow & {
  schedule_rule_id?: string | null;
  notify_sent_at?: string | null;
};

export class SessionEditError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly blockedFields?: string[];

  constructor(
    message: string,
    code: string,
    statusCode = 400,
    blockedFields?: string[]
  ) {
    super(message);
    this.name = "SessionEditError";
    this.code = code;
    this.statusCode = statusCode;
    this.blockedFields = blockedFields;
  }
}

export function isSessionHistorical(
  session: Pick<SessionForEdit, "status" | "ends_at">,
  nowMs: number = Date.now()
): boolean {
  if (session.status === "completed") return true;
  if (session.status === "cancelled") return true;
  const endMs = new Date(session.ends_at).getTime();
  return Number.isFinite(endMs) && endMs < nowMs;
}

export function isSessionPublishedForStudents(
  session: SessionForEdit,
  scheduleRuleStatus?: string | null
): boolean {
  if (scheduleRuleStatus === "published") return true;
  if (session.notify_sent_at) return true;
  if (session.google_event_id) return true;
  if (
    session.calendar_invite_via &&
    session.calendar_invite_via !== "none"
  ) {
    return true;
  }
  if (session.ics_invite_sent_at) return true;
  return false;
}

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function fieldChanged(
  field: SessionCalendarField | "status",
  before: SessionForEdit,
  after: unknown
): boolean {
  if (after === undefined) return false;
  if (field === "meeting_url") {
    const a = after == null || after === "" ? null : String(after).trim();
    const b = before.meeting_url?.trim() || null;
    return a !== b;
  }
  return String(before[field] ?? "") !== String(after ?? "");
}

/** Locked on completed/past/cancelled sessions — preserves historical records. */
const HISTORICAL_LOCKED_FIELDS: SessionCalendarField[] = [
  "title",
  "starts_at",
  "ends_at",
  "instructor_name",
  "meeting_url",
  "location",
];

export type ValidatedSessionEdit = {
  patch: Record<string, unknown>;
  calendarFieldsChanged: SessionCalendarField[];
  isHistorical: boolean;
  isPublished: boolean;
  isFutureScheduled: boolean;
  shouldNotifyStudents: boolean;
  shouldSyncCalendar: boolean;
  requiresConfirmation: boolean;
};

/**
 * Validate admin session edits.
 * Historical sessions: description-only updates; schedule fields are rejected.
 */
export function validateSessionEdit(
  existing: SessionForEdit,
  body: SessionEditBody,
  opts?: { scheduleRuleStatus?: string | null; nowMs?: number }
): ValidatedSessionEdit {
  const nowMs = opts?.nowMs ?? Date.now();
  const isHistorical = isSessionHistorical(existing, nowMs);
  const isPublished = isSessionPublishedForStudents(
    existing,
    opts?.scheduleRuleStatus
  );
  const isFutureScheduled =
    existing.status === "scheduled" &&
    new Date(existing.starts_at).getTime() >= nowMs;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  const blockedFields: string[] = [];
  const calendarFieldsChanged: SessionCalendarField[] = [];

  for (const field of SESSION_CALENDAR_FIELDS) {
    if (body[field] === undefined) continue;

    if (
      !isHistorical &&
      (field === "starts_at" || field === "ends_at") &&
      fieldChanged(field, existing, body[field])
    ) {
      throw new SessionEditError(
        "Use POST /admin/sessions/:id/reschedule to change session date or time.",
        "USE_RESCHEDULE_ENDPOINT",
        400
      );
    }

    if (isHistorical && HISTORICAL_LOCKED_FIELDS.includes(field)) {
      if (fieldChanged(field, existing, body[field])) {
        blockedFields.push(field);
      }
      continue;
    }

    if (field === "meeting_url") {
      const normalized = normalizeOptionalHttpUrl(body.meeting_url);
      if (!normalized.ok) {
        throw new SessionEditError(normalized.error, "INVALID_MEETING_URL", 400);
      }
      patch.meeting_url = normalized.url;
    } else {
      patch[field] = normalizeString(body[field]);
    }

    if (fieldChanged(field, existing, patch[field])) {
      calendarFieldsChanged.push(field);
    }
  }

  if (body.status !== undefined) {
    if (body.status === "cancelled") {
      throw new SessionEditError(
        "Use POST /admin/sessions/:id/cancel to cancel a session",
        "USE_CANCEL_ENDPOINT",
        400
      );
    }
    if (isHistorical && body.status !== existing.status) {
      blockedFields.push("status");
    } else {
      patch.status = String(body.status);
    }
  }

  if (blockedFields.length > 0) {
    throw new SessionEditError(
      `Cannot change ${blockedFields.join(", ")} on a completed or past session. Only the description may be updated to preserve historical records.`,
      "HISTORICAL_SESSION_LOCKED",
      409,
      blockedFields
    );
  }

  const starts = String(patch.starts_at ?? existing.starts_at);
  const ends = String(patch.ends_at ?? existing.ends_at);
  if (new Date(ends) <= new Date(starts)) {
    throw new SessionEditError(
      "ends_at must be after starts_at",
      "INVALID_TIME_RANGE"
    );
  }

  const requiresConfirmation =
    isPublished &&
    isFutureScheduled &&
    calendarFieldsChanged.length > 0 &&
    body.confirmPublishedEdit !== true;

  if (requiresConfirmation) {
    throw new SessionEditError(
      "This session was already published to students. Set confirmPublishedEdit=true to update the calendar event and notify enrolled students.",
      "CONFIRMATION_REQUIRED",
      409
    );
  }

  const becomingCancelled =
    body.status === "cancelled" && existing.status !== "cancelled";

  const shouldNotifyStudents =
    !isHistorical &&
    isPublished &&
    (calendarFieldsChanged.length > 0 || becomingCancelled);

  const shouldSyncCalendar =
    shouldNotifyStudents && existing.status !== "cancelled";

  return {
    patch,
    calendarFieldsChanged,
    isHistorical,
    isPublished,
    isFutureScheduled,
    shouldNotifyStudents,
    shouldSyncCalendar,
    requiresConfirmation: false,
  };
}

export type SafeSessionUpdateResult = {
  session: SessionRow;
  notified: number;
  googleEventId: string | null;
  calendarSyncStatus: string | null;
  calendarFieldsChanged: SessionCalendarField[];
  studentsNotified: boolean;
  calendarSynced: boolean;
  preservedHistorical: boolean;
};

/**
 * Safely update a course session:
 * - Validates historical vs future rules
 * - Patches existing Google Calendar event (same google_event_id)
 * - Emails + in-app notifications when a published future session changes
 */
export async function updateSessionSafely(opts: {
  sessionId: string;
  body: SessionEditBody;
}): Promise<SafeSessionUpdateResult> {
  const admin = getSupabaseAdmin();

  const { data: existing, error: findErr } = await admin
    .from("course_sessions")
    .select("*")
    .eq("id", opts.sessionId)
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

  const validation = validateSessionEdit(
    existing as SessionForEdit,
    opts.body,
    { scheduleRuleStatus }
  );

  if (Object.keys(validation.patch).length <= 1) {
    return {
      session: existing as SessionRow,
      notified: 0,
      googleEventId: existing.google_event_id,
      calendarSyncStatus: existing.calendar_sync_status ?? null,
      calendarFieldsChanged: [],
      studentsNotified: false,
      calendarSynced: false,
      preservedHistorical: validation.isHistorical,
    };
  }

  const previousGoogleEventId = existing.google_event_id;

  const { data: session, error: updateErr } = await admin
    .from("course_sessions")
    .update(validation.patch)
    .eq("id", opts.sessionId)
    .select("*")
    .single();
  if (updateErr) throw updateErr;

  const { data: course } = await admin
    .from("courses")
    .select("name")
    .eq("id", session.course_id)
    .maybeSingle();

  let notified = 0;
  let googleEventId: string | null = session.google_event_id;
  let calendarSyncStatus: string | null = session.calendar_sync_status ?? null;

  if (validation.shouldNotifyStudents) {
    const action =
      session.status === "cancelled" ? ("cancelled" as const) : ("updated" as const);

    const notify = await syncSessionCalendarAndNotify({
      session: session as SessionRow,
      courseName: course?.name || session.course_id,
      timezone: scheduleTimezone,
      action,
    });

    notified = notify.notified;
    googleEventId = notify.googleEventId;
    calendarSyncStatus = notify.calendarSyncStatus;

    if (
      previousGoogleEventId &&
      googleEventId &&
      googleEventId !== previousGoogleEventId
    ) {
      console.error(
        "[updateSessionSafely] unexpected google_event_id change — reverting to original",
        {
          sessionId: session.id,
          before: previousGoogleEventId,
          after: googleEventId,
        }
      );
      await admin
        .from("course_sessions")
        .update({
          google_event_id: previousGoogleEventId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);
      googleEventId = previousGoogleEventId;
    }
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
    calendarFieldsChanged: validation.calendarFieldsChanged,
    studentsNotified: validation.shouldNotifyStudents,
    calendarSynced: validation.shouldSyncCalendar,
    preservedHistorical: validation.isHistorical,
  };
}
