"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScheduleCalendar } from "@/components/admin/ScheduleCalendar";

type Session = {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  location: string;
  status: string;
  google_event_id: string | null;
  schedule_rule_id?: string | null;
  calendar_sync_status?: string | null;
  calendar_event_status?: string | null;
  calendar_sync_error?: string | null;
  notify_sent_at?: string | null;
  calendar_invite_via?: string | null;
  schedule_rule?:
    | { id: string; status: string; timezone?: string }
    | { id: string; status: string; timezone?: string }[]
    | null;
};

type ScheduleRule = {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  timezone: string;
  session_count: number;
  future_session_count: number;
  published_at?: string | null;
  published_by?: string | null;
};

type PreviewSession = {
  date: string;
  day_name: string;
  starts_at: string;
  ends_at: string;
  label: string;
};

type Mode = "one-time" | "recurring";

const WEEKDAYS: { name: string; label: string }[] = [
  { name: "Monday", label: "Mon" },
  { name: "Tuesday", label: "Tue" },
  { name: "Wednesday", label: "Wed" },
  { name: "Thursday", label: "Thu" },
  { name: "Friday", label: "Fri" },
  { name: "Saturday", label: "Sat" },
  { name: "Sunday", label: "Sun" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "UTC",
];

const emptyOneTime = {
  title: "",
  description: "",
  instructor_name: "",
  starts_at: "",
  ends_at: "",
  meeting_url: "",
  location: "",
};

const emptyRecurring = {
  title: "",
  instructor: "",
  meeting_url: "",
  location: "",
  description: "",
  start_date: "",
  end_date: "",
  start_time: "10:00",
  end_time: "13:00",
  timezone: "Asia/Kolkata",
  days: [] as string[],
};

function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string) {
  return new Date(local).toISOString();
}

function unwrapScheduleRule(session: Session) {
  const r = session.schedule_rule;
  if (!r) return null;
  return Array.isArray(r) ? r[0] ?? null : r;
}

function isSessionHistorical(s: Session) {
  if (s.status === "completed" || s.status === "cancelled") return true;
  return new Date(s.ends_at).getTime() < Date.now();
}

function isSessionPublished(s: Session) {
  const rule = unwrapScheduleRule(s);
  if (rule?.status === "published") return true;
  if (s.notify_sent_at) return true;
  if (s.google_event_id) return true;
  if (s.calendar_invite_via && s.calendar_invite_via !== "none") return true;
  return false;
}

function isFutureScheduled(s: Session) {
  return (
    s.status === "scheduled" && new Date(s.starts_at).getTime() >= Date.now()
  );
}

function describeSessionChanges(before: Session, body: Record<string, unknown>) {
  const labels: Record<string, string> = {
    title: "Title",
    starts_at: "Start date/time",
    ends_at: "End date/time",
    instructor_name: "Instructor",
    meeting_url: "Meeting URL",
    location: "Location",
    description: "Description",
  };
  const changes: string[] = [];
  for (const [key, label] of Object.entries(labels)) {
    if (body[key] === undefined) continue;
    const prev =
      key === "meeting_url"
        ? before.meeting_url || ""
        : String((before as Record<string, unknown>)[key] ?? "");
    const next = key === "meeting_url" ? String(body[key] ?? "") : String(body[key]);
    if (prev !== next) changes.push(label);
  }
  return changes;
}

function formatSessionWhenLabel(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return {
    date: start.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: `${start.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })} – ${end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`,
  };
}

function formatLocalTime(iso: string, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleTimeString();
  }
}

