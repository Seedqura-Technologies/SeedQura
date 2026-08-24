import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isNotifiablePublishedSession,
  selectSessionsToInvite,
  type SessionWithRule,
} from "./student-course-calendar.js";

const NOW = new Date("2026-09-14T12:00:00.000Z").getTime();

function session(
  overrides: Partial<SessionWithRule> & { id: string; starts_at: string }
): SessionWithRule {
  return {
    id: overrides.id,
    course_id: "course-1",
    title: "Class",
    description: "",
    instructor_name: "",
    starts_at: overrides.starts_at,
    ends_at: overrides.ends_at || overrides.starts_at,
    meeting_url: null,
    location: "",
    status: overrides.status ?? "scheduled",
    google_event_id: overrides.google_event_id ?? null,
    schedule_rule_id: overrides.schedule_rule_id ?? null,
    schedule_rule: overrides.schedule_rule ?? null,
    notify_sent_at: overrides.notify_sent_at ?? null,
    calendar_invite_via: overrides.calendar_invite_via ?? null,
    ics_invite_sent_at: overrides.ics_invite_sent_at ?? null,
  };
}

describe("isNotifiablePublishedSession", () => {
  it("includes future sessions under a published schedule rule", () => {
    const s = session({
      id: "s1",
      starts_at: "2026-09-19T04:30:00.000Z",
      schedule_rule_id: "rule-1",
      schedule_rule: { id: "rule-1", status: "published" } as SessionWithRule["schedule_rule"],
    });
    assert.equal(isNotifiablePublishedSession(s, NOW), true);
  });

  it("excludes past sessions even when published", () => {
    const s = session({
      id: "past",
      starts_at: "2026-09-05T04:30:00.000Z",
      schedule_rule_id: "rule-1",
      schedule_rule: { id: "rule-1", status: "published" } as SessionWithRule["schedule_rule"],
    });
    assert.equal(isNotifiablePublishedSession(s, NOW), false);
  });

  it("excludes draft schedule occurrences", () => {
    const s = session({
      id: "draft",
      starts_at: "2026-09-19T04:30:00.000Z",
      schedule_rule_id: "rule-1",
      schedule_rule: { id: "rule-1", status: "draft" } as SessionWithRule["schedule_rule"],
    });
    assert.equal(isNotifiablePublishedSession(s, NOW), false);
  });

  it("includes one-time sessions that were already announced", () => {
    const s = session({
      id: "one-time",
      starts_at: "2026-09-20T04:30:00.000Z",
      notify_sent_at: "2026-09-01T00:00:00.000Z",
    });
    assert.equal(isNotifiablePublishedSession(s, NOW), true);
  });
});

describe("selectSessionsToInvite", () => {
  it("returns only future published sessions not yet invited", () => {
    const sessions = [
      session({
        id: "past",
        starts_at: "2026-09-05T04:30:00.000Z",
        schedule_rule_id: "rule-1",
        schedule_rule: { status: "published" } as SessionWithRule["schedule_rule"],
      }),
      session({
        id: "future-a",
        starts_at: "2026-09-19T04:30:00.000Z",
        schedule_rule_id: "rule-1",
        schedule_rule: { status: "published" } as SessionWithRule["schedule_rule"],
      }),
      session({
        id: "future-b",
        starts_at: "2026-09-20T04:30:00.000Z",
        schedule_rule_id: "rule-1",
        schedule_rule: { status: "published" } as SessionWithRule["schedule_rule"],
      }),
      session({
        id: "future-c",
        starts_at: "2026-09-26T04:30:00.000Z",
        schedule_rule_id: "rule-1",
        schedule_rule: { status: "published" } as SessionWithRule["schedule_rule"],
      }),
    ];

    const selected = selectSessionsToInvite(
      sessions,
      new Set(["future-b"]),
      NOW
    );

    assert.deepEqual(selected.map((s) => s.id), ["future-a", "future-c"]);
  });
});
