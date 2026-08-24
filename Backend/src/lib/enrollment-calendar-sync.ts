import { getSupabaseAdmin } from "./supabase.js";
import { getActiveCourseStudent } from "./course-students.js";
import {
  listFutureInvitedSessionsForUser,
  revokeSessionStudentInvite,
} from "./session-student-invites.js";
import {
  removeStudentFromSessionCalendar,
  type SessionRow,
} from "./sessions.js";
import { syncStudentCourseCalendar } from "./student-course-calendar.js";

export type EnrollmentCalendarSyncStatus =
  | "pending"
  | "synced"
  | "failed"
  | "not_applicable";

export type EnrollmentCalendarDirection = "add" | "remove" | "none";

export type SyncEnrollmentCalendarResult = {
  ok: boolean;
  enrollmentId: string;
  direction: EnrollmentCalendarDirection;
  sessionsProcessed: number;
  sessionsSkipped: number;
  sessionsAdded: number;
  sessionsRemoved: number;
  googleUpdates: number;
  icsCancellationsSent: number;
  errors: string[];
  syncStatus: EnrollmentCalendarSyncStatus;
};

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  payment_status: string;
  profile: { full_name: string | null; email: string | null } | null;
};

/**
 * Determine whether to add or remove a student from future session calendars.
 */
export function resolveEnrollmentCalendarDirection(enrollment: {
  status: string;
  payment_status: string;
}): EnrollmentCalendarDirection {
  if (
    enrollment.status === "active" &&
    enrollment.payment_status === "paid"
  ) {
    return "add";
  }
  if (
    enrollment.status === "rejected" ||
    enrollment.status === "refunded" ||
    enrollment.payment_status === "refunded"
  ) {
    return "remove";
  }
  return "none";
}

async function loadEnrollment(enrollmentId: string): Promise<EnrollmentRow | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("enrollments")
    .select(
      "id, user_id, course_id, status, payment_status, profile:profiles(full_name, email)"
    )
    .eq("id", enrollmentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const profile = Array.isArray(data.profile) ? data.profile[0] : data.profile;
  return { ...data, profile: profile ?? null } as EnrollmentRow;
}

async function touchSyncAttempt(enrollmentId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("enrollments")
    .update({
      calendar_sync_attempted_at: new Date().toISOString(),
      calendar_sync_status: "pending",
      calendar_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId);
  if (error) throw error;
}

async function markEnrollmentSyncStatus(
  enrollmentId: string,
  syncStatus: EnrollmentCalendarSyncStatus,
  syncError: string | null
): Promise<void> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("enrollments")
    .update({
      calendar_sync_status: syncStatus,
      calendar_synced_at: syncStatus === "synced" ? now : null,
      calendar_sync_error: syncError,
      updated_at: now,
    })
    .eq("id", enrollmentId);
  if (error) throw error;
}

async function runAddPath(
  enrollment: EnrollmentRow
): Promise<Omit<SyncEnrollmentCalendarResult, "enrollmentId" | "direction">> {
  const student = await getActiveCourseStudent(
    enrollment.user_id,
    enrollment.course_id
  );
  if (!student) {
    await markEnrollmentSyncStatus(enrollment.id, "not_applicable", null);
    return {
      ok: true,
      sessionsProcessed: 0,
      sessionsSkipped: 0,
      sessionsAdded: 0,
      sessionsRemoved: 0,
      googleUpdates: 0,
      icsCancellationsSent: 0,
      errors: [],
      syncStatus: "not_applicable",
    };
  }

  const add = await syncStudentCourseCalendar(
    enrollment.user_id,
    enrollment.course_id
  );

  if (add.reason === "not_enrolled") {
    await markEnrollmentSyncStatus(enrollment.id, "not_applicable", null);
    return {
      ok: true,
      sessionsProcessed: 0,
      sessionsSkipped: 0,
      sessionsAdded: 0,
      sessionsRemoved: 0,
      googleUpdates: 0,
      icsCancellationsSent: 0,
      errors: [],
      syncStatus: "not_applicable",
    };
  }

  const syncStatus: EnrollmentCalendarSyncStatus = add.ok ? "synced" : "failed";
  const syncError = add.errors.length > 0 ? add.errors.join("; ") : null;
  await markEnrollmentSyncStatus(enrollment.id, syncStatus, syncError);

  return {
    ok: add.ok,
    sessionsProcessed: add.sessionsInvited,
    sessionsSkipped: add.sessionsSkipped,
    sessionsAdded: add.sessionsInvited,
    sessionsRemoved: 0,
    googleUpdates: add.googleInvites,
    icsCancellationsSent: 0,
    errors: add.errors,
    syncStatus,
  };
}

