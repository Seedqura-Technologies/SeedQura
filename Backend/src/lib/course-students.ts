import { getSupabaseAdmin } from "./supabase.js";

/**
 * Students who should receive course schedule notifications
 * (email, calendar attendees, in-app).
 *
 * Conventions (see enrollments / profiles schema):
 * - enrollment.status = active (excludes pending_payment, rejected, refunded)
 * - enrollment.payment_status = paid (excludes pending, failed, refunded)
 * - profile has a usable email
 * - profile.status is not suspended
 */

export type ActiveCourseStudent = {
  userId: string;
  fullName: string;
  email: string;
  enrollmentId: string;
};

export const NOTIFIABLE_ENROLLMENT_STATUS = "active" as const;
export const NOTIFIABLE_PAYMENT_STATUS = "paid" as const;

export type EnrollmentProfileJoin = {
  id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
};

/** Raw enrollment row shape used by the filter (DB or fixtures). */
export type EnrollmentNotifyRow = {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  profile:
    | EnrollmentProfileJoin
    | EnrollmentProfileJoin[]
    | null;
};

function unwrapProfile(
  profile: EnrollmentNotifyRow["profile"]
): EnrollmentProfileJoin | null {
  if (!profile) return null;
  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

function hasValidEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  const trimmed = email.trim();
  return trimmed.length > 0 && trimmed.includes("@");
}

/**
 * Pure eligibility check — used by getActiveCourseStudents and unit tests.
 * Returns the student payload or null if excluded.
 */
export function toActiveCourseStudent(
  row: EnrollmentNotifyRow
): ActiveCourseStudent | null {
  if (row.status !== NOTIFIABLE_ENROLLMENT_STATUS) return null;
  if (row.payment_status !== NOTIFIABLE_PAYMENT_STATUS) return null;

  const profile = unwrapProfile(row.profile);
  if (!profile) return null;
  if (profile.status === "suspended") return null;
  if (!hasValidEmail(profile.email)) return null;

  return {
    userId: profile.id || row.user_id,
    fullName: (profile.full_name || "").trim(),
    email: profile.email.trim(),
    enrollmentId: row.id,
  };
}

/** Filter a list of enrollment+profile rows to notifiable students. */
export function selectActiveCourseStudents(
  rows: EnrollmentNotifyRow[]
): ActiveCourseStudent[] {
  const out: ActiveCourseStudent[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const student = toActiveCourseStudent(row);
    if (!student) continue;
    // One notification target per user (unique enrollment per course in schema)
    if (seen.has(student.userId)) continue;
    seen.add(student.userId);
    out.push(student);
  }
  return out;
}

/**
 * Load students for a course who should receive schedule notifications.
 */
export async function getActiveCourseStudents(
  courseId: string
): Promise<ActiveCourseStudent[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("enrollments")
    .select(
      "id, user_id, status, payment_status, profile:profiles(id, full_name, email, status)"
    )
    .eq("course_id", courseId)
    .eq("status", NOTIFIABLE_ENROLLMENT_STATUS)
    .eq("payment_status", NOTIFIABLE_PAYMENT_STATUS);
  if (error) throw error;

  return selectActiveCourseStudents((data ?? []) as EnrollmentNotifyRow[]);
}

/**
 * Load a single active enrolled student for a course (or null if not eligible).
 */
export async function getActiveCourseStudent(
  userId: string,
  courseId: string
): Promise<ActiveCourseStudent | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("enrollments")
    .select(
      "id, user_id, status, payment_status, profile:profiles(id, full_name, email, status)"
    )
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .eq("status", NOTIFIABLE_ENROLLMENT_STATUS)
    .eq("payment_status", NOTIFIABLE_PAYMENT_STATUS)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toActiveCourseStudent(data as EnrollmentNotifyRow);
}
