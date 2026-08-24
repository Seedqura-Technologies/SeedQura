import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canRetrySessionCalendarSync,
  sessionCalendarSyncLabel,
} from "./session-calendar-retry.js";
import { isCalendarEventNotFoundError } from "./google-calendar.js";

const NOW = new Date("2026-09-14T12:00:00.000Z").getTime();

describe("sessionCalendarSyncLabel", () => {
  it("maps sync statuses for admin display", () => {
    assert.equal(
      sessionCalendarSyncLabel({ status: "scheduled", calendar_sync_status: "synced" }),
      "Synced"
    );
    assert.equal(
      sessionCalendarSyncLabel({ status: "scheduled", calendar_sync_status: "pending" }),
      "Pending"
    );
    assert.equal(
      sessionCalendarSyncLabel({ status: "scheduled", calendar_sync_status: "failed" }),
      "Failed"
    );
    assert.equal(
      sessionCalendarSyncLabel({
        status: "cancelled",
        calendar_sync_status: "cancelled",
      }),
      "Cancelled"
    );
  });
});

describe("canRetrySessionCalendarSync", () => {
  it("allows retry for failed published future sessions", () => {
    assert.equal(
      canRetrySessionCalendarSync(
        {
          status: "scheduled",
          starts_at: "2026-09-19T04:30:00.000Z",
          calendar_sync_status: "failed",
          notify_sent_at: "2026-09-01T00:00:00.000Z",
        },
        NOW
      ),
      true
    );
  });

  it("blocks retry for past sessions", () => {
    assert.equal(
      canRetrySessionCalendarSync(
        {
          status: "scheduled",
          starts_at: "2026-09-05T04:30:00.000Z",
          calendar_sync_status: "failed",
          notify_sent_at: "2026-09-01T00:00:00.000Z",
        },
        NOW
      ),
      false
    );
  });

  it("blocks retry when already synced", () => {
    assert.equal(
      canRetrySessionCalendarSync(
        {
          status: "scheduled",
          starts_at: "2026-09-19T04:30:00.000Z",
          calendar_sync_status: "synced",
          google_event_id: "evt-1",
        },
        NOW
      ),
      false
    );
  });
});

describe("isCalendarEventNotFoundError", () => {
  it("detects HTTP 404 style Google errors", () => {
    assert.equal(isCalendarEventNotFoundError({ code: 404 }), true);
    assert.equal(
      isCalendarEventNotFoundError(new Error("Not Found: Resource has been deleted")),
      true
    );
    assert.equal(isCalendarEventNotFoundError(new Error("Forbidden")), false);
  });
});
