import { getSupabaseAdmin } from "./supabase.js";
import { sessionCalendarSyncLabel } from "./session-calendar-retry.js";

export type ScheduleDashboardFilters = {
  courseId?: string;
  instructor?: string;
  status?: string;
  calendarSyncStatus?: string;
  startsFrom?: string;
  startsTo?: string;
};

export type DashboardSessionRow = {
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
  calendarSyncLabel: ReturnType<typeof sessionCalendarSyncLabel>;
  calendarSyncError: string | null;
  studentCount: number;
  scheduleRuleId: string | null;
  googleEventId: string | null;
  notifySentAt: string | null;
  calendarInviteVia: string | null;
};

export type DashboardScheduleRow = {
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

export type ScheduleDashboardStats = {
  totalSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  calendarSyncFailures: number;
  publishedSchedules: number;
  draftSchedules: number;
};

export type ScheduleDashboardResult = {
  stats: ScheduleDashboardStats;
  sessions: DashboardSessionRow[];
  schedules: DashboardScheduleRow[];
  courses: { id: string; name: string }[];
  instructors: string[];
};

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDay(iso: string, timezone?: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      weekday: "long",
      timeZone: timezone || undefined,
    });
  } catch {
    return new Date(iso).toLocaleDateString("en-IN", { weekday: "long" });
  }
}

function formatTimeRange(
  startsAt: string,
  endsAt: string,
  timezone?: string
): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone || undefined,
  };
  const start = new Date(startsAt).toLocaleTimeString("en-IN", opts);
  const end = new Date(endsAt).toLocaleTimeString("en-IN", opts);
  return `${start} – ${end}`;
}

function isUpcoming(session: { status: string; starts_at: string }, nowMs: number) {
  return (
    session.status === "scheduled" &&
    new Date(session.starts_at).getTime() >= nowMs
  );
}

function isCompleted(session: { status: string; ends_at: string }, nowMs: number) {
  return (
    session.status === "completed" ||
    (session.status === "scheduled" && new Date(session.ends_at).getTime() < nowMs)
  );
}

export function filterDashboardSessions<
  T extends {
    course_id: string;
    instructor_name: string;
    status: string;
    starts_at: string;
    calendar_sync_status?: string | null;
    calendar_event_status?: string | null;
    google_event_id?: string | null;
  },
>(sessions: T[], filters: ScheduleDashboardFilters): T[] {
  const instructorNeedle = filters.instructor?.trim().toLowerCase();
  const status = filters.status?.trim().toLowerCase();
  const sync = filters.calendarSyncStatus?.trim().toLowerCase();
  const fromMs = filters.startsFrom
    ? new Date(`${filters.startsFrom}T00:00:00`).getTime()
    : null;
  const toMs = filters.startsTo
    ? new Date(`${filters.startsTo}T23:59:59.999`).getTime()
    : null;

  return sessions.filter((s) => {
    if (filters.courseId && s.course_id !== filters.courseId) return false;
    if (
      instructorNeedle &&
      !(s.instructor_name || "").toLowerCase().includes(instructorNeedle)
    ) {
      return false;
    }
    if (status && s.status.toLowerCase() !== status) return false;
    if (sync) {
      const label = sessionCalendarSyncLabel({
        status: s.status,
        calendar_sync_status: s.calendar_sync_status,
        calendar_event_status: (s as { calendar_event_status?: string }).calendar_event_status,
        google_event_id: s.google_event_id,
      }).toLowerCase();
      if (label !== sync) return false;
    }
    const startMs = new Date(s.starts_at).getTime();
    if (fromMs != null && startMs < fromMs) return false;
    if (toMs != null && startMs > toMs) return false;
    return true;
  });
}

export function filterDashboardSchedules<
  T extends {
    course_id: string;
    instructor_name: string;
    status: string;
  },
>(schedules: T[], filters: ScheduleDashboardFilters): T[] {
  const instructorNeedle = filters.instructor?.trim().toLowerCase();
  return schedules.filter((s) => {
    if (filters.courseId && s.course_id !== filters.courseId) return false;
    if (
      instructorNeedle &&
      !(s.instructor_name || "").toLowerCase().includes(instructorNeedle)
    ) {
      return false;
    }
    return true;
  });
}

export function buildDashboardStats(
  sessions: Array<{
    status: string;
    starts_at: string;
    ends_at: string;
    calendar_sync_status?: string | null;
    calendar_event_status?: string | null;
    google_event_id?: string | null;
  }>,
  schedules: Array<{ status: string }>,
  nowMs: number = Date.now()
): ScheduleDashboardStats {
  let upcomingSessions = 0;
  let completedSessions = 0;
  let cancelledSessions = 0;
  let calendarSyncFailures = 0;

  for (const s of sessions) {
    if (s.status === "cancelled") cancelledSessions += 1;
    else if (isCompleted(s, nowMs)) completedSessions += 1;
    else if (isUpcoming(s, nowMs)) upcomingSessions += 1;

    if (
      sessionCalendarSyncLabel({
        status: s.status,
        calendar_sync_status: s.calendar_sync_status,
        calendar_event_status: (s as { calendar_event_status?: string }).calendar_event_status,
        google_event_id: s.google_event_id,
      }) === "Failed"
    ) {
      calendarSyncFailures += 1;
    }
  }

  let publishedSchedules = 0;
  let draftSchedules = 0;
  for (const r of schedules) {
    if (r.status === "published") publishedSchedules += 1;
    if (r.status === "draft") draftSchedules += 1;
  }

  return {
    totalSessions: sessions.length,
    upcomingSessions,
    completedSessions,
    cancelledSessions,
    calendarSyncFailures,
    publishedSchedules,
    draftSchedules,
  };
}

