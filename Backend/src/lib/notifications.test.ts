import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildScheduleNotificationMetadata,
  formatStudentNotification,
  isScheduleNotificationType,
  sanitizeNotificationMetadataForStudent,
} from "./notifications.js";

describe("isScheduleNotificationType", () => {
  it("recognizes schedule notification types", () => {
    assert.equal(isScheduleNotificationType("session_rescheduled"), true);
    assert.equal(isScheduleNotificationType("calendar_sync_failed"), true);
    assert.equal(isScheduleNotificationType("welcome"), false);
  });
});

describe("buildScheduleNotificationMetadata", () => {
  it("includes course and session fields", () => {
    const meta = buildScheduleNotificationMetadata({
      courseId: "course-1",
      courseName: "Quran Basics",
      sessionId: "sess-1",
      sessionTitle: "Week 3",
      enrollmentId: "enr-1",
    });
    assert.equal(meta.courseId, "course-1");
    assert.equal(meta.courseName, "Quran Basics");
    assert.equal(meta.sessionId, "sess-1");
    assert.equal(meta.sessionTitle, "Week 3");
  });
});

describe("sanitizeNotificationMetadataForStudent", () => {
  it("strips operational fields like googleEventId and syncError", () => {
    const safe = sanitizeNotificationMetadataForStudent({
      courseId: "c1",
      courseName: "Arabic",
      googleEventId: "evt_secret",
      syncError: "private_key leaked",
      calendarSyncStatus: "failed",
    });
    assert.equal(safe.courseId, "c1");
    assert.equal(safe.calendarSyncStatus, "failed");
    assert.equal(safe.googleEventId, undefined);
    assert.equal(safe.syncError, undefined);
  });
});

describe("formatStudentNotification", () => {
  it("maps read status, timestamp, course, and session", () => {
    const formatted = formatStudentNotification({
      id: "n1",
      type: "session_updated",
      title: "Class updated",
      body: "Details changed",
      read_at: null,
      created_at: "2026-09-01T10:00:00.000Z",
      metadata: {
        courseId: "c1",
        courseName: "Arabic 101",
        sessionId: "s1",
        sessionTitle: "Intro",
        googleEventId: "should-not-leak",
      },
    });
    assert.equal(formatted.read, false);
    assert.equal(formatted.timestamp, "2026-09-01T10:00:00.000Z");
    assert.deepEqual(formatted.course, { id: "c1", name: "Arabic 101" });
    assert.deepEqual(formatted.session, { id: "s1", title: "Intro" });
    assert.equal(formatted.metadata.googleEventId, undefined);
  });
});
