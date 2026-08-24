import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateSessionCancellation } from "./session-cancel.js";
import type { SessionForEdit } from "./session-edit.js";

const NOW = new Date("2026-09-14T12:00:00.000Z").getTime();

function session(overrides: Partial<SessionForEdit> = {}): SessionForEdit {
  return {
    id: "sess-1",
    course_id: "course-1",
    title: "Weekend Lab",
    description: "",
    instructor_name: "Dr. A",
    starts_at: "2026-09-19T04:30:00.000Z",
    ends_at: "2026-09-19T07:30:00.000Z",
    meeting_url: null,
    location: "",
    status: "scheduled",
    google_event_id: "evt-1",
    notify_sent_at: "2026-09-01T00:00:00.000Z",
    calendar_invite_via: "google",
    ...overrides,
  };
}

describe("validateSessionCancellation", () => {
  it("requires confirmation for published future sessions", () => {
    assert.throws(
      () => validateSessionCancellation(session(), { nowMs: NOW }),
      (err: unknown) =>
        err instanceof Error && err.message.includes("confirmPublishedCancel")
    );
  });

  it("allows cancel when confirmed", () => {
    const result = validateSessionCancellation(session(), {
      nowMs: NOW,
      confirmPublishedCancel: true,
    });
    assert.equal(result.shouldNotifyStudents, true);
  });

  it("rejects cancelling past sessions", () => {
    assert.throws(
      () =>
        validateSessionCancellation(
          session({
            starts_at: "2026-09-05T04:30:00.000Z",
            ends_at: "2026-09-05T07:30:00.000Z",
          }),
          { nowMs: NOW, confirmPublishedCancel: true }
        ),
      (err: unknown) =>
        err instanceof Error && err.message.includes("future")
    );
  });

  it("does not notify for draft unpublished sessions", () => {
    const result = validateSessionCancellation(
      session({
        notify_sent_at: null,
        google_event_id: null,
        calendar_invite_via: null,
        ics_invite_sent_at: null,
      }),
      { nowMs: NOW, scheduleRuleStatus: "draft" }
    );
    assert.equal(result.shouldNotifyStudents, false);
  });
});