export async function loadScheduleDashboard(
  filters: ScheduleDashboardFilters = {}
): Promise<ScheduleDashboardResult> {
  const admin = getSupabaseAdmin();
  const nowMs = Date.now();

  const [coursesRes, sessionsRes, schedulesRes, enrollmentsRes] =
    await Promise.all([
      admin.from("courses").select("id, name").order("name"),
      admin
        .from("course_sessions")
        .select(
          `id, course_id, title, instructor_name, starts_at, ends_at, meeting_url,
           status, google_event_id, calendar_sync_status, calendar_event_status,
           schedule_rule_id, notify_sent_at, calendar_invite_via,
           course:courses(id, name),
           schedule_rule:course_schedule_rules(timezone, status)`
        )
        .order("starts_at", { ascending: true }),
      admin
        .from("course_schedule_rules")
        .select(
          `id, course_id, title, status, instructor_name, start_date, end_date,
           timezone, published_at, course:courses(id, name)`
        )
        .order("created_at", { ascending: false }),
      admin
        .from("enrollments")
        .select("course_id")
        .eq("status", "active")
        .eq("payment_status", "paid"),
    ]);

  if (coursesRes.error) throw coursesRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (schedulesRes.error) throw schedulesRes.error;
  if (enrollmentsRes.error) throw enrollmentsRes.error;

  const studentCountByCourse = new Map<string, number>();
  for (const row of enrollmentsRes.data ?? []) {
    const cid = row.course_id as string;
    studentCountByCourse.set(cid, (studentCountByCourse.get(cid) ?? 0) + 1);
  }

  const allSessions = sessionsRes.data ?? [];
  const allSchedules = schedulesRes.data ?? [];

  const filteredSessions = filterDashboardSessions(allSessions, filters);
  const filteredSchedules = filterDashboardSchedules(allSchedules, filters);

  const sessionIdsByRule = new Map<string, number>();
  const futureByRule = new Map<string, number>();
  for (const s of allSessions) {
    const ruleId = s.schedule_rule_id as string | null;
    if (!ruleId) continue;
    sessionIdsByRule.set(ruleId, (sessionIdsByRule.get(ruleId) ?? 0) + 1);
    if (isUpcoming(s as { status: string; starts_at: string }, nowMs)) {
      futureByRule.set(ruleId, (futureByRule.get(ruleId) ?? 0) + 1);
    }
  }

  const sessions: DashboardSessionRow[] = filteredSessions.map((s) => {
    const course = unwrap(
      s.course as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null
    );
    const rule = unwrap(
      s.schedule_rule as { timezone?: string; status?: string } | null
    );
    const tz = rule?.timezone;
    return {
      id: s.id as string,
      courseId: s.course_id as string,
      courseName: course?.name || (s.course_id as string),
      title: s.title as string,
      startsAt: s.starts_at as string,
      endsAt: s.ends_at as string,
      day: formatDay(s.starts_at as string, tz),
      timeLabel: formatTimeRange(
        s.starts_at as string,
        s.ends_at as string,
        tz
      ),
      instructorName: (s.instructor_name as string) || "—",
      meetingUrl: (s.meeting_url as string | null) ?? null,
      status: s.status as string,
      calendarSyncStatus: (s.calendar_sync_status as string) || "pending",
      calendarSyncLabel: sessionCalendarSyncLabel({
        status: s.status as string,
        calendar_sync_status: s.calendar_sync_status as string,
        calendar_event_status: s.calendar_event_status as string,
        google_event_id: s.google_event_id as string,
      }),
      calendarSyncError:
        ((s as { calendar_sync_error?: string | null }).calendar_sync_error as
          | string
          | null
          | undefined) ?? null,
      studentCount: studentCountByCourse.get(s.course_id as string) ?? 0,
      scheduleRuleId: (s.schedule_rule_id as string | null) ?? null,
      googleEventId: (s.google_event_id as string | null) ?? null,
      notifySentAt: (s.notify_sent_at as string | null) ?? null,
      calendarInviteVia: (s.calendar_invite_via as string | null) ?? null,
    };
  });

  const schedules: DashboardScheduleRow[] = filteredSchedules.map((r) => {
    const course = unwrap(
      r.course as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null
    );
    return {
      id: r.id as string,
      courseId: r.course_id as string,
      courseName: course?.name || (r.course_id as string),
      title: r.title as string,
      status: r.status as string,
      instructorName: (r.instructor_name as string) || "—",
      startDate: String(r.start_date).slice(0, 10),
      endDate: String(r.end_date).slice(0, 10),
      timezone: r.timezone as string,
      sessionCount: sessionIdsByRule.get(r.id as string) ?? 0,
      futureSessionCount: futureByRule.get(r.id as string) ?? 0,
      publishedAt: (r.published_at as string | null) ?? null,
    };
  });

  const instructorSet = new Set<string>();
  for (const s of allSessions) {
    const name = (s.instructor_name as string)?.trim();
    if (name) instructorSet.add(name);
  }
  for (const r of allSchedules) {
    const name = (r.instructor_name as string)?.trim();
    if (name) instructorSet.add(name);
  }

  return {
    stats: buildDashboardStats(filteredSessions, filteredSchedules, nowMs),
    sessions,
    schedules,
    courses: (coursesRes.data ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
    })),
    instructors: [...instructorSet].sort((a, b) => a.localeCompare(b)),
  };
}
