"use client";

import { useEffect, useMemo, useState } from "react";
import { apiDownload, apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

type Course = {
  id: string;
  name: string;
  status?: string;
};

type PreviewRow = {
  student_name: string;
  email: string;
  phone: string;
  institution: string;
  course_name: string;
  enrollment_status: string;
  payment_status: string;
  enrolled_at: string;
};

type Preview = {
  count: number;
  filename: string;
  rows: PreviewRow[];
};

export default function AdminExportPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [status, setStatus] = useState("active");
  const [dateField, setDateField] = useState<"created_at" | "utr_submitted_at">(
    "created_at"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [scheduleFrom, setScheduleFrom] = useState("");
  const [scheduleTo, setScheduleTo] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"preview" | "csv" | null>(null);

  useEffect(() => {
    apiFetch("/admin/courses")
      .then((data) => setCourses(data.courses || []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load courses")
      );
  }, []);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    if (courseId) q.set("course_id", courseId);
    if (paymentStatus) q.set("payment_status", paymentStatus);
    if (status) q.set("status", status);
    if (dateFrom) q.set("date_from", dateFrom);
    if (dateTo) q.set("date_to", dateTo);
    q.set("date_field", dateField);
    if (scheduleFrom) q.set("schedule_from", scheduleFrom);
    if (scheduleTo) q.set("schedule_to", scheduleTo);
    return q.toString();
  }, [
    courseId,
    paymentStatus,
    status,
    dateFrom,
    dateTo,
    dateField,
    scheduleFrom,
    scheduleTo,
  ]);

  async function runPreview() {
    setBusy("preview");
    setError("");
    try {
      const data = await apiFetch(`/admin/enrollments/export?${queryString}&format=json`);
      setPreview({
        count: data.count ?? 0,
        filename: data.filename || "export.csv",
        rows: data.rows || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
      setPreview(null);
    } finally {
      setBusy(null);
    }
  }

  async function downloadCsv() {
    setBusy("csv");
    setError("");
    try {
      const { blob, filename } = await apiDownload(
        `/admin/enrollments/export?${queryString}&format=csv`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell title="Export students">
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Filter enrolled students by course, enrollment dates, or courses that
        have sessions in a schedule window — then download a CSV for ops /
        attendance lists.
      </p>

      <div className="glass-card mb-8 grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          <span className="text-muted">Course</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="input-premium mt-1.5"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-muted">Payment status</span>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="input-premium mt-1.5"
          >
            <option value="paid">Paid</option>
            <option value="awaiting_verification">Awaiting verification</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="all">All</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-muted">Enrollment status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-premium mt-1.5"
          >
            <option value="active">Active</option>
            <option value="pending_payment">Pending payment</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
            <option value="all">All</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-muted">Date field</span>
          <select
            value={dateField}
            onChange={(e) =>
              setDateField(e.target.value as "created_at" | "utr_submitted_at")
            }
            className="input-premium mt-1.5"
          >
            <option value="created_at">Enrolled at</option>
            <option value="utr_submitted_at">UTR submitted at</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-muted">Enrollment from</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-premium mt-1.5"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted">Enrollment to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-premium mt-1.5"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted">Schedule from (sessions)</span>
          <input
            type="date"
            value={scheduleFrom}
            onChange={(e) => setScheduleFrom(e.target.value)}
            className="input-premium mt-1.5"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted">Schedule to (sessions)</span>
          <input
            type="date"
            value={scheduleTo}
            onChange={(e) => setScheduleTo(e.target.value)}
            className="input-premium mt-1.5"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runPreview}
          disabled={busy !== null}
          className="btn-admin btn-admin-secondary"
        >
          {busy === "preview" ? "Loading…" : "Preview"}
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={busy !== null}
          className="btn-admin btn-admin-primary"
        >
          {busy === "csv" ? "Preparing…" : "Export CSV"}
        </button>
      </div>

      {error && <p className="mb-4 text-error">{error}</p>}

      {preview && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {preview.count} row{preview.count === 1 ? "" : "s"} ·{" "}
            <span className="text-text">{preview.filename}</span>
          </p>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Institution</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 50).map((r, i) => (
                  <tr key={`${r.email}-${i}`}>
                    <td className="px-4 py-3 text-text">{r.student_name || "—"}</td>
                    <td className="px-4 py-3 text-muted">{r.email || "—"}</td>
                    <td className="px-4 py-3 text-muted">{r.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted">{r.institution || "—"}</td>
                    <td className="px-4 py-3 text-text">{r.course_name || "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      {r.enrollment_status}/{r.payment_status}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {r.enrolled_at
                        ? new Date(r.enrolled_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
                {preview.rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-muted">
                      No enrollments match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {preview.rows.length > 50 && (
            <p className="text-xs text-muted">
              Showing first 50 of {preview.count}. Full list is in the CSV.
            </p>
          )}
        </div>
      )}
    </AdminShell>
  );
}
