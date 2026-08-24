import { DateTime } from "luxon";
import { createPgClient } from "./db.js";
import type { SessionRow } from "./sessions.js";

/** JS weekday: 0=Sunday … 6=Saturday (matches course_schedule_rules.days_of_week). */
export type JsWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ScheduleGenerateInput = {
  courseId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysOfWeek: Array<number | string>;
  startTime: string; // HH:mm or HH:mm:ss
  endTime: string;
  timezone: string;
  title: string;
  instructor?: string;
  meetingUrl?: string | null;
  location?: string;
  description?: string;
  scheduleRuleId: string;
};

export type GeneratedOccurrence = {
  course_id: string;
  schedule_rule_id: string;
  title: string;
  description: string;
  instructor_name: string;
  starts_at: string; // ISO UTC
  ends_at: string; // ISO UTC
  meeting_url: string | null;
  location: string;
  status: "scheduled";
  calendar_sync_status: "pending";
  calendar_event_status: "none";
};

export class ScheduleGeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScheduleGeneratorError";
  }
}

const DAY_NAME_TO_JS: Record<string, JsWeekday> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

function isYmd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeTime(value: string): string {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  throw new ScheduleGeneratorError(
    `Invalid time "${value}" (expected HH:mm or HH:mm:ss)`
  );
}

