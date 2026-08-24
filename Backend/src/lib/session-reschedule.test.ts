import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateSessionReschedule } from "./session-reschedule.js";
import type { SessionForEdit } from "./session-edit.js";

const NOW = new Date("2026-09-10T12:00:00.000Z").getTime();

function session(overrides: Partial<SessionForEdit> = {}): SessionForEdit {
  return {
    id: "sess-1",
    course_id: "course-1",
    title: "Weekend Lab",
    description: "",
    instructor_name: "Dr. A",
    starts_at: "2026-09-12T04:30:00.000Z",
    ends_at: "2026-09-12T07:30:00.000Z",
    meeting_url: null,
    location: "",
    status: "scheduled",
    google_event_id: "evt-1",
    notify_sent_at: "2026-09-01T00:00:00.000Z",
    calendar_invite_via: "google",
    ...overrides,
  };
}

describe("validateSessionReschedule", () => {
  it("requires confirmation for published sessions", () => {
    assert.throws(
      () =>
        validateSessionReschedule(
          session(),
          {
            startsAt: "2026-09-13T05:30:00.000Z",
            endsAt: "2026-09-13T08:30:00.000Z",
          },
          { nowMs: NOW }
        ),
      (err: unknown) =>
        err instanceof Error && err.message.includes("confirmReschedule")
    );
  });

  it("accepts in-place reschedule when confirmed", () => {
    const result = validateSessionReschedule(
      session(),
      {
        startsAt: "2026-09-13T05:30:00.000Z",
        endsAt: "2026-09-13T08:30:00.000Z",
        confirmReschedule: true,
      },
      { nowMs: NOW }
    );
    assert.equal(result.mode, "in_place");
    assert.equal(result.shouldNotifyStudents, true);
  });

  it("rejects unchanged times", () => {
    assert.throws(
      () =>
        validateSessionReschedule(
          session(),
          {
            startsAt: "2026-09-12T04:30:00.000Z",
            endsAt: "2026-09-12T07:30:00.000Z",
            confirmReschedule: true,
          },
          { nowMs: NOW }
        ),
      (err: unknown) =>
        err instanceof Error && err.message.includes("same")
    );
  });
});
