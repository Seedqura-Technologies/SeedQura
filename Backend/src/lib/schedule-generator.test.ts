import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DateTime } from "luxon";
import {
  ScheduleGeneratorError,
  buildSchedulePreview,
  expandScheduleOccurrences,
  normalizeDaysOfWeek,
  selectNewOccurrences,
  type ScheduleGenerateInput,
} from "./schedule-generator.js";

const RULE_ID = "11111111-1111-1111-1111-111111111111";
const COURSE_ID = "ai-ml-foundation";

function baseInput(
  overrides: Partial<ScheduleGenerateInput> = {}
): ScheduleGenerateInput {
  return {
    courseId: COURSE_ID,
    scheduleRuleId: RULE_ID,
    startDate: "2026-09-05",
    endDate: "2026-09-27",
    daysOfWeek: ["Saturday", "Sunday"],
    startTime: "10:00",
    endTime: "13:00",
    timezone: "Asia/Kolkata",
    title: "AI/ML Foundation",
    instructor: "Faculty",
    meetingUrl: "https://meet.example.com/lab",
    location: "",
    description: "Live lab",
    ...overrides,
  };
}

function localParts(isoUtc: string, zone: string) {
  const dt = DateTime.fromISO(isoUtc, { zone: "utc" }).setZone(zone);
  return {
    date: dt.toISODate(),
    time: dt.toFormat("HH:mm"),
    weekday: dt.weekday % 7, // JS 0=Sun…6=Sat
  };
}

describe("normalizeDaysOfWeek", () => {
  it("accepts Saturday/Sunday names", () => {
    assert.deepEqual(normalizeDaysOfWeek(["Saturday", "Sunday"]), [0, 6]);
  });

  it("accepts numeric weekdays", () => {
    assert.deepEqual(normalizeDaysOfWeek([1, 3, 5]), [1, 3, 5]);
  });

  it("rejects empty list", () => {
    assert.throws(() => normalizeDaysOfWeek([]), ScheduleGeneratorError);
  });
});

describe("expandScheduleOccurrences", () => {
  it("generates Saturday/Sunday sessions in range (Asia/Kolkata)", () => {
    const sessions = expandScheduleOccurrences(baseInput());
    assert.equal(sessions.length, 8);

    const dates = sessions.map(
      (s) => localParts(s.starts_at, "Asia/Kolkata").date
    );
    assert.deepEqual(dates, [
      "2026-09-05", // Sat
      "2026-09-06", // Sun
      "2026-09-12",
      "2026-09-13",
      "2026-09-19",
      "2026-09-20",
      "2026-09-26",
      "2026-09-27",
    ]);

    for (const s of sessions) {
      const start = localParts(s.starts_at, "Asia/Kolkata");
      const end = localParts(s.ends_at, "Asia/Kolkata");
      assert.equal(start.time, "10:00");
      assert.equal(end.time, "13:00");
      assert.ok(start.weekday === 0 || start.weekday === 6);
      assert.equal(s.schedule_rule_id, RULE_ID);
      assert.equal(s.calendar_sync_status, "pending");
      assert.equal(s.status, "scheduled");
      // IST = UTC+5:30 → 10:00 IST = 04:30 UTC
      assert.match(s.starts_at, /T04:30:00\.000Z$/);
      assert.match(s.ends_at, /T07:30:00\.000Z$/);
    }
  });

  it("generates weekday Mon–Fri schedule", () => {
    const sessions = expandScheduleOccurrences(
      baseInput({
        startDate: "2026-09-07", // Monday
        endDate: "2026-09-11", // Friday
        daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      })
    );
    assert.equal(sessions.length, 5);
    const dates = sessions.map(
      (s) => localParts(s.starts_at, "Asia/Kolkata").date
    );
    assert.deepEqual(dates, [
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
    ]);
    for (const s of sessions) {
      const day = localParts(s.starts_at, "Asia/Kolkata").weekday;
      assert.ok(day >= 1 && day <= 5);
    }
  });

  it("generates a single-day schedule", () => {
    const sessions = expandScheduleOccurrences(
      baseInput({
        startDate: "2026-09-09",
        endDate: "2026-09-09",
        daysOfWeek: ["Wednesday"],
      })
    );
    assert.equal(sessions.length, 1);
    assert.equal(
      localParts(sessions[0].starts_at, "Asia/Kolkata").date,
      "2026-09-09"
    );
  });

  it("generates a one-week schedule", () => {
    const sessions = expandScheduleOccurrences(
      baseInput({
        startDate: "2026-09-05",
        endDate: "2026-09-11",
        daysOfWeek: [6, 0], // Sat, Sun
      })
    );
    assert.equal(sessions.length, 2);
    assert.deepEqual(
      sessions.map((s) => localParts(s.starts_at, "Asia/Kolkata").date),
      ["2026-09-05", "2026-09-06"]
    );
  });

  it("handles month boundaries", () => {
    const sessions = expandScheduleOccurrences(
      baseInput({
        startDate: "2026-01-30",
        endDate: "2026-02-02",
        daysOfWeek: ["Friday", "Monday"],
        startTime: "09:00",
        endTime: "10:00",
      })
    );
    const dates = sessions.map(
      (s) => localParts(s.starts_at, "Asia/Kolkata").date
    );
    assert.deepEqual(dates, ["2026-01-30", "2026-02-02"]);
  });

  it("handles leap-year February 29", () => {
    const sessions = expandScheduleOccurrences(
      baseInput({
        startDate: "2024-02-28",
        endDate: "2024-03-01",
        daysOfWeek: ["Thursday", "Friday"],
        startTime: "11:00",
        endTime: "12:00",
      })
    );
    const dates = sessions.map(
      (s) => localParts(s.starts_at, "Asia/Kolkata").date
    );
    // 2024-02-29 is Thursday
    assert.ok(dates.includes("2024-02-29"));
    assert.deepEqual(dates, ["2024-02-29", "2024-03-01"]);
  });

  it("never generates outside the requested date range", () => {
    const sessions = expandScheduleOccurrences(baseInput());
    for (const s of sessions) {
      const d = localParts(s.starts_at, "Asia/Kolkata").date!;
      assert.ok(d >= "2026-09-05");
      assert.ok(d <= "2026-09-27");
    }
  });

  it("rejects invalid date range", () => {
    assert.throws(
      () =>
        expandScheduleOccurrences(
          baseInput({ startDate: "2026-09-27", endDate: "2026-09-05" })
        ),
      /endDate must be on or after startDate/
    );
  });

  it("rejects invalid time (end before start)", () => {
    assert.throws(
      () =>
        expandScheduleOccurrences(
          baseInput({ startTime: "13:00", endTime: "10:00" })
        ),
      /endTime must be after startTime/
    );
  });

  it("rejects malformed time", () => {
    assert.throws(
      () => expandScheduleOccurrences(baseInput({ startTime: "10" })),
      ScheduleGeneratorError
    );
  });

  it("does not produce duplicate starts_at in one expansion", () => {
    const sessions = expandScheduleOccurrences(baseInput());
    const starts = sessions.map((s) => s.starts_at);
    assert.equal(starts.length, new Set(starts).size);
  });

  it("duplicate generation is skipped by selectNewOccurrences", () => {
    const first = expandScheduleOccurrences(baseInput());
    const second = expandScheduleOccurrences(baseInput());
    assert.equal(first.length, second.length);

    const existing = first.map((s) => s.starts_at);
    const neu = selectNewOccurrences(second, existing);
    assert.equal(neu.length, 0);

    const partial = selectNewOccurrences(second, existing.slice(0, 3));
    assert.equal(partial.length, second.length - 3);
  });

  it("stores correct Asia/Kolkata → UTC timestamps", () => {
    const [session] = expandScheduleOccurrences(
      baseInput({
        startDate: "2026-09-05",
        endDate: "2026-09-05",
        daysOfWeek: [6],
        startTime: "10:00:00",
        endTime: "13:00:00",
      })
    );
    assert.equal(session.starts_at, "2026-09-05T04:30:00.000Z");
    assert.equal(session.ends_at, "2026-09-05T07:30:00.000Z");
  });
});

