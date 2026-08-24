import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDashboardStats,
  filterDashboardSessions,
} from "./schedule-dashboard.js";

const NOW = new Date("2026-09-14T12:00:00.000Z").getTime();

describe("filterDashboardSessions", () => {
  const sessions = [
    {
      course_id: "c1",
      instructor_name: "Dr. A",
      status: "scheduled",
      starts_at: "2026-09-19T04:30:00.000Z",
      ends_at: "2026-09-19T07:30:00.000Z",
      calendar_sync_status: "failed",
    },
    {
      course_id: "c2",
      instructor_name: "Dr. B",
      status: "cancelled",
      starts_at: "2026-09-20T04:30:00.000Z",
      ends_at: "2026-09-20T07:30:00.000Z",
      calendar_sync_status: "cancelled",
    },
  ];

  it("filters by course and sync status", () => {
    const out = filterDashboardSessions(sessions, {
      courseId: "c1",
      calendarSyncStatus: "failed",
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].course_id, "c1");
  });
});

describe("buildDashboardStats", () => {
  it("counts session and schedule buckets", () => {
    const stats = buildDashboardStats(
      [
        {
          status: "scheduled",
          starts_at: "2026-09-19T04:30:00.000Z",
          ends_at: "2026-09-19T07:30:00.000Z",
          calendar_sync_status: "synced",
        },
        {
          status: "cancelled",
          starts_at: "2026-09-05T04:30:00.000Z",
          ends_at: "2026-09-05T07:30:00.000Z",
          calendar_sync_status: "cancelled",
        },
        {
          status: "scheduled",
          starts_at: "2026-09-05T04:30:00.000Z",
          ends_at: "2026-09-05T07:30:00.000Z",
          calendar_sync_status: "failed",
        },
      ],
      [{ status: "published" }, { status: "draft" }],
      NOW
    );
    assert.equal(stats.totalSessions, 3);
    assert.equal(stats.upcomingSessions, 1);
    assert.equal(stats.completedSessions, 1);
    assert.equal(stats.cancelledSessions, 1);
    assert.equal(stats.calendarSyncFailures, 1);
    assert.equal(stats.publishedSchedules, 1);
    assert.equal(stats.draftSchedules, 1);
  });
});