export default function AdminCourseSessionsPage() {
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const courseId = params.courseId;
  const tabsId = useId();

  const [courseName, setCourseName] = useState(courseId);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRule[]>([]);
  const [mode, setMode] = useState<Mode>("one-time");

  const [form, setForm] = useState(emptyOneTime);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [confirmPublishedEdit, setConfirmPublishedEdit] = useState<{
    body: Record<string, unknown>;
    changes: string[];
  } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Session | null>(null);
  const [cancelForm, setCancelForm] = useState({
    reason: "",
    replacementPlanned: "unknown" as "yes" | "no" | "unknown",
  });
  const [rescheduleTarget, setRescheduleTarget] = useState<Session | null>(null);
  const [rescheduleStep, setRescheduleStep] = useState<"form" | "confirm">("form");
  const [rescheduleForm, setRescheduleForm] = useState({
    starts_at: "",
    ends_at: "",
    mode: "in_place" as "in_place" | "replacement_created",
    note: "",
  });

  const [recurring, setRecurring] = useState(emptyRecurring);
  const [preview, setPreview] = useState<{
    total_sessions: number;
    timezone: string;
    sessions: PreviewSession[];
  } | null>(null);
  const [previewDirty, setPreviewDirty] = useState(true);
  const [pendingPublishId, setPendingPublishId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [retryCalendarBusyId, setRetryCalendarBusyId] = useState<string | null>(
    null
  );

  async function retryCalendarSync(s: Session) {
    clearAlerts();
    setRetryCalendarBusyId(s.id);
    try {
      const result = await apiFetch(
        `/admin/sessions/${s.id}/retry-calendar-sync`,
        { method: "POST" }
      );
      const parts = ["Calendar sync retried"];
      if (result.calendarSyncStatus === "synced") {
        parts.push("synced successfully");
      } else {
        parts.push(`status: ${result.calendarSyncStatus}`);
      }
      if (result.recreated) {
        parts.push("Google event recreated");
      }
      if (result.attendeeCount) {
        parts.push(`${result.attendeeCount} attendee(s)`);
      }
      setInfo(`${parts.join(" · ")}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calendar retry failed");
    } finally {
      setRetryCalendarBusyId(null);
    }
  }

  async function load() {
    const [coursesData, sessionsData, schedulesData] = await Promise.all([
      apiFetch("/admin/courses"),
      apiFetch(`/admin/courses/${courseId}/sessions`),
      apiFetch(`/admin/courses/${courseId}/schedules`).catch(() => ({
        schedules: [],
      })),
    ]);
    const course = (coursesData.courses || []).find(
      (c: { id: string }) => c.id === courseId
    );
    if (course) setCourseName(course.name);
    setSessions(sessionsData.sessions || []);
    setSchedules(schedulesData.schedules || []);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "recurring") {
      setMode("recurring");
    }
  }, [searchParams]);

  useEffect(() => {
    if (sessions.length === 0) return;
    const sessionId = searchParams.get("sessionId");
    const action = searchParams.get("action");
    if (!sessionId || !action) return;
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;
    if (action === "edit") edit(target);
    else if (action === "reschedule") openReschedule(target);
    else if (action === "cancel") openCancelSession(sessionId);
  }, [sessions, searchParams]);

  function clearAlerts() {
    setError("");
    setInfo("");
  }

  function markRecurringChanged<K extends keyof typeof emptyRecurring>(
    key: K,
    value: (typeof emptyRecurring)[K]
  ) {
    setRecurring((prev) => ({ ...prev, [key]: value }));
    setPreview(null);
    setPreviewDirty(true);
  }

  function toggleDay(day: string) {
    setRecurring((prev) => {
      const has = prev.days.includes(day);
      const days = has
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
    setPreview(null);
    setPreviewDirty(true);
  }

  async function saveOneTimeSession(
    body: Record<string, unknown>,
    confirm = false
  ) {
    let result;
    if (editing) {
      result = await apiFetch(`/admin/sessions/${editing}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...body,
          ...(confirm ? { confirmPublishedEdit: true } : {}),
        }),
      });
    } else {
      result = await apiFetch(`/admin/courses/${courseId}/sessions`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    }

    const notified = result.notified ?? 0;
    const parts = ["Saved"];
    if (result.studentsNotified) {
      parts.push(`notified ${notified} student(s)`);
    } else if (result.preservedHistorical) {
      parts.push("historical record preserved (description-only)");
    } else if (editing) {
      parts.push("no student notification required");
    } else {
      parts.push(`notified ${notified} student(s)`);
    }
    if (result.googleEventId) {
      parts.push("Google Calendar updated (same event)");
    } else if (result.calendarSynced) {
      parts.push("calendar sync attempted");
    }
    setInfo(`${parts.join(" · ")}.`);

    setForm(emptyOneTime);
    setEditing(null);
    setEditingSession(null);
    setConfirmPublishedEdit(null);
    await load();
  }

  async function onOneTimeSubmit(e: FormEvent) {
    e.preventDefault();
    clearAlerts();
    setBusy(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        instructor_name: form.instructor_name,
        starts_at: editing
          ? editingSession!.starts_at
          : fromLocalInput(form.starts_at),
        ends_at: editing
          ? editingSession!.ends_at
          : fromLocalInput(form.ends_at),
        meeting_url: form.meeting_url || null,
        location: form.location,
      };

      if (
        editing &&
        editingSession &&
        isSessionPublished(editingSession) &&
        isFutureScheduled(editingSession) &&
        !isSessionHistorical(editingSession)
      ) {
        const changes = describeSessionChanges(editingSession, body);
        if (changes.length > 0) {
          setConfirmPublishedEdit({ body, changes });
          return;
        }
      }

      await saveOneTimeSession(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function edit(s: Session) {
    setMode("one-time");
    setEditing(s.id);
    setEditingSession(s);
    setForm({
      title: s.title,
      description: s.description || "",
      instructor_name: s.instructor_name || "",
      starts_at: toLocalInput(s.starts_at),
      ends_at: toLocalInput(s.ends_at),
      meeting_url: s.meeting_url || "",
      location: s.location || "",
    });
    clearAlerts();
  }

  const editingHistorical =
    editingSession != null && isSessionHistorical(editingSession);

  function openCancelSession(id: string) {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;
    clearAlerts();
    setCancelForm({ reason: "", replacementPlanned: "unknown" });
    setCancelTarget(target);
  }

  function openReschedule(s: Session) {
    clearAlerts();
    setRescheduleStep("form");
    setRescheduleForm({
      starts_at: toLocalInput(s.starts_at),
      ends_at: toLocalInput(s.ends_at),
      mode: "in_place",
      note: "",
    });
    setRescheduleTarget(s);
  }

  function reviewReschedule() {
    if (!rescheduleTarget) return;
    if (!rescheduleForm.starts_at || !rescheduleForm.ends_at) {
      setError("New start and end times are required");
      return;
    }
    const startMs = new Date(fromLocalInput(rescheduleForm.starts_at)).getTime();
    const endMs = new Date(fromLocalInput(rescheduleForm.ends_at)).getTime();
    if (endMs <= startMs) {
      setError("End time must be after start time");
      return;
    }
    const unchanged =
      rescheduleForm.starts_at === toLocalInput(rescheduleTarget.starts_at) &&
      rescheduleForm.ends_at === toLocalInput(rescheduleTarget.ends_at);
    if (unchanged) {
      setError("Choose a different date or time to reschedule");
      return;
    }
    clearAlerts();
    setRescheduleStep("confirm");
  }

  async function confirmRescheduleSession() {
    if (!rescheduleTarget) return;
    clearAlerts();
    setBusy(true);
    try {
      const published =
        isSessionPublished(rescheduleTarget) &&
        isFutureScheduled(rescheduleTarget);
      const result = await apiFetch(
        `/admin/sessions/${rescheduleTarget.id}/reschedule`,
        {
          method: "POST",
          body: JSON.stringify({
            starts_at: fromLocalInput(rescheduleForm.starts_at),
            ends_at: fromLocalInput(rescheduleForm.ends_at),
            mode: rescheduleForm.mode,
            note: rescheduleForm.note.trim() || null,
            confirmReschedule: published,
          }),
        }
      );
      const parts = ["Session rescheduled"];
      if (result.mode === "replacement_created") {
        parts.push("replacement session created");
      } else {
        parts.push("same session updated");
      }
      if (result.studentsNotified) {
        parts.push(`notified ${result.notified ?? 0} student(s)`);
      }
      if (result.googleEventId) {
        parts.push("Google Calendar updated");
      }
      if (result.auditId) {
        parts.push("change recorded");
      }
      setInfo(`${parts.join(" · ")}.`);
      setRescheduleTarget(null);
      setRescheduleStep("form");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCancelSession() {
    if (!cancelTarget) return;
    clearAlerts();
    setBusy(true);
    try {
      const published =
        isSessionPublished(cancelTarget) && isFutureScheduled(cancelTarget);
      const result = await apiFetch(
        `/admin/sessions/${cancelTarget.id}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({
            cancellationReason: cancelForm.reason.trim() || null,
            replacementPlanned: cancelForm.replacementPlanned,
            confirmPublishedCancel: published,
          }),
        }
      );
      const parts = ["Session cancelled"];
      if (result.studentsNotified) {
        parts.push(`notified ${result.notified ?? 0} student(s)`);
      }
      if (result.calendarSyncStatus === "cancelled") {
        parts.push("calendar event cancelled");
      }
      parts.push("course schedule unchanged");
      setInfo(`${parts.join(" · ")}.`);
      setCancelTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeSession(id: string) {
    if (
      !confirm(
        "Permanently delete this draft session? Published or cancelled sessions must be kept as records."
      )
    ) {
      return;
    }
    clearAlerts();
    try {
      await apiFetch(`/admin/sessions/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function validateRecurringClient(): string | null {
    if (!recurring.title.trim()) return "Session title is required.";
    if (!recurring.start_date) return "Start date is required.";
    if (!recurring.end_date) return "End date is required.";
    if (recurring.end_date < recurring.start_date) {
      return "End date must be on or after start date.";
    }
    if (!recurring.start_time || !recurring.end_time) {
      return "Start and end times are required.";
    }
    if (recurring.end_time <= recurring.start_time) {
      return "End time must be after start time.";
    }
    if (recurring.days.length === 0) {
      return "Select at least one day of the week.";
    }
    if (!recurring.timezone.trim()) return "Timezone is required.";
    if (
      recurring.meeting_url.trim() &&
      !/^https?:\/\//i.test(recurring.meeting_url.trim())
    ) {
      return "Meeting URL must start with http:// or https://.";
    }
    return null;
  }

  async function onPreview() {
    clearAlerts();
    const clientError = validateRecurringClient();
    if (clientError) {
      setError(clientError);
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch(
        `/admin/courses/${courseId}/schedules/preview`,
        {
          method: "POST",
          body: JSON.stringify({
            start_date: recurring.start_date,
            end_date: recurring.end_date,
            days_of_week: recurring.days,
            start_time: recurring.start_time,
            end_time: recurring.end_time,
            timezone: recurring.timezone,
          }),
        }
      );
      setPreview({
        total_sessions: data.total_sessions,
        timezone: data.timezone,
        sessions: data.sessions || [],
      });
      setPreviewDirty(false);
      if ((data.total_sessions ?? 0) === 0) {
        setInfo(
          "Preview ready — no matching dates in this range. Adjust days or dates."
        );
      } else {
        setInfo(
          `Preview ready — ${data.total_sessions} session(s). Review the list, then click Generate Schedule.`
        );
      }
    } catch (err) {
      setPreview(null);
      setPreviewDirty(true);
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGenerate() {
    clearAlerts();
    const clientError = validateRecurringClient();
    if (clientError) {
      setError(clientError);
      return;
    }
    if (!preview || previewDirty) {
      setError("Preview the schedule first, then generate.");
      return;
    }
    if (preview.total_sessions === 0) {
      setError("Nothing to generate — preview has zero sessions.");
      return;
    }
    if (
      !confirm(
        `Generate ${preview.total_sessions} draft session(s) for ${courseName}? Students will NOT be emailed until you publish.`
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      const result = await apiFetch(`/admin/courses/${courseId}/schedules`, {
        method: "POST",
        body: JSON.stringify({
          title: recurring.title.trim(),
          instructor: recurring.instructor.trim(),
          meeting_url: recurring.meeting_url.trim() || null,
          location: recurring.location.trim(),
          description: recurring.description.trim(),
          start_date: recurring.start_date,
          end_date: recurring.end_date,
          days_of_week: recurring.days,
          start_time: recurring.start_time,
          end_time: recurring.end_time,
          timezone: recurring.timezone,
          generate: true,
        }),
      });
      const created = result.generated?.createdCount ?? 0;
      const skipped = result.generated?.skippedCount ?? 0;
      const scheduleId = result.schedule?.id as string | undefined;
      setPendingPublishId(scheduleId || null);
      setInfo(
        `Draft schedule ready with ${created} session(s)${
          skipped ? ` · ${skipped} skipped` : ""
        }. Review below, then click Publish Schedule to notify students.`
      );
      setRecurring(emptyRecurring);
      setPreview(null);
      setPreviewDirty(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }

  async function onPublish(scheduleId: string) {
    clearAlerts();
    if (
      !confirm(
        "Publish this schedule? This will create calendar events (when configured) and email enrolled students. Already-notified sessions will be skipped."
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const result = await apiFetch(`/admin/schedules/${scheduleId}/publish`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const p = result.publish || {};
      setInfo(
        `Published. Calendar: ${p.calendarCreated ?? 0} created, ${p.calendarUpdated ?? 0} updated · Invites: ${p.calendarGoogleInvites ?? 0} Google / ${p.calendarIcsInvites ?? 0} ICS (${p.icsEmailsSent ?? 0} .ics emails) · Schedule emails: ${p.emailsSent ?? 0}.`
      );
      setPendingPublishId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancelSchedule(id: string) {
    if (
      !confirm(
        "Cancel this recurring schedule? Future scheduled sessions will be cancelled; past sessions are kept."
      )
    ) {
      return;
    }
    clearAlerts();
    try {
      await apiFetch(`/admin/schedules/${id}`, { method: "DELETE" });
      setInfo("Recurring schedule cancelled.");
      if (pendingPublishId === id) setPendingPublishId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel schedule");
    }
  }

  return (
    <AdminShell title={`Schedule · ${courseName}`}>
      <p className="mb-6 text-sm text-muted">
        <Link href="/admin/schedules" className="text-accent">
          ← Schedule Manager
        </Link>
        {" · "}
        <Link href="/admin/courses" className="text-accent">
          Courses
        </Link>
        {" · "}
        Create one-time sessions or a recurring schedule. Recurring flow:{" "}
        <span className="text-text">
          Draft → Preview → Generate → Review → Publish
        </span>
        . Students are emailed only when you publish.
      </p>

      {error && (
        <p className="mb-4 text-error" role="alert">
          {error}
        </p>
      )}
      {info && (
        <p
          className="mb-4 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent"
          role="status"
        >
          {info}
        </p>
      )}

      {/* Mode switch */}
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Schedule type"
      >
        {(
          [
            ["one-time", "One-time session"],
            ["recurring", "Recurring schedule"],
          ] as const
        ).map(([value, label]) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              id={`${tabsId}-${value}`}
              aria-selected={active}
              className={`btn-admin ${
                active ? "btn-admin-primary" : "btn-admin-secondary"
              }`}
              onClick={() => {
                setMode(value);
                clearAlerts();
                if (value === "recurring") setEditing(null);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* One-time */}
      {mode === "one-time" && (
        <form
          onSubmit={onOneTimeSubmit}
          className="glass-card mb-10 grid gap-3 p-6 md:grid-cols-2"
          aria-labelledby={`${tabsId}-one-time`}
        >
          <div className="md:col-span-2">
            <p className="eyebrow-pill mb-3 inline-flex">One-time</p>
            <h2 className="text-lg font-medium text-text">
              {editing ? "Edit session" : "Add one-time session"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {editing
                ? editingHistorical
                  ? "Past or completed session — only the description can be edited to preserve historical records."
                  : "Updates to published future sessions notify students and patch the existing calendar event."
                : "Creates a single class and notifies enrolled students."}
            </p>
          </div>
          {editing && !editingHistorical && (
            <p className="md:col-span-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-text">
              Date and time changes use the <strong>Reschedule</strong> action on
              the calendar below. This form updates title, instructor, meeting
              link, location, and description only.
            </p>
          )}
          {editingHistorical && (
            <p className="md:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
              This session is in the past or completed. Date, time, instructor,
              meeting URL, and location are locked.
            </p>
          )}
          <label className="text-sm text-muted">
            Session title
            <input
              required
              disabled={editingHistorical}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-premium mt-1 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-muted">
            Instructor
            <input
              disabled={editingHistorical}
              value={form.instructor_name}
              onChange={(e) =>
                setForm({ ...form, instructor_name: e.target.value })
              }
              className="input-premium mt-1 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-muted">
            Starts
            <input
              required
              disabled={editingHistorical || !!editing}
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              className="input-premium mt-1 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-muted">
            Ends
            <input
              required
              disabled={editingHistorical || !!editing}
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              className="input-premium mt-1 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-muted">
            Meeting URL
            <input
              disabled={editingHistorical}
              type="url"
              placeholder="https://"
              value={form.meeting_url}
              onChange={(e) =>
                setForm({ ...form, meeting_url: e.target.value })
              }
              className="input-premium mt-1 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-muted">
            Location
            <input
              disabled={editingHistorical}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="input-premium mt-1 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-muted md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input-premium mt-1"
              rows={3}
            />
          </label>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="btn-admin btn-admin-primary disabled:opacity-60"
            >
              {editing
                ? editingHistorical
                  ? "Save description"
                  : "Update session"
                : "Create & notify"}
            </button>
            {editing && (
              <button
                type="button"
                className="btn-admin btn-admin-secondary"
                onClick={() => {
                  setEditing(null);
                  setEditingSession(null);
                  setForm(emptyOneTime);
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      )}

      {confirmPublishedEdit && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={() => setConfirmPublishedEdit(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-published-edit-title"
            className="glass-card w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow-pill mb-2 inline-flex">Confirm update</p>
            <h3
              id="confirm-published-edit-title"
              className="text-lg font-medium text-text"
            >
              Update published session?
            </h3>
            <p className="mt-2 text-sm text-muted">
              This session was already shared with enrolled students. Saving will:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-text">
              <li>Update the existing Google Calendar event (same event ID)</li>
              <li>Email enrolled students about the change</li>
              <li>Create an in-app notification for each student</li>
            </ul>
            <p className="mt-3 text-sm text-muted">Fields changing:</p>
            <ul className="mt-1 list-inside list-disc text-sm text-accent">
              {confirmPublishedEdit.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                className="btn-admin btn-admin-primary disabled:opacity-60"
                onClick={async () => {
                  setBusy(true);
                  clearAlerts();
                  try {
                    await saveOneTimeSession(confirmPublishedEdit.body, true);
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : "Update failed"
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirm & notify students
              </button>
              <button
                type="button"
                className="btn-admin btn-admin-secondary"
                onClick={() => setConfirmPublishedEdit(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={() => setCancelTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-cancel-session-title"
            className="glass-card w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow-pill mb-2 inline-flex">Cancel class</p>
            <h3
              id="confirm-cancel-session-title"
              className="text-lg font-medium text-text"
            >
              Cancel {cancelTarget.title}?
            </h3>
            <p className="mt-2 text-sm text-muted">
              This cancels <strong>only this session</strong>. The course
              schedule and other upcoming classes are not affected. The session
              record is kept for history.
            </p>
            {isSessionPublished(cancelTarget) && isFutureScheduled(cancelTarget) && (
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-text">
                <li>Google Calendar event will be cancelled</li>
                <li>Enrolled students will receive a cancellation email</li>
                <li>In-app notifications will be created</li>
              </ul>
            )}
            <label className="mt-4 block text-sm text-muted">
              Reason (optional)
              <textarea
                value={cancelForm.reason}
                onChange={(e) =>
                  setCancelForm((f) => ({ ...f, reason: e.target.value }))
                }
                className="input-premium mt-1"
                rows={3}
                placeholder="e.g. Instructor unavailable"
              />
            </label>
            <fieldset className="mt-4">
              <legend className="text-sm text-muted">
                Will a replacement class be scheduled?
              </legend>
              <div className="mt-2 space-y-2 text-sm">
                {(
                  [
                    ["yes", "Yes — replacement planned"],
                    ["no", "No replacement"],
                    ["unknown", "To be confirmed"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="replacementPlanned"
                      checked={cancelForm.replacementPlanned === value}
                      onChange={() =>
                        setCancelForm((f) => ({
                          ...f,
                          replacementPlanned: value,
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                className="btn-admin btn-admin-primary disabled:opacity-60"
                onClick={confirmCancelSession}
              >
                Confirm cancellation
              </button>
              <button
                type="button"
                className="btn-admin btn-admin-secondary"
                onClick={() => setCancelTarget(null)}
              >
                Keep session
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={() => {
            setRescheduleTarget(null);
            setRescheduleStep("form");
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reschedule-session-title"
            className="glass-card w-full max-w-lg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow-pill mb-2 inline-flex">Reschedule class</p>
            <h3
              id="reschedule-session-title"
              className="text-lg font-medium text-text"
            >
              {rescheduleStep === "form"
                ? `Reschedule ${rescheduleTarget.title}`
                : "Confirm reschedule"}
            </h3>

            {rescheduleStep === "form" ? (
              <>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted">
                    Original session
                  </p>
                  {(() => {
                    const when = formatSessionWhenLabel(
                      rescheduleTarget.starts_at,
                      rescheduleTarget.ends_at
                    );
                    return (
                      <>
                        <p className="mt-2 font-medium text-text">{when.date}</p>
                        <p className="text-muted">{when.time}</p>
                      </>
                    );
                  })()}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-muted">
                    New start
                    <input
                      required
                      type="datetime-local"
                      value={rescheduleForm.starts_at}
                      onChange={(e) =>
                        setRescheduleForm((f) => ({
                          ...f,
                          starts_at: e.target.value,
                        }))
                      }
                      className="input-premium mt-1"
                    />
                  </label>
                  <label className="text-sm text-muted">
                    New end
                    <input
                      required
                      type="datetime-local"
                      value={rescheduleForm.ends_at}
                      onChange={(e) =>
                        setRescheduleForm((f) => ({
                          ...f,
                          ends_at: e.target.value,
                        }))
                      }
                      className="input-premium mt-1"
                    />
                  </label>
                </div>

                <fieldset className="mt-4">
                  <legend className="text-sm text-muted">How to apply</legend>
                  <div className="mt-2 space-y-2 text-sm">
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="rescheduleMode"
                        checked={rescheduleForm.mode === "in_place"}
                        onChange={() =>
                          setRescheduleForm((f) => ({ ...f, mode: "in_place" }))
                        }
                        className="mt-1"
                      />
                      <span>
                        <strong className="text-text">Update same session</strong>
                        <span className="block text-muted">
                          Keeps this session record and updates the existing
                          Google Calendar event.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="rescheduleMode"
                        checked={rescheduleForm.mode === "replacement_created"}
                        onChange={() =>
                          setRescheduleForm((f) => ({
                            ...f,
                            mode: "replacement_created",
                          }))
                        }
                        className="mt-1"
                      />
                      <span>
                        <strong className="text-text">
                          Create replacement session
                        </strong>
                        <span className="block text-muted">
                          Cancels the original session and creates a new one with
                          a fresh calendar invite.
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <label className="mt-4 block text-sm text-muted">
                  Note for students (optional)
                  <textarea
                    value={rescheduleForm.note}
                    onChange={(e) =>
                      setRescheduleForm((f) => ({ ...f, note: e.target.value }))
                    }
                    className="input-premium mt-1"
                    rows={2}
                    placeholder="e.g. Moved due to instructor availability"
                  />
                </label>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    className="btn-admin btn-admin-primary disabled:opacity-60"
                    onClick={reviewReschedule}
                  >
                    Review reschedule
                  </button>
                  <button
                    type="button"
                    className="btn-admin btn-admin-secondary"
                    onClick={() => {
                      setRescheduleTarget(null);
                      setRescheduleStep("form");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted">
                  Review the change before notifying students.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted">
                      From
                    </p>
                    {(() => {
                      const when = formatSessionWhenLabel(
                        rescheduleTarget.starts_at,
                        rescheduleTarget.ends_at
                      );
                      return (
                        <>
                          <p className="mt-2 font-medium text-text">{when.date}</p>
                          <p className="text-muted">{when.time}</p>
                        </>
                      );
                    })()}
                  </div>
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted">
                      To
                    </p>
                    {(() => {
                      const when = formatSessionWhenLabel(
                        fromLocalInput(rescheduleForm.starts_at),
                        fromLocalInput(rescheduleForm.ends_at)
                      );
                      return (
                        <>
                          <p className="mt-2 font-medium text-text">{when.date}</p>
                          <p className="text-muted">{when.time}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {isSessionPublished(rescheduleTarget) &&
                  isFutureScheduled(rescheduleTarget) && (
                    <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-text">
                      {rescheduleForm.mode === "in_place" ? (
                        <>
                          <li>Same session record will be updated</li>
                          <li>Existing Google Calendar event will be patched</li>
                        </>
                      ) : (
                        <>
                          <li>Original session will be cancelled</li>
                          <li>New replacement session will be created</li>
                          <li>New Google Calendar event will be sent</li>
                        </>
                      )}
                      <li>Enrolled students will receive a reschedule email</li>
                      <li>Calendar updates will be sent to attendees</li>
                      <li>In-app notifications will be created</li>
                      <li>Change will be recorded in the audit log</li>
                    </ul>
                  )}

                {rescheduleForm.note.trim() && (
                  <p className="mt-3 text-sm text-muted">
                    Note: {rescheduleForm.note.trim()}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    className="btn-admin btn-admin-primary disabled:opacity-60"
                    onClick={confirmRescheduleSession}
                  >
                    Confirm reschedule
                  </button>
                  <button
                    type="button"
                    className="btn-admin btn-admin-secondary"
                    onClick={() => setRescheduleStep("form")}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recurring */}
      {mode === "recurring" && (
        <div
          className="mb-10 space-y-6"
          aria-labelledby={`${tabsId}-recurring`}
        >
          <div className="glass-card grid gap-4 p-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="eyebrow-pill mb-3 inline-flex">Recurring</p>
              <h2 className="text-lg font-medium text-text">
                Recurring schedule
              </h2>
              <p className="mt-1 text-sm text-muted">
                Course: <span className="text-text">{courseName}</span>
                {" · "}
                Preview → Generate (draft sessions) → Publish (calendar +
                email).
              </p>
            </div>

            <label className="text-sm text-muted">
              Session title
              <input
                required
                value={recurring.title}
                onChange={(e) =>
                  markRecurringChanged("title", e.target.value)
                }
                className="input-premium mt-1"
              />
            </label>
            <label className="text-sm text-muted">
              Instructor
              <input
                value={recurring.instructor}
                onChange={(e) =>
                  markRecurringChanged("instructor", e.target.value)
                }
                className="input-premium mt-1"
              />
            </label>
            <label className="text-sm text-muted">
              Start date
              <input
                required
                type="date"
                value={recurring.start_date}
                onChange={(e) =>
                  markRecurringChanged("start_date", e.target.value)
                }
                className="input-premium mt-1"
              />
            </label>
            <label className="text-sm text-muted">
              End date
              <input
                required
                type="date"
                value={recurring.end_date}
                onChange={(e) =>
                  markRecurringChanged("end_date", e.target.value)
                }
                className="input-premium mt-1"
              />
            </label>
            <label className="text-sm text-muted">
              Start time
              <input
                required
                type="time"
                value={recurring.start_time}
                onChange={(e) =>
                  markRecurringChanged("start_time", e.target.value)
                }
                className="input-premium mt-1"
              />
            </label>
            <label className="text-sm text-muted">
              End time
              <input
                required
                type="time"
                value={recurring.end_time}
                onChange={(e) =>
                  markRecurringChanged("end_time", e.target.value)
                }
                className="input-premium mt-1"
              />
            </label>
            <label className="text-sm text-muted md:col-span-2">
              Timezone
              <select
                value={recurring.timezone}
                onChange={(e) =>
                  markRecurringChanged("timezone", e.target.value)
                }
                className="input-premium mt-1"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                    {tz === "Asia/Kolkata" ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="md:col-span-2">
              <legend className="text-sm text-muted">Days of week</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const checked = recurring.days.includes(d.name);
                  return (
                    <label
                      key={d.name}
                      className={`cursor-pointer rounded-full border px-3 py-2 text-sm transition-colors ${
                        checked
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-[var(--border)] text-muted hover:border-[var(--border-strong)] hover:text-text"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleDay(d.name)}
                      />
                      <span aria-hidden>{d.label}</span>
                      <span className="sr-only">{d.name}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="text-sm text-muted">
              Meeting URL
              <input
                type="url"
                placeholder="https://"
                value={recurring.meeting_url}
                onChange={(e) =>
                  markRecurringChanged("meeting_url", e.target.value)
                }
                className="input-premium mt-1"
              />
            </label>
            <label className="text-sm text-muted">
              Location
              <input
                value={recurring.location}
                onChange={(e) =>
                  markRecurringChanged("location", e.target.value)
                }
                className="input-premium mt-1"
              />
            </label>
            <label className="text-sm text-muted md:col-span-2">
              Description
              <textarea
                value={recurring.description}
                onChange={(e) =>
                  markRecurringChanged("description", e.target.value)
                }
                className="input-premium mt-1"
                rows={3}
              />
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="button"
                disabled={busy}
                onClick={onPreview}
                className="btn-admin btn-admin-secondary disabled:opacity-60"
              >
                Preview Schedule
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  !preview ||
                  previewDirty ||
                  preview.total_sessions === 0
                }
                onClick={onGenerate}
                className="btn-admin btn-admin-primary disabled:opacity-60"
                title={
                  !preview || previewDirty
                    ? "Preview the schedule before generating"
                    : undefined
                }
              >
                Generate Schedule
              </button>
            </div>
            <p className="md:col-span-2 text-xs text-muted">
              Generate creates draft sessions only. Use Publish Schedule after
              review to email students and sync calendars.
            </p>
          </div>

          {preview && !previewDirty && (
            <div className="glass-card p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow-pill mb-2 inline-flex">Preview</p>
                  <h3 className="text-lg font-medium text-text">
                    Total sessions:{" "}
                    <span className="text-gradient tabular-nums">
                      {preview.total_sessions}
                    </span>
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Timezone: {preview.timezone}
                  </p>
                </div>
              </div>

              {preview.sessions.length === 0 ? (
                <p className="text-sm text-muted">
                  No dates match the selected days in this range.
                </p>
              ) : (
                <div className="table-shell">
                  <table>
                    <thead>
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Day</th>
                        <th className="px-4 py-3 font-medium">Start</th>
                        <th className="px-4 py-3 font-medium">End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sessions.map((s) => (
                        <tr key={s.starts_at}>
                          <td className="px-4 py-3 text-text">{s.date}</td>
                          <td className="px-4 py-3 text-muted">{s.day_name}</td>
                          <td className="px-4 py-3 tabular-nums text-text">
                            {formatLocalTime(s.starts_at, preview.timezone)}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-text">
                            {formatLocalTime(s.ends_at, preview.timezone)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {(pendingPublishId ||
            schedules.some(
              (r) => r.status === "draft" && r.session_count > 0
            )) && (
            <div className="glass-card border border-accent/20 p-6">
              <p className="eyebrow-pill mb-2 inline-flex">Admin review</p>
              <h3 className="text-lg font-medium text-text">
                Ready to publish
              </h3>
              <p className="mt-1 text-sm text-muted">
                Draft schedules with generated sessions appear here. Publishing
                creates calendar events and sends student emails (duplicates are
                skipped).
              </p>
              <div className="mt-4 space-y-3">
                {schedules
                  .filter(
                    (r) =>
                      r.status === "draft" &&
                      (r.session_count > 0 || r.id === pendingPublishId)
                  )
                  .map((r) => (
                    <div key={r.id} className="panel-row items-center">
                      <div>
                        <p className="font-medium text-text">
                          {r.title}{" "}
                          <span className="text-xs text-accent">(draft)</span>
                        </p>
                        <p className="text-xs text-muted">
                          {r.session_count} session(s) · {r.start_date} →{" "}
                          {r.end_date}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        className="btn-admin btn-admin-primary disabled:opacity-60"
                        onClick={() => onPublish(r.id)}
                      >
                        Publish Schedule
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {schedules.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted">
                Existing recurring rules
              </h3>
              <div className="space-y-3">
                {schedules.map((r) => (
                  <div key={r.id} className="panel-row items-start">
                    <div>
                      <p className="font-medium text-text">
                        {r.title}{" "}
                        <span className="text-xs text-muted">({r.status})</span>
                      </p>
                      <p className="text-xs text-muted">
                        {r.start_date} → {r.end_date} ·{" "}
                        {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)} ·{" "}
                        {r.timezone}
                      </p>
                      <p className="text-xs text-muted">
                        {r.session_count} session(s)
                        {typeof r.future_session_count === "number"
                          ? ` · ${r.future_session_count} upcoming`
                          : ""}
                        {r.published_at
                          ? ` · published ${new Date(r.published_at).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      {r.status === "draft" && r.session_count > 0 && (
                        <button
                          type="button"
                          className="text-accent"
                          disabled={busy}
                          onClick={() => onPublish(r.id)}
                        >
                          Publish
                        </button>
                      )}
                      {r.status !== "cancelled" && (
                        <button
                          type="button"
                          className="text-error"
                          onClick={() => cancelSchedule(r.id)}
                        >
                          Cancel schedule
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar + session management */}
      <div className="mt-10">
        <ScheduleCalendar
          courseName={courseName}
          sessions={sessions}
          onEdit={edit}
          onReschedule={openReschedule}
          onCancel={openCancelSession}
          onDelete={removeSession}
          onRetrySync={retryCalendarSync}
          retryBusyId={retryCalendarBusyId}
        />
      </div>
    </AdminShell>
  );
}
