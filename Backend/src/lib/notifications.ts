import { getSupabaseAdmin } from "./supabase.js";
import type { ActiveCourseStudent } from "./course-students.js";

/** In-app notification types for schedule and session workflows. */
export const SCHEDULE_NOTIFICATION_TYPES = [
  "schedule_published",
  "session_created",
  "session_updated",
  "session_rescheduled",
  "session_cancelled",
  "calendar_sync_failed",
] as const;

export type ScheduleNotificationType =
  (typeof SCHEDULE_NOTIFICATION_TYPES)[number];

export type ScheduleNotificationMetadata = {
  courseId: string;
  courseName: string;
  sessionId?: string | null;
  sessionTitle?: string | null;
  scheduleRuleId?: string | null;
  enrollmentId?: string | null;
  [key: string]: unknown;
};

export type StudentNotificationPayload = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  timestamp: string;
  course: { id: string; name: string } | null;
  session: { id: string; title: string } | null;
  metadata: Record<string, unknown>;
};

/** Keys safe to expose to students in notification metadata. */
const STUDENT_SAFE_METADATA_KEYS = new Set([
  "courseId",
  "courseName",
  "sessionId",
  "sessionTitle",
  "scheduleRuleId",
  "enrollmentId",
  "sessionCount",
  "calendarInviteSummary",
  "joinedLate",
  "catchup",
  "previousStartsAt",
  "previousEndsAt",
  "newStartsAt",
  "newEndsAt",
  "rescheduleMode",
  "cancellationReason",
  "replacementPlanned",
  "calendarSyncStatus",
]);

export function isScheduleNotificationType(
  type: string
): type is ScheduleNotificationType {
  return (SCHEDULE_NOTIFICATION_TYPES as readonly string[]).includes(type);
}

export function buildScheduleNotificationMetadata(opts: {
  courseId: string;
  courseName: string;
  sessionId?: string | null;
  sessionTitle?: string | null;
  scheduleRuleId?: string | null;
  enrollmentId?: string | null;
  extra?: Record<string, unknown>;
}): ScheduleNotificationMetadata {
  return {
    courseId: opts.courseId,
    courseName: opts.courseName,
    ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
    ...(opts.sessionTitle ? { sessionTitle: opts.sessionTitle } : {}),
    ...(opts.scheduleRuleId ? { scheduleRuleId: opts.scheduleRuleId } : {}),
    ...(opts.enrollmentId ? { enrollmentId: opts.enrollmentId } : {}),
    ...(opts.extra ?? {}),
  };
}

/** Strip operational / sensitive fields before returning metadata to students. */
export function sanitizeNotificationMetadataForStudent(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const src = metadata ?? {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    if (STUDENT_SAFE_METADATA_KEYS.has(key)) {
      out[key] = value;
    }
  }
  return out;
}

export async function createNotification(opts: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = getSupabaseAdmin();
  await admin.from("notifications").insert({
    user_id: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? "",
    metadata: opts.metadata ?? {},
  });
}

/** Create a schedule/session notification with standard course + session metadata. */
export async function createScheduleNotification(opts: {
  userId: string;
  type: ScheduleNotificationType;
  title: string;
  body: string;
  metadata: ScheduleNotificationMetadata;
}) {
  await createNotification({
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    metadata: opts.metadata,
  });
}

export async function notifyStudentsCalendarSyncFailed(opts: {
  students: ActiveCourseStudent[];
  courseId: string;
  courseName: string;
  sessionId: string;
  sessionTitle: string;
  syncError?: string | null;
}) {
  if (opts.students.length === 0) return;

  // Never include raw provider/sync errors in student-facing body (may leak internals).
  const body = `${opts.courseName} · ${opts.sessionTitle} · Your calendar invite could not be updated. The class is still scheduled — see your dashboard for details.`;

  await Promise.all(
    opts.students.map((student) =>
      createScheduleNotification({
        userId: student.userId,
        type: "calendar_sync_failed",
        title: `Calendar sync issue: ${opts.sessionTitle}`,
        body,
        metadata: buildScheduleNotificationMetadata({
          courseId: opts.courseId,
          courseName: opts.courseName,
          sessionId: opts.sessionId,
          sessionTitle: opts.sessionTitle,
          enrollmentId: student.enrollmentId,
          extra: {
            calendarSyncStatus: "failed",
            // Keep raw error server-side only (admin session row / logs), not in student metadata.
          },
        }),
      })
    )
  );
}

/** Shape notifications for student dashboard / API consumers. */
export function formatStudentNotification(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}): StudentNotificationPayload {
  const meta = sanitizeNotificationMetadataForStudent(row.metadata);
  const courseId = meta.courseId != null ? String(meta.courseId) : null;
  const courseName =
    meta.courseName != null ? String(meta.courseName) : courseId;
  const sessionId = meta.sessionId != null ? String(meta.sessionId) : null;
  const sessionTitle =
    meta.sessionTitle != null ? String(meta.sessionTitle) : null;

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    read: Boolean(row.read_at),
    readAt: row.read_at,
    timestamp: row.created_at,
    course:
      courseId && courseName
        ? { id: courseId, name: courseName }
        : null,
    session:
      sessionId && sessionTitle
        ? { id: sessionId, title: sessionTitle }
        : sessionId
          ? { id: sessionId, title: "Class session" }
          : null,
    metadata: meta,
  };
}
