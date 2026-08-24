import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCalendarEventDescription,
  sessionEventSummary,
} from "./calendar-format.js";
import {
  buildCalendarEventBody,
  formatCalendarDateTime,
  resolveCalendarInviteChannel,
  sanitizeCalendarLogMessage,
} from "./google-calendar.js";
import { summarizeCalendarInviteChannels } from "./sessions.js";

describe("sessionEventSummary", () => {
  it("uses Course Name - Session Title format", () => {
    assert.equal(
      sessionEventSummary("AI/ML Foundation", "Weekend Lab"),
      "AI/ML Foundation - Weekend Lab"
    );
  });
});

describe("buildCalendarEventDescription", () => {
  it("includes course, instructor, meeting URL, location, and session details", () => {
    const desc = buildCalendarEventDescription({
      courseName: "AI/ML Foundation",
      instructorName: "Dr. Faculty",
      meetingUrl: "https://meet.example.com/lab",
      location: "Online",
      sessionDetails: "Week 1 introduction",
    });
    assert.match(desc, /Course: AI\/ML Foundation/);
    assert.match(desc, /Instructor: Dr\. Faculty/);
    assert.match(desc, /Meeting URL: https:\/\/meet\.example\.com\/lab/);
    assert.match(desc, /Location: Online/);
    assert.match(desc, /Session details:\nWeek 1 introduction/);
  });
});

describe("buildCalendarEventBody", () => {
  it("builds summary, timezone-aware times, and deduped attendees", () => {
    const body = buildCalendarEventBody({
      courseName: "AI/ML Foundation",
      sessionTitle: "Weekend Lab",
      sessionDetails: "Lab session",
      instructorName: "Dr. Faculty",
      startsAt: "2026-09-05T04:30:00.000Z",
      endsAt: "2026-09-05T07:30:00.000Z",
      timezone: "Asia/Kolkata",
      meetingUrl: "https://meet.example.com/lab",
      location: "Online",
      attendeeEmails: ["ada@example.com", "ada@example.com", "bob@example.com"],
    });

    assert.equal(body.summary, "AI/ML Foundation - Weekend Lab");
    assert.equal(body.start.timeZone, "Asia/Kolkata");
    assert.equal(body.end.timeZone, "Asia/Kolkata");
    assert.equal(body.start.dateTime, "2026-09-05T10:00:00");
    assert.equal(body.end.dateTime, "2026-09-05T13:00:00");
    assert.equal(body.attendees.length, 2);
    assert.deepEqual(body.attendees.map((a) => a.email).sort(), [
      "ada@example.com",
      "bob@example.com",
    ]);
    assert.match(body.description, /Course: AI\/ML Foundation/);
  });

  it("patches existing events via googleEventId at call site (insert vs patch)", () => {
    // googleEventId is not part of body — upsertCalendarEvent uses it for patch
    const body = buildCalendarEventBody({
      courseName: "Course",
      sessionTitle: "Session",
      startsAt: "2026-09-05T04:30:00.000Z",
      endsAt: "2026-09-05T07:30:00.000Z",
      timezone: "Asia/Kolkata",
      attendeeEmails: [],
      googleEventId: "evt-existing",
    });
    assert.equal(body.summary, "Course - Session");
  });
});

describe("formatCalendarDateTime", () => {
  it("converts UTC ISO to local wall time in IANA zone", () => {
    const { dateTime, timeZone } = formatCalendarDateTime(
      "2026-09-05T04:30:00.000Z",
      "Asia/Kolkata"
    );
    assert.equal(timeZone, "Asia/Kolkata");
    assert.equal(dateTime, "2026-09-05T10:00:00");
  });
});

describe("resolveCalendarInviteChannel", () => {
  it("uses google when invites sent via Google", () => {
    assert.equal(
      resolveCalendarInviteChannel({
        configured: true,
        invitedViaGoogle: true,
        syncStatus: "synced",
        attendeeCount: 3,
      }),
      "google"
    );
  });

  it("falls back to ics_email when Google cannot invite", () => {
    assert.equal(
      resolveCalendarInviteChannel({
        configured: true,
        invitedViaGoogle: false,
        syncStatus: "synced",
        attendeeCount: 3,
      }),
      "ics_email"
    );
  });

  it("falls back to ics_email when Google is not configured", () => {
    assert.equal(
      resolveCalendarInviteChannel({
        configured: false,
        invitedViaGoogle: false,
        syncStatus: "pending",
        attendeeCount: 2,
      }),
      "ics_email"
    );
  });

  it("returns none when there are no attendees", () => {
    assert.equal(
      resolveCalendarInviteChannel({
        configured: true,
        invitedViaGoogle: false,
        syncStatus: "synced",
        attendeeCount: 0,
      }),
      "none"
    );
  });
});

describe("summarizeCalendarInviteChannels", () => {
  it("summarizes invite delivery for schedule email copy", () => {
    assert.equal(summarizeCalendarInviteChannels(["google", "google"]), "google");
    assert.equal(summarizeCalendarInviteChannels(["ics_email"]), "ics_email");
    assert.equal(
      summarizeCalendarInviteChannels(["google", "ics_email"]),
      "mixed"
    );
    assert.equal(summarizeCalendarInviteChannels(["none"]), "none");
  });
});

describe("sanitizeCalendarLogMessage", () => {
  it("redacts private keys from error output", () => {
    const raw =
      'Error with -----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----';
    const safe = sanitizeCalendarLogMessage(raw);
    assert.doesNotMatch(safe, /BEGIN PRIVATE KEY/);
    assert.match(safe, /\[REDACTED_KEY\]/);
  });
});
