export type EnrollmentExportRow = {
  enrollment_id: string;
  student_name: string;
  email: string;
  phone: string;
  institution: string;
  degree: string;
  year_of_study: string;
  course_id: string;
  course_name: string;
  enrollment_status: string;
  payment_status: string;
  utr: string;
  enrolled_at: string;
  utr_submitted_at: string;
  progress_pct: number | string;
};

export type EnrollmentExportSource = {
  id: string;
  status: string;
  payment_status: string;
  progress_pct?: number | null;
  created_at?: string | null;
  utr?: string | null;
  institution?: string | null;
  degree?: string | null;
  year_of_study?: string | null;
  applicant_phone?: string | null;
  applicant_name?: string | null;
  utr_submitted_at?: string | null;
  course_id?: string | null;
  course?:
    | { id?: string | null; name?: string | null }
    | { id?: string | null; name?: string | null }[]
    | null;
  profile?:
    | { full_name?: string | null; email?: string | null }
    | { full_name?: string | null; email?: string | null }[]
    | null;
};

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const ENROLLMENT_EXPORT_HEADERS = [
  "enrollment_id",
  "student_name",
  "email",
  "phone",
  "institution",
  "degree",
  "year_of_study",
  "course_id",
  "course_name",
  "enrollment_status",
  "payment_status",
  "utr",
  "enrolled_at",
  "utr_submitted_at",
  "progress_pct",
] as const;

export function toEnrollmentExportRow(
  row: EnrollmentExportSource
): EnrollmentExportRow {
  const course = unwrap(row.course);
  const profile = unwrap(row.profile);
  return {
    enrollment_id: row.id,
    student_name: (row.applicant_name || profile?.full_name || "").trim(),
    email: (profile?.email || "").trim(),
    phone: (row.applicant_phone || "").trim(),
    institution: (row.institution || "").trim(),
    degree: (row.degree || "").trim(),
    year_of_study: (row.year_of_study || "").trim(),
    course_id: (course?.id || row.course_id || "").trim(),
    course_name: (course?.name || "").trim(),
    enrollment_status: row.status,
    payment_status: row.payment_status,
    utr: (row.utr || "").trim(),
    enrolled_at: row.created_at || "",
    utr_submitted_at: row.utr_submitted_at || "",
    progress_pct: row.progress_pct ?? 0,
  };
}

export function enrollmentsToCsv(rows: EnrollmentExportSource[]): string {
  const mapped = rows.map(toEnrollmentExportRow);
  const lines = [
    ENROLLMENT_EXPORT_HEADERS.join(","),
    ...mapped.map((r) =>
      ENROLLMENT_EXPORT_HEADERS.map((h) => csvEscape(r[h])).join(",")
    ),
  ];
  return `${lines.join("\n")}\n`;
}

export function filterEnrollmentsByDateRange<
  T extends { created_at?: string | null; utr_submitted_at?: string | null },
>(
  rows: T[],
  opts: {
    dateFrom?: string | null;
    dateTo?: string | null;
    /** Which timestamp to filter on */
    dateField?: "created_at" | "utr_submitted_at";
  }
): T[] {
  const field = opts.dateField || "created_at";
  const fromMs = opts.dateFrom ? Date.parse(`${opts.dateFrom}T00:00:00.000Z`) : null;
  const toMs = opts.dateTo ? Date.parse(`${opts.dateTo}T23:59:59.999Z`) : null;
  if (fromMs == null && toMs == null) return rows;

  return rows.filter((row) => {
    const raw = row[field] || row.created_at;
    if (!raw) return false;
    const t = Date.parse(raw);
    if (Number.isNaN(t)) return false;
    if (fromMs != null && t < fromMs) return false;
    if (toMs != null && t > toMs) return false;
    return true;
  });
}

export function exportFilename(parts: {
  courseId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  scheduleFrom?: string | null;
  scheduleTo?: string | null;
}): string {
  const bits = ["seedqura-enrollments"];
  if (parts.courseId) bits.push(parts.courseId);
  if (parts.dateFrom || parts.dateTo) {
    bits.push(`enrolled-${parts.dateFrom || "start"}-to-${parts.dateTo || "end"}`);
  }
  if (parts.scheduleFrom || parts.scheduleTo) {
    bits.push(
      `schedule-${parts.scheduleFrom || "start"}-to-${parts.scheduleTo || "end"}`
    );
  }
  bits.push(new Date().toISOString().slice(0, 10));
  return `${bits.join("_")}.csv`;
}