async function runRemovePath(
  enrollment: EnrollmentRow
): Promise<Omit<SyncEnrollmentCalendarResult, "enrollmentId" | "direction">> {
  const profile = enrollment.profile;
  const email = profile?.email?.trim();
  if (!email || !email.includes("@")) {
    await markEnrollmentSyncStatus(
      enrollment.id,
      "not_applicable",
      "No email on profile — nothing to remove from calendar"
    );
    return {
      ok: true,
      sessionsProcessed: 0,
      sessionsSkipped: 0,
      sessionsAdded: 0,
      sessionsRemoved: 0,
      googleUpdates: 0,
      icsCancellationsSent: 0,
      errors: [],
      syncStatus: "not_applicable",
    };
  }

  const admin = getSupabaseAdmin();
  const { data: course } = await admin
    .from("courses")
    .select("name")
    .eq("id", enrollment.course_id)
    .maybeSingle();
  const courseName = course?.name || enrollment.course_id;

  const invited = await listFutureInvitedSessionsForUser(
    enrollment.user_id,
    enrollment.course_id
  );

  if (invited.length === 0) {
    await markEnrollmentSyncStatus(enrollment.id, "synced", null);
    return {
      ok: true,
      sessionsProcessed: 0,
      sessionsSkipped: 0,
      sessionsAdded: 0,
      sessionsRemoved: 0,
      googleUpdates: 0,
      icsCancellationsSent: 0,
      errors: [],
      syncStatus: "synced",
    };
  }

  const sessionIds = invited.map((i) => i.sessionId);
  const { data: sessionRows, error: sessionErr } = await admin
    .from("course_sessions")
    .select(
      `id, course_id, title, description, instructor_name, starts_at, ends_at,
       meeting_url, location, status, google_event_id, calendar_sync_status,
       calendar_invite_via, schedule_rule_id,
       schedule_rule:course_schedule_rules(timezone)`
    )
    .in("id", sessionIds);
  if (sessionErr) throw sessionErr;

  const sessionsById = new Map(
    (sessionRows ?? []).map((s) => [s.id as string, s])
  );

  const student = {
    userId: enrollment.user_id,
    fullName: (profile?.full_name || "").trim(),
    email,
  };

  const errors: string[] = [];
  let sessionsProcessed = 0;
  let sessionsSkipped = 0;
  let sessionsRemoved = 0;
  let googleUpdates = 0;
  let icsCancellationsSent = 0;

  for (const invite of invited) {
    const raw = sessionsById.get(invite.sessionId);
    if (!raw) {
      sessionsSkipped += 1;
      continue;
    }

    const rule = Array.isArray(raw.schedule_rule)
      ? raw.schedule_rule[0]
      : raw.schedule_rule;
    const timezone =
      (rule as { timezone?: string } | null)?.timezone?.trim() ||
      process.env.SESSION_TIMEZONE ||
      "Asia/Kolkata";

    const session = raw as SessionRow;

    if (new Date(session.starts_at).getTime() <= Date.now()) {
      sessionsSkipped += 1;
      continue;
    }

    try {
      const result = await removeStudentFromSessionCalendar({
        session,
        student,
        courseName,
        inviteChannel: invite.inviteChannel,
        timezone,
      });

      if (result.skipped) {
        sessionsSkipped += 1;
        await revokeSessionStudentInvite(invite.sessionId, enrollment.user_id);
        continue;
      }

      await revokeSessionStudentInvite(invite.sessionId, enrollment.user_id);
      sessionsProcessed += 1;
      sessionsRemoved += 1;
      if (result.googlePatched) googleUpdates += 1;
      if (result.icsCancelSent) icsCancellationsSent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`session ${invite.sessionId}: ${message}`);
      console.error("[syncEnrollmentCalendar] remove failed", {
        enrollmentId: enrollment.id,
        sessionId: invite.sessionId,
        err,
      });
    }
  }

  const syncStatus: EnrollmentCalendarSyncStatus =
    errors.length === 0 ? "synced" : "failed";
  const syncError = errors.length > 0 ? errors.join("; ") : null;
  await markEnrollmentSyncStatus(enrollment.id, syncStatus, syncError);

  return {
    ok: errors.length === 0,
    sessionsProcessed,
    sessionsSkipped,
    sessionsAdded: 0,
    sessionsRemoved,
    googleUpdates,
    icsCancellationsSent,
    errors,
    syncStatus,
  };
}

/**
 * Sync a student's calendar attendance for all relevant future published sessions.
 * Idempotent: skips sessions where the student is already invited (add) or not invited (remove).
 * Never throws — failures are logged and recorded on the enrollment for retry.
 */
export async function syncEnrollmentCalendar(
  enrollmentId: string
): Promise<SyncEnrollmentCalendarResult> {
  const empty: SyncEnrollmentCalendarResult = {
    ok: false,
    enrollmentId,
    direction: "none",
    sessionsProcessed: 0,
    sessionsSkipped: 0,
    sessionsAdded: 0,
    sessionsRemoved: 0,
    googleUpdates: 0,
    icsCancellationsSent: 0,
    errors: [],
    syncStatus: "failed",
  };

  try {
    const enrollment = await loadEnrollment(enrollmentId);
    if (!enrollment) {
      console.error("[syncEnrollmentCalendar] enrollment not found", {
        enrollmentId,
      });
      return {
        ...empty,
        errors: ["Enrollment not found"],
      };
    }

    await touchSyncAttempt(enrollmentId);
    const direction = resolveEnrollmentCalendarDirection(enrollment);

    if (direction === "none") {
      await markEnrollmentSyncStatus(enrollmentId, "not_applicable", null);
      return {
        ...empty,
        ok: true,
        direction: "none",
        syncStatus: "not_applicable",
        errors: [],
      };
    }

    const result =
      direction === "add"
        ? await runAddPath(enrollment)
        : await runRemovePath(enrollment);

    return {
      enrollmentId,
      direction,
      ...result,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[syncEnrollmentCalendar] failed", { enrollmentId, err });
    try {
      await markEnrollmentSyncStatus(enrollmentId, "failed", message);
    } catch (markErr) {
      console.error("[syncEnrollmentCalendar] could not mark sync failed", {
        enrollmentId,
        markErr,
      });
    }
    return {
      ...empty,
      errors: [message],
      syncStatus: "failed",
    };
  }
}