describe("buildSchedulePreview", () => {
  it("matches expandScheduleOccurrences dates (no duplicate logic)", () => {
    const input = {
      startDate: "2026-09-05",
      endDate: "2026-09-27",
      daysOfWeek: ["Saturday", "Sunday"] as Array<number | string>,
      startTime: "10:00",
      endTime: "13:00",
      timezone: "Asia/Kolkata",
      courseId: COURSE_ID,
    };
    const preview = buildSchedulePreview(input);
    const expanded = expandScheduleOccurrences({
      ...input,
      scheduleRuleId: RULE_ID,
      title: "AI/ML Foundation",
    });

    assert.equal(preview.total_sessions, expanded.length);
    assert.equal(preview.total_sessions, 8);
    assert.deepEqual(
      preview.dates,
      expanded.map((o) => localParts(o.starts_at, "Asia/Kolkata").date)
    );
    assert.deepEqual(
      preview.sessions.map((s) => s.starts_at),
      expanded.map((o) => o.starts_at)
    );
    assert.deepEqual(
      preview.sessions.map((s) => s.ends_at),
      expanded.map((o) => o.ends_at)
    );
  });

  it("returns day names and local labels", () => {
    const preview = buildSchedulePreview({
      startDate: "2026-09-05",
      endDate: "2026-09-06",
      daysOfWeek: ["Saturday", "Sunday"],
      startTime: "10:00",
      endTime: "13:00",
      timezone: "Asia/Kolkata",
    });
    assert.equal(preview.timezone, "Asia/Kolkata");
    assert.equal(preview.sessions[0].day_name, "Saturday");
    assert.equal(preview.sessions[1].day_name, "Sunday");
    assert.equal(
      preview.sessions[0].label,
      "2026-09-05 Saturday 10:00-13:00"
    );
    assert.equal(
      preview.sessions[1].label,
      "2026-09-06 Sunday 10:00-13:00"
    );
  });

  it("validates invalid preview range", () => {
    assert.throws(
      () =>
        buildSchedulePreview({
          startDate: "2026-09-27",
          endDate: "2026-09-05",
          daysOfWeek: [6],
          startTime: "10:00",
          endTime: "13:00",
          timezone: "Asia/Kolkata",
        }),
      /endDate must be on or after startDate/
    );
  });

  it("validates invalid preview time", () => {
    assert.throws(
      () =>
        buildSchedulePreview({
          startDate: "2026-09-05",
          endDate: "2026-09-05",
          daysOfWeek: [6],
          startTime: "13:00",
          endTime: "10:00",
          timezone: "Asia/Kolkata",
        }),
      /endTime must be after startTime/
    );
  });
});
