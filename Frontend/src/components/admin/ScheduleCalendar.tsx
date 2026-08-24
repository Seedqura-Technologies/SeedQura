"use client";

import { useEffect, useMemo, useState } from "react";

export type CalendarSession = {
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
};

type ViewMode = "month" | "list";
type StatusFilter = "all" | "scheduled" | "cancelled" | "upcoming" | "past";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isUpcoming(s: CalendarSession, now = Date.now()) {
  return s.status === "scheduled" && new Date(s.starts_at).getTime() >= now;
}

function isPast(s: CalendarSession, now = Date.now()) {
  return s.status === "completed" || new Date(s.ends_at).getTime() < now;
}

function isHistoricalSession(s: CalendarSession, now = Date.now()) {
  return s.status === "cancelled" || isPast(s, now);
}

function matchesFilter(s: CalendarSession, filter: StatusFilter) {
  const now = Date.now();
  switch (filter) {
    case "scheduled":
      return s.status === "scheduled";
    case "cancelled":
      return s.status === "cancelled";
    case "upcoming":
      return isUpcoming(s, now);
    case "past":
      return isPast(s, now);
    default:
      return true;
  }
}

function deliveryMode(s: CalendarSession): "Online" | "Offline" | "Hybrid" {
  const online = Boolean(s.meeting_url?.trim());
  const offline = Boolean(s.location?.trim());
  if (online && offline) return "Hybrid";
  if (online) return "Online";
  return "Offline";
}

function syncLabel(s: CalendarSession): "Synced" | "Pending" | "Failed" | "Cancelled" {
  if (s.status === "cancelled") return "Cancelled";
  const raw = (s.calendar_sync_status || "").toLowerCase();
  if (raw === "cancelled" || s.calendar_event_status === "cancelled") {
    return "Cancelled";
  }
  if (raw === "failed") return "Failed";
  if (raw === "synced" || s.google_event_id) return "Synced";
  return "Pending";
}

function syncTone(label: ReturnType<typeof syncLabel>) {
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

function canRetryCalendarSync(s: CalendarSession) {
  if (s.status === "cancelled" || isHistoricalSession(s)) return false;
  const raw = (s.calendar_sync_status || "").toLowerCase();
  if (raw !== "failed" && raw !== "pending") return false;
  return Boolean(
    s.google_event_id ||
      s.notify_sent_at ||
      s.calendar_invite_via ||
      s.schedule_rule_id
  );
}

function statusTone(status: string) {
  if (status === "cancelled") return "text-error";
  if (status === "completed") return "text-muted";
  return "text-accent";
}

function buildMonthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ key: string; day: number | null; dateKey: string | null }> =
    [];

  for (let i = 0; i < startPad; i++) {
    cells.push({ key: `pad-${i}`, day: null, dateKey: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
    cells.push({ key: dateKey, day, dateKey });
  }
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `trail-${cells.length}`,
      day: null,
      dateKey: null,
    });
  }
  return cells;
}