/** Normalize day names / numbers to JS weekdays 0–6. Dedupes and sorts. */
export function normalizeDaysOfWeek(
  days: Array<number | string>
): JsWeekday[] {
  if (!days?.length) {
    throw new ScheduleGeneratorError("daysOfWeek must contain at least one day");
  }
  const set = new Set<JsWeekday>();
  for (const raw of days) {
    if (typeof raw === "number") {
      if (!Number.isInteger(raw) || raw < 0 || raw > 6) {
        throw new ScheduleGeneratorError(
          `Invalid day number ${raw} (expected 0–6, Sunday–Saturday)`
        );
      }
      set.add(raw as JsWeekday);
      continue;
    }
    const key = String(raw).trim().toLowerCase();
    const mapped = DAY_NAME_TO_JS[key];
    if (mapped === undefined) {
      throw new ScheduleGeneratorError(`Invalid day name "${raw}"`);
    }
    set.add(mapped);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Validate schedule bounds. Uses calendar dates + wall-clock times in the
 * given IANA timezone (does not generate occurrences).
 */
export function assertValidScheduleInput(input: ScheduleGenerateInput): {
  days: JsWeekday[];
  startTime: string;
  endTime: string;
} {
  if (!input.courseId?.trim()) {
    throw new ScheduleGeneratorError("courseId is required");
  }
  if (!input.scheduleRuleId?.trim()) {
    throw new ScheduleGeneratorError("scheduleRuleId is required");
  }
  if (!input.title?.trim()) {
    throw new ScheduleGeneratorError("title is required");
  }
  if (!input.timezone?.trim()) {
    throw new ScheduleGeneratorError("timezone is required");
  }
  if (!DateTime.now().setZone(input.timezone).isValid) {
    throw new ScheduleGeneratorError(`Invalid timezone "${input.timezone}"`);
  }
  if (!isYmd(input.startDate) || !isYmd(input.endDate)) {
    throw new ScheduleGeneratorError(
      "startDate and endDate must be YYYY-MM-DD"
    );
  }

  const startDate = DateTime.fromISO(input.startDate, {
    zone: input.timezone,
  });
  const endDate = DateTime.fromISO(input.endDate, { zone: input.timezone });
  if (!startDate.isValid || !endDate.isValid) {
    throw new ScheduleGeneratorError("Invalid startDate or endDate");
  }
  if (endDate < startDate) {
    throw new ScheduleGeneratorError(
      "endDate must be on or after startDate"
    );
  }

  const startTime = normalizeTime(input.startTime);
  const endTime = normalizeTime(input.endTime);
  const startTod = DateTime.fromISO(`${input.startDate}T${startTime}`, {
    zone: input.timezone,
  });
  const endTod = DateTime.fromISO(`${input.startDate}T${endTime}`, {
    zone: input.timezone,
  });
  if (!startTod.isValid || !endTod.isValid) {
    throw new ScheduleGeneratorError("Invalid startTime or endTime");
  }
  if (endTod <= startTod) {
    throw new ScheduleGeneratorError("endTime must be after startTime");
  }

  const days = normalizeDaysOfWeek(input.daysOfWeek);
  return { days, startTime, endTime };
}

/**
 * Expand a recurring rule into individual occurrence payloads.
 * Pure / reusable — no DB, email, or calendar side effects.
 */
export function expandScheduleOccurrences(
  input: ScheduleGenerateInput
): GeneratedOccurrence[] {
  const { days, startTime, endTime } = assertValidScheduleInput(input);
  const daySet = new Set<number>(days);

  const occurrences: GeneratedOccurrence[] = [];
  let cursor = DateTime.fromISO(input.startDate, { zone: input.timezone }).startOf(
    "day"
  );
  const last = DateTime.fromISO(input.endDate, { zone: input.timezone }).startOf(
    "day"
  );

  while (cursor <= last) {
    // Luxon weekday: 1=Monday … 7=Sunday → JS 0=Sunday … 6=Saturday
    const jsDay = (cursor.weekday % 7) as JsWeekday;
    if (daySet.has(jsDay)) {
      const ymd = cursor.toISODate();
      if (!ymd) {
        throw new ScheduleGeneratorError("Failed to format occurrence date");
      }
      const starts = DateTime.fromISO(`${ymd}T${startTime}`, {
        zone: input.timezone,
      });
      const ends = DateTime.fromISO(`${ymd}T${endTime}`, {
        zone: input.timezone,
      });
      if (!starts.isValid || !ends.isValid) {
        throw new ScheduleGeneratorError(
          `Failed to build timestamps for ${ymd}`
        );
      }
      // Guard: occurrence calendar date must stay inside [startDate, endDate]
      const occDate = starts.setZone(input.timezone).toISODate();
      if (
        !occDate ||
        occDate < input.startDate ||
        occDate > input.endDate
      ) {
        cursor = cursor.plus({ days: 1 });
        continue;
      }

      const startsAt = starts.toUTC().toISO();
      const endsAt = ends.toUTC().toISO();
      if (!startsAt || !endsAt) {
        throw new ScheduleGeneratorError(
          `Failed to convert ${ymd} to UTC ISO`
        );
      }

      occurrences.push({
        course_id: input.courseId,
        schedule_rule_id: input.scheduleRuleId,
        title: input.title.trim(),
        description: (input.description ?? "").trim(),
        instructor_name: (input.instructor ?? "").trim(),
        starts_at: startsAt,
        ends_at: endsAt,
        meeting_url: input.meetingUrl?.trim() || null,
        location: (input.location ?? "").trim(),
        status: "scheduled",
        calendar_sync_status: "pending",
        calendar_event_status: "none",
      });
    }
    cursor = cursor.plus({ days: 1 });
  }

  return occurrences;
}

const JS_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Human-readable class days, e.g. "Saturday, Sunday". */
export function formatDaysOfWeekLabel(days: number[]): string {
  const unique = [...new Set(days)].sort((a, b) => a - b);
  return unique
    .map((d) => JS_DAY_NAMES[d as JsWeekday] || String(d))
    .join(", ");
}

export type SchedulePreviewInput = {
  startDate: string;
  endDate: string;
  daysOfWeek: Array<number | string>;
  startTime: string;
  endTime: string;
  timezone: string;
  /** Optional — only used for validation placeholder when expanding. */
  courseId?: string;
};

export type SchedulePreviewSession = {
  date: string;
  day_name: string;
  starts_at: string;
  ends_at: string;
  /** Human-readable local window, e.g. "2026-09-05 Saturday 10:00-13:00" */
  label: string;
};

export type SchedulePreviewResult = {
  total_sessions: number;
  timezone: string;
  dates: string[];
  sessions: SchedulePreviewSession[];
};

/**
 * Preview occurrences without persisting.
 * Uses the same expandScheduleOccurrences() path as materialize.
 */
export function buildSchedulePreview(
  input: SchedulePreviewInput
): SchedulePreviewResult {
  const timezone = String(input.timezone || "").trim();
  const occurrences = expandScheduleOccurrences({
    courseId: input.courseId?.trim() || "preview-course",
    scheduleRuleId: "00000000-0000-4000-8000-000000000001",
    startDate: input.startDate,
    endDate: input.endDate,
    daysOfWeek: input.daysOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    timezone,
    title: "Schedule preview",
  });

  const sessions: SchedulePreviewSession[] = occurrences.map((o) => {
    const localStart = DateTime.fromISO(o.starts_at, { zone: "utc" }).setZone(
      timezone
    );
    const localEnd = DateTime.fromISO(o.ends_at, { zone: "utc" }).setZone(
      timezone
    );
    const date = localStart.toISODate() || "";
    const jsDay = (localStart.weekday % 7) as number;
    const day_name = JS_DAY_NAMES[jsDay] || "";
    const startHm = localStart.toFormat("HH:mm");
    const endHm = localEnd.toFormat("HH:mm");
    return {
      date,
      day_name,
      starts_at: o.starts_at,
      ends_at: o.ends_at,
      label: `${date} ${day_name} ${startHm}-${endHm}`,
    };
  });

  return {
    total_sessions: sessions.length,
    timezone,
    dates: sessions.map((s) => s.date),
    sessions,
  };
}

/** Keep only occurrences whose starts_at is not already present. */
export function selectNewOccurrences(
  occurrences: GeneratedOccurrence[],
  existingStartsAt: Iterable<string>
): GeneratedOccurrence[] {
  const existing = new Set(
    [...existingStartsAt].map((s) => new Date(s).toISOString())
  );
  return occurrences.filter(
    (o) => !existing.has(new Date(o.starts_at).toISOString())
  );
}

export type MaterializeResult = {
  sessions: SessionRow[];
  created: SessionRow[];
  createdCount: number;
  skippedCount: number;
  totalExpanded: number;
};

/**
 * Persist expanded occurrences as course_sessions.
 * Uses a DB transaction + ON CONFLICT to prevent duplicates.
 * Does NOT sync Google Calendar or send email.
 */
export async function materializeScheduleSessions(
  input: ScheduleGenerateInput
): Promise<MaterializeResult> {
  const occurrences = expandScheduleOccurrences(input);
  if (occurrences.length === 0) {
    return {
      sessions: [],
      created: [],
      createdCount: 0,
      skippedCount: 0,
      totalExpanded: 0,
    };
  }

  const client = createPgClient();
  await client.connect();
  try {
    await client.query("BEGIN");

    const course = await client.query(
      `select id from public.courses where id = $1`,
      [input.courseId]
    );
    if (!course.rows[0]) {
      throw new ScheduleGeneratorError(`Course not found: ${input.courseId}`);
    }

    const rule = await client.query(
      `select id, course_id from public.course_schedule_rules where id = $1`,
      [input.scheduleRuleId]
    );
    if (!rule.rows[0]) {
      throw new ScheduleGeneratorError(
        `Schedule rule not found: ${input.scheduleRuleId}`
      );
    }
    if (rule.rows[0].course_id !== input.courseId) {
      throw new ScheduleGeneratorError(
        "scheduleRuleId does not belong to courseId"
      );
    }

    const existing = await client.query<{ starts_at: Date }>(
      `select starts_at from public.course_sessions
       where schedule_rule_id = $1
         and starts_at = any($2::timestamptz[])`,
      [input.scheduleRuleId, occurrences.map((o) => o.starts_at)]
    );
    const existingStarts = existing.rows.map((r) =>
      new Date(r.starts_at).toISOString()
    );
    const toInsert = selectNewOccurrences(occurrences, existingStarts);

    const created: SessionRow[] = [];
    if (toInsert.length > 0) {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      let i = 1;
      for (const row of toInsert) {
        placeholders.push(
          `($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}::timestamptz, $${i++}::timestamptz, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`
        );
        values.push(
          row.course_id,
          row.schedule_rule_id,
          row.title,
          row.description,
          row.instructor_name,
          row.starts_at,
          row.ends_at,
          row.meeting_url,
          row.location,
          row.status,
          row.calendar_sync_status,
          row.calendar_event_status,
          new Date().toISOString()
        );
      }

      const inserted = await client.query(
        `insert into public.course_sessions (
          course_id, schedule_rule_id, title, description, instructor_name,
          starts_at, ends_at, meeting_url, location, status,
          calendar_sync_status, calendar_event_status, updated_at
        ) values ${placeholders.join(", ")}
        on conflict (schedule_rule_id, starts_at) where schedule_rule_id is not null
        do nothing
        returning
          id, course_id, title, description, instructor_name,
          starts_at, ends_at, meeting_url, location, status, google_event_id`,
        values
      );

      for (const row of inserted.rows) {
        created.push({
          id: row.id,
          course_id: row.course_id,
          title: row.title,
          description: row.description,
          instructor_name: row.instructor_name,
          starts_at: new Date(row.starts_at).toISOString(),
          ends_at: new Date(row.ends_at).toISOString(),
          meeting_url: row.meeting_url,
          location: row.location,
          status: row.status,
          google_event_id: row.google_event_id,
        });
      }
    }

    const all = await client.query(
      `select
         id, course_id, title, description, instructor_name,
         starts_at, ends_at, meeting_url, location, status, google_event_id
       from public.course_sessions
       where schedule_rule_id = $1
         and starts_at = any($2::timestamptz[])
       order by starts_at asc`,
      [input.scheduleRuleId, occurrences.map((o) => o.starts_at)]
    );

    await client.query("COMMIT");

    const sessions: SessionRow[] = all.rows.map((row) => ({
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      description: row.description,
      instructor_name: row.instructor_name,
      starts_at: new Date(row.starts_at).toISOString(),
      ends_at: new Date(row.ends_at).toISOString(),
      meeting_url: row.meeting_url,
      location: row.location,
      status: row.status,
      google_event_id: row.google_event_id,
    }));

    return {
      sessions,
      created,
      createdCount: created.length,
      skippedCount: occurrences.length - created.length,
      totalExpanded: occurrences.length,
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    await client.end();
  }
}
