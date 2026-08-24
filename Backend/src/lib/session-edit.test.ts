import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSessionHistorical,
  isSessionPublishedForStudents,
  validateSessionEdit,
  type SessionForEdit,
} from "./session-edit.js";

const NOW = new Date("2026-09-14T12:00:00.000Z").getTime();

function baseSession(
  overrides: Partial<SessionForEdit> = {}
): SessionForEdit {
  return {
    id: "sess-1",
    course_id: "course-1",
    title: "Weekend Lab",
    description: "Intro",
    instructor_name: "Dr. A",
    starts_at: "2026-09-19T04:30:00.000Z",
    ends_at: "2026-09-19T07:30:00.000Z",
    meeting_url: "https://meet.example.com/lab",
    location: "Online",
    status: "scheduled",
    google_event_id: "evt-123",
    calendar_invite_via: "google",
    notify_sent_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("isSessionHistorical", () => {
  it("treats completed and ended sessions as historical", () => {
    assert.equal(
      isSessionHistorical(
        { status: "completed", ends_at: "2026-09-01T00:00:00.000Z" },
        NOW
      ),
      true
    );
    assert.equal(
      isSessionHistorical(
        { status: "scheduled", ends_at: "2026-09-10T00:00:00.000Z" },
        NOW
      ),
      true
    );
  });

  it("treats future scheduled sessions as not historical", () => {
    assert.equal(
      isSessionHistorical(
        { status: "scheduled", ends_at: "2026-09-20T00:00:00.000Z" },
        NOW
      ),
      false
    );
  });
});

describe("isSessionPublishedForStudents", () => {
  it("detects published schedule rule sessions", () => {
    const s = baseSession({
      notify_sent_at: null,
      google_event_id: null,
      calendar_invite_via: null,
      ics_invite_sent_at: null,
    });
    assert.equal(isSessionPublishedForStudents(s, "published"), true);
    assert.equal(isSessionPublishedForStudents(s, "draft"), false);
  });
});

describe("validateSessionEdit", () => {
  it("requires confirmation for published future calendar field changes", () => {
    assert.throws(
      () =>
        validateSessionEdit(baseSession(), {
          instructor_name: "Dr. B",
        }),
      (err: unknown) =>
        err instanceof Error && err.message.includes("confirmPublishedEdit")
    );
  });

  it("allows published future edits when confirmed", () => {
    const result = validateSessionEdit(baseSession(), {
      instructor_name: "Dr. B",
      confirmPublishedEdit: true,
    });
    assert.equal(result.shouldNotifyStudents, true);
    assert.equal(result.shouldSyncCalendar, true);
    assert.deepEqual(result.calendarFieldsChanged, ["instructor_name"]);
  });

  it("blocks schedule changes on past sessions", () => {
    const past = baseSession({
      status: "completed",
      starts_at: "2026-09-05T04:30:00.000Z",
      ends_at: "2026-09-05T07:30:00.000Z",
    });
    assert.throws(
      () =>
        validateSessionEdit(past, {
          starts_at: "2026-09-20T04:30:00.000Z",
        }),
      (err: unknown) =>
        err instanceof Error && err.message.includes("historical")
    );
  });

  it("allows description-only updates on past sessions", () => {
    const past = baseSession({
      status: "completed",
      starts_at: "2026-09-05T04:30:00.000Z",
      ends_at: "2026-09-05T07:30:00.000Z",
    });
    const result = validateSessionEdit(past, {
      description: "Archived notes",
    });
    assert.equal(result.shouldNotifyStudents, false);
    assert.equal(result.isHistorical, true);
    assert.equal(result.patch.description, "Archived notes");
  });

  it("does not notify for draft unpublished future sessions", () => {
    const draft = baseSession({
      notify_sent_at: null,
      google_event_id: null,
      calendar_invite_via: null,
      ics_invite_sent_at: null,
    });
    const result = validateSessionEdit(draft, {
      instructor_name: "Dr. B",
    });
    assert.equal(result.shouldNotifyStudents, false);
    assert.equal(result.isPublished, false);
  });

  it("rejects non-http meeting_url values", () => {
    assert.throws(
      () =>
        validateSessionEdit(baseSession(), {
          meeting_url: "javascript:alert(1)",
          confirmPublishedEdit: true,
        }),
      (err: unknown) =>
        err instanceof Error && err.message.includes("http(s)")
    );
  });
});