export function ScheduleCalendar({
  courseName,
  sessions,
  onEdit,
  onReschedule,
  onCancel,
  onDelete,
  onRetrySync,
  retryBusyId,
}: {
  courseName: string;
  sessions: CalendarSession[];
  onEdit: (session: CalendarSession) => void;
  onReschedule?: (session: CalendarSession) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onRetrySync?: (session: CalendarSession) => void;
  retryBusyId?: string | null;
}) {
  const now = new Date();
  const [view, setView] = useState<ViewMode>("month");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const syncCounts = useMemo(() => {
    const counts = { Synced: 0, Pending: 0, Failed: 0, Cancelled: 0 };
    for (const s of sessions) {
      counts[syncLabel(s)] += 1;
    }
    return counts;
  }, [sessions]);

  const filtered = useMemo(
    () => sessions.filter((s) => matchesFilter(s, filter)),
    [sessions, filter]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarSession[]>();
    for (const s of filtered) {
      const key = toDateKey(s.starts_at);
      const list = map.get(key) || [];
      list.push(s);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
    }
    return map;
  }, [filtered]);

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  );

  const listSessions = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      ),
    [filtered]
  );

  const selected = sessions.find((s) => s.id === selectedId) || null;

  useEffect(() => {
    if (!selectedId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const todayKey = toDateKey(now.toISOString());

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const filters: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "scheduled", label: "Scheduled" },
    { id: "cancelled", label: "Cancelled" },
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
  ];

  return (
    <section className="glass-card p-6" aria-label="Course schedule calendar">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow-pill mb-2 inline-flex">Calendar</p>
          <h2 className="text-lg font-medium text-text">Schedule overview</h2>
          <p className="mt-1 text-sm text-muted">
            {courseName} · {filtered.length} shown
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["Synced", syncCounts.Synced],
                ["Pending", syncCounts.Pending],
                ["Failed", syncCounts.Failed],
                ["Cancelled", syncCounts.Cancelled],
              ] as const
            ).map(([label, count]) => (
              <span
                key={label}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${syncTone(label)}`}
              >
                {label}
                <span className="tabular-nums opacity-80">{count}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="View">
          {(
            [
              ["month", "Month view"],
              ["list", "List view"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={`btn-admin ${
                view === id ? "btn-admin-primary" : "btn-admin-secondary"
              }`}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="mb-5 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter sessions"
      >
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.id
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-[var(--border)] text-muted hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {view === "month" && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn-admin btn-admin-secondary"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              ←
            </button>
            <h3 className="text-base font-medium text-text">
              {monthLabel(cursor.year, cursor.month)}
            </h3>
            <button
              type="button"
              className="btn-admin btn-admin-secondary"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              →
            </button>
          </div>

          <div
            className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]"
            role="grid"
            aria-label={monthLabel(cursor.year, cursor.month)}
          >
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="bg-[var(--surface-1)] px-1 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted"
                role="columnheader"
              >
                {d}
              </div>
            ))}
            {cells.map((cell) => {
              const daySessions = cell.dateKey
                ? byDate.get(cell.dateKey) || []
                : [];
              const isToday = cell.dateKey === todayKey;
              return (
                <div
                  key={cell.key}
                  role="gridcell"
                  className={`min-h-[5.5rem] bg-[var(--surface-0)] p-1.5 sm:min-h-[6.5rem] ${
                    cell.day == null ? "opacity-40" : ""
                  }`}
                >
                  {cell.day != null && (
                    <>
                      <p
                        className={`mb-1 text-xs tabular-nums ${
                          isToday
                            ? "font-semibold text-accent"
                            : "text-muted"
                        }`}
                      >
                        {cell.day}
                      </p>
                      <div className="space-y-1">
                        {daySessions.slice(0, 3).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedId(s.id)}
                            className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[10px] leading-tight sm:text-[11px] ${
                              s.status === "cancelled"
                                ? "bg-white/5 text-muted line-through"
                                : "bg-accent/10 text-accent hover:bg-accent/20"
                            }`}
                            title={s.title}
                          >
                            {formatTime(s.starts_at)} {s.title}
                          </button>
                        ))}
                        {daySessions.length > 3 && (
                          <p className="px-1 text-[10px] text-muted">
                            +{daySessions.length - 3} more
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="space-y-3">
          {listSessions.length === 0 && (
            <p className="text-sm text-muted">No sessions match this filter.</p>
          )}
          {listSessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className="panel-row w-full text-left transition-colors hover:border-[var(--accent-border)]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text">
                  {s.title}{" "}
                  <span className={`text-xs ${statusTone(s.status)}`}>
                    ({s.status})
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {courseName} · {formatDate(s.starts_at)} ·{" "}
                  {formatTime(s.starts_at)}–{formatTime(s.ends_at)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {s.instructor_name || "No instructor"} · {deliveryMode(s)} ·{" "}
                  <span
                    className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${syncTone(syncLabel(s))}`}
                  >
                    {syncLabel(s)}
                  </span>
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={() => setSelectedId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-detail-title"
            className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow-pill mb-2 inline-flex">Session details</p>
                <h3
                  id="session-detail-title"
                  className="text-xl font-medium text-text"
                >
                  {selected.title}
                </h3>
              </div>
              <button
                type="button"
                className="btn-admin btn-admin-secondary !min-h-0 !px-3 !py-1.5 text-xs"
                onClick={() => setSelectedId(null)}
              >
                Close
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Course
                </dt>
                <dd className="mt-0.5 text-text">{courseName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Date
                </dt>
                <dd className="mt-0.5 text-text">{formatDate(selected.starts_at)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Time
                </dt>
                <dd className="mt-0.5 tabular-nums text-text">
                  {formatTime(selected.starts_at)} –{" "}
                  {formatTime(selected.ends_at)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Instructor
                </dt>
                <dd className="mt-0.5 text-text">
                  {selected.instructor_name || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Mode
                </dt>
                <dd className="mt-0.5 text-text">{deliveryMode(selected)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Status
                </dt>
                <dd className={`mt-0.5 ${statusTone(selected.status)}`}>
                  {selected.status}
                  {selected.schedule_rule_id ? " · recurring" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Calendar sync
                </dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${syncTone(syncLabel(selected))}`}
                  >
                    {syncLabel(selected)}
                  </span>
                  {selected.google_event_id && (
                    <p className="mt-2 text-xs text-muted">
                      Event linked
                      {selected.calendar_invite_via
                        ? ` · via ${selected.calendar_invite_via}`
                        : ""}
                    </p>
                  )}
                  {selected.calendar_sync_error && (
                    <p className="mt-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
                      {selected.calendar_sync_error}
                    </p>
                  )}
                </dd>
              </div>
              {selected.meeting_url && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Meeting URL
                  </dt>
                  <dd className="mt-0.5 break-all">
                    <a
                      href={selected.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent"
                    >
                      {selected.meeting_url}
                    </a>
                  </dd>
                </div>
              )}
              {selected.location && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Location
                  </dt>
                  <dd className="mt-0.5 text-text">{selected.location}</dd>
                </div>
              )}
              {selected.description && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">
                    Description
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-muted">
                    {selected.description}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {canRetryCalendarSync(selected) && onRetrySync && (
                <button
                  type="button"
                  disabled={retryBusyId === selected.id}
                  className="btn-admin btn-admin-primary disabled:opacity-60"
                  onClick={() => onRetrySync(selected)}
                >
                  {retryBusyId === selected.id ? "Retrying…" : "Retry sync"}
                </button>
              )}
              {selected.status !== "cancelled" && (
                <>
                  <button
                    type="button"
                    className="btn-admin btn-admin-primary"
                    onClick={() => {
                      setSelectedId(null);
                      onEdit(selected);
                    }}
                  >
                    {isHistoricalSession(selected)
                      ? "Edit description"
                      : "Edit session"}
                  </button>
                  {!isHistoricalSession(selected) && onReschedule && (
                    <button
                      type="button"
                      className="btn-admin btn-admin-secondary"
                      onClick={() => {
                        setSelectedId(null);
                        onReschedule(selected);
                      }}
                    >
                      Reschedule
                    </button>
                  )}
                  {!isHistoricalSession(selected) && (
                    <button
                      type="button"
                      className="btn-admin btn-admin-secondary"
                      onClick={() => {
                        setSelectedId(null);
                        onCancel(selected.id);
                      }}
                    >
                      Cancel session
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                className="btn-admin btn-admin-secondary text-error"
                onClick={() => {
                  setSelectedId(null);
                  onDelete(selected.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
