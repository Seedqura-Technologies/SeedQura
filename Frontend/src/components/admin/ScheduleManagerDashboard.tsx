"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type DashboardStats = {
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  calendarSyncFailures: number;
  publishedSchedules: number;
  draftSchedules: number;
};

type DashboardSession = {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  startsAt: string;
  endsAt: string;
  day: string;
  timeLabel: string;
  instructorName: string;
  meetingUrl: string | null;
  status: string;
  calendarSyncStatus: string;
  calendarSyncLabel: "Synced" | "Pending" | "Failed" | "Cancelled";
  calendarSyncError: string | null;
  studentCount: number;
  scheduleRuleId: string | null;
};

type DashboardSchedule = {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  status: string;
  instructorName: string;
  startDate: string;
  endDate: string;
  timezone: string;
  sessionCount: number;
  futureSessionCount: number;
  publishedAt: string | null;
};

type Filters = {
  courseId: string;
  instructor: string;
  status: string;
  calendarSyncStatus: string;
  startsFrom: string;
  startsTo: string;
};

const emptyFilters: Filters = {
  courseId: "",
  instructor: "",
  status: "",
  calendarSyncStatus: "",
  startsFrom: "",
  startsTo: "",
};

function syncTone(label: DashboardSession["calendarSyncLabel"]) {
  switch (label) {
    case "Synced":
      return "border-accent/40 bg-accent/10 text-accent";
    case "Failed":
      return "border-error/40 bg-error/10 text-error";
    case "Cancelled":
      return "border-white/15 bg-white/5 text-muted";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
}

function statusTone(status: string) {
  if (status === "cancelled") return "text-error";
  if (status === "completed") return "text-muted";
  return "text-accent";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function canRetrySync(s: DashboardSession) {
  if (s.status === "cancelled") return false;
  if (new Date(s.startsAt).getTime() < Date.now()) return false;
  const raw = (s.calendarSyncStatus || "").toLowerCase();
  return raw === "failed" || raw === "pending";
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.courseId) params.set("courseId", filters.courseId);
  if (filters.instructor) params.set("instructor", filters.instructor);
  if (filters.status) params.set("status", filters.status);
  if (filters.calendarSyncStatus) {
    params.set("calendarSyncStatus", filters.calendarSyncStatus);
  }
  if (filters.startsFrom) params.set("startsFrom", filters.startsFrom);
  if (filters.startsTo) params.set("startsTo", filters.startsTo);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function ScheduleManagerDashboard() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [schedules, setSchedules] = useState<DashboardSchedule[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [retryBusyId, setRetryBusyId] = useState<string | null>(null);
  const [createCourseId, setCreateCourseId] = useState("");
  const [previewRows, setPreviewRows] = useState<
    { date: string; day_name: string; label: string; starts_at?: string }[] | null
  >(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const load = useCallback(async (activeFilters: Filters) => {
    const data = await apiFetch(
      `/admin/schedule-dashboard${buildQuery(activeFilters)}`
    );
    setStats(data.stats);
    setSessions(data.sessions || []);
    setSchedules(data.schedules || []);
    setCourses(data.courses || []);
    setInstructors(data.instructors || []);
  }, []);

  useEffect(() => {
    load(filters).catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    );
  }, [filters, load]);

  const statCards = useMemo(
    () =>
      stats
        ? [
            ["Total sessions", stats.totalSessions],
            ["Upcoming", stats.upcomingSessions],
            ["Completed", stats.completedSessions],
            ["Cancelled", stats.cancelledSessions],
            ["Sync failures", stats.calendarSyncFailures],
            ["Published schedules", stats.publishedSchedules],
            ["Draft schedules", stats.draftSchedules],
          ]
        : [],
    [stats]
  );

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setFilters({ ...draftFilters });
    setError("");
    setInfo("");
  }

  function resetFilters() {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
  }

  function goToCourseSession(
    courseId: string,
    sessionId: string,
    action: "edit" | "reschedule" | "cancel"
  ) {
    router.push(
      `/admin/courses/${courseId}/sessions?sessionId=${sessionId}&action=${action}`
    );
  }

  async function retrySync(session: DashboardSession) {
    setRetryBusyId(session.id);
    setError("");
    try {
      const result = await apiFetch(
        `/admin/sessions/${session.id}/retry-calendar-sync`,
        { method: "POST" }
      );
      setInfo(
        result.calendarSyncStatus === "synced"
          ? "Calendar sync succeeded."
          : `Calendar sync status: ${result.calendarSyncStatus}`
      );
      await load(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryBusyId(null);
    }
  }

  async function publishSchedule(schedule: DashboardSchedule) {
    if (
      !confirm(
        `Publish "${schedule.title}" for ${schedule.courseName}? Students will be emailed and calendar events created.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await apiFetch(`/admin/schedules/${schedule.id}/publish`, {
        method: "POST",
      });
      const p = result.publish || {};
      setInfo(
        `Published · ${p.sessionsPublished ?? 0} session(s) · notified ${p.studentsNotified ?? 0} student(s).`
      );
      await load(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function previewSchedule(schedule: DashboardSchedule) {
    setBusy(true);
    setError("");
    try {
      const detail = await apiFetch(`/admin/schedules/${schedule.id}`);
      const rule = detail.schedule;
      const preview = await apiFetch(
        `/admin/courses/${schedule.courseId}/schedules/preview`,
        {
          method: "POST",
          body: JSON.stringify({
            title: rule.title,
            instructor: rule.instructor_name,
            meeting_url: rule.meeting_url,
            location: rule.location,
            description: rule.description,
            start_date: String(rule.start_date).slice(0, 10),
            end_date: String(rule.end_date).slice(0, 10),
            start_time: String(rule.start_time).slice(0, 5),
            end_time: String(rule.end_time).slice(0, 5),
            timezone: rule.timezone,
            days_of_week: rule.days_of_week,
          }),
        }
      );
      setPreviewTitle(`${schedule.title} · ${schedule.courseName}`);
      setPreviewRows(preview.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  function openCreateSchedule() {
    if (!createCourseId) {
      setError("Select a course to create a schedule.");
      return;
    }
    router.push(`/admin/courses/${createCourseId}/sessions?mode=recurring`);
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-text">
          {info}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(([label, value]) => (
          <div key={String(label)} className="glass-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted">
              {label}
            </p>
            <p className="mt-2 text-3xl font-medium tabular-nums text-gradient">
              {value}
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={applyFilters}
        className="glass-card grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3"
      >
        <p className="md:col-span-2 xl:col-span-3 text-sm font-medium text-text">
          Filters
        </p>
        <label className="text-sm text-muted">
          Course
          <select
            value={draftFilters.courseId}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, courseId: e.target.value }))
            }
            className="input-premium mt-1"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          Instructor
          <input
            list="dashboard-instructors"
            value={draftFilters.instructor}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, instructor: e.target.value }))
            }
            className="input-premium mt-1"
            placeholder="Search instructor"
          />
          <datalist id="dashboard-instructors">
            {instructors.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <label className="text-sm text-muted">
          Session status
          <select
            value={draftFilters.status}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, status: e.target.value }))
            }
            className="input-premium mt-1"
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="text-sm text-muted">
          Calendar sync status
          <select
            value={draftFilters.calendarSyncStatus}
            onChange={(e) =>
              setDraftFilters((f) => ({
                ...f,
                calendarSyncStatus: e.target.value,
              }))
            }
            className="input-premium mt-1"
          >
            <option value="">All sync states</option>
            <option value="synced">Synced</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="text-sm text-muted">
          From date
          <input
            type="date"
            value={draftFilters.startsFrom}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, startsFrom: e.target.value }))
            }
            className="input-premium mt-1"
          />
        </label>
        <label className="text-sm text-muted">
          To date
          <input
            type="date"
            value={draftFilters.startsTo}
            onChange={(e) =>
              setDraftFilters((f) => ({ ...f, startsTo: e.target.value }))
            }
            className="input-premium mt-1"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3 md:col-span-2 xl:col-span-3">
          <button type="submit" className="btn-admin btn-admin-primary">
            Apply filters
          </button>
          <button
            type="button"
            className="btn-admin btn-admin-secondary"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="glass-card p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-text">Recurring schedules</h2>
            <p className="text-sm text-muted">
              Create, preview, and publish course schedules
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-muted">
              Course
              <select
                value={createCourseId}
                onChange={(e) => setCreateCourseId(e.target.value)}
                className="input-premium mt-1 min-w-[12rem]"
              >
                <option value="">Select course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn-admin btn-admin-primary"
              onClick={openCreateSchedule}
            >
              Create schedule
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-muted">
                <th className="py-2 pr-4">Course</th>
                <th className="py-2 pr-4">Schedule</th>
                <th className="py-2 pr-4">Instructor</th>
                <th className="py-2 pr-4">Range</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Sessions</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-muted">
                    No schedules match the current filters.
                  </td>
                </tr>
              )}
              {schedules.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">{r.courseName}</td>
                  <td className="py-3 pr-4 font-medium text-text">{r.title}</td>
                  <td className="py-3 pr-4">{r.instructorName}</td>
                  <td className="py-3 pr-4 text-muted">
                    {r.startDate} → {r.endDate}
                  </td>
                  <td className={`py-3 pr-4 ${statusTone(r.status)}`}>
                    {r.status}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    {r.sessionCount}
                    {r.futureSessionCount > 0
                      ? ` · ${r.futureSessionCount} upcoming`
                      : ""}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className="text-accent disabled:opacity-50"
                        onClick={() => previewSchedule(r)}
                      >
                        Preview
                      </button>
                      {r.status === "draft" && r.sessionCount > 0 && (
                        <button
                          type="button"
                          disabled={busy}
                          className="text-accent disabled:opacity-50"
                          onClick={() => publishSchedule(r)}
                        >
                          Publish
                        </button>
                      )}
                      <Link
                        href={`/admin/courses/${r.courseId}/sessions?mode=recurring`}
                        className="text-muted hover:text-text"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-text">All sessions</h2>
          <p className="text-sm text-muted">
            {sessions.length} session(s) matching filters
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-muted">
                <th className="py-2 pr-3">Course</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Day</th>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Instructor</th>
                <th className="py-2 pr-3">Students</th>
                <th className="py-2 pr-3">Meeting URL</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Calendar sync</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-muted">
                    No sessions match the current filters.
                  </td>
                </tr>
              )}
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-white/5 align-top">
                  <td className="py-3 pr-3">
                    <Link
                      href={`/admin/courses/${s.courseId}/sessions`}
                      className="text-accent hover:underline"
                    >
                      {s.courseName}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">{s.title}</p>
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    {formatDate(s.startsAt)}
                  </td>
                  <td className="py-3 pr-3">{s.day}</td>
                  <td className="py-3 pr-3 whitespace-nowrap tabular-nums">
                    {s.timeLabel}
                  </td>
                  <td className="py-3 pr-3">{s.instructorName}</td>
                  <td className="py-3 pr-3 tabular-nums">{s.studentCount}</td>
                  <td className="py-3 pr-3 max-w-[10rem] truncate">
                    {s.meetingUrl ? (
                      <a
                        href={s.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent"
                        title={s.meetingUrl}
                      >
                        Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={`py-3 pr-3 ${statusTone(s.status)}`}>
                    {s.status}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${syncTone(s.calendarSyncLabel)}`}
                    >
                      {s.calendarSyncLabel}
                    </span>
                    {s.calendarSyncError && (
                      <p
                        className="mt-1 max-w-[12rem] text-xs text-error"
                        title={s.calendarSyncError}
                      >
                        {s.calendarSyncError}
                      </p>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                      <button
                        type="button"
                        className="text-accent"
                        onClick={() => goToCourseSession(s.courseId, s.id, "edit")}
                      >
                        Edit
                      </button>
                      {s.status === "scheduled" &&
                        new Date(s.startsAt).getTime() >= Date.now() && (
                          <>
                            <button
                              type="button"
                              className="text-accent"
                              onClick={() =>
                                goToCourseSession(s.courseId, s.id, "reschedule")
                              }
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              className="text-accent"
                              onClick={() =>
                                goToCourseSession(s.courseId, s.id, "cancel")
                              }
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      {canRetrySync(s) && (
                        <button
                          type="button"
                          disabled={retryBusyId === s.id}
                          className="text-accent disabled:opacity-50"
                          onClick={() => retrySync(s)}
                        >
                          {retryBusyId === s.id ? "Retrying…" : "Retry sync"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewRows && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={() => setPreviewRows(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="glass-card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-text">Schedule preview</h3>
            <p className="mt-1 text-sm text-muted">{previewTitle}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {previewRows.map((row) => (
                <li key={row.starts_at || `${row.date}-${row.label}`} className="panel-row">
                  <span className="text-text">{row.day_name || row.date}</span>
                  <span className="text-muted">{row.label}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-admin btn-admin-secondary mt-6"
              onClick={() => setPreviewRows(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
