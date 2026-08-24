import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSessionIcs,
  buildVTimezone,
  foldIcsLines,
  formatIcsLocalDateTime,
  formatIcsUtcStamp,
} from "./ics.js";

describe("formatIcsUtcStamp", () => {
  it("formats UTC timestamps with Z suffix", () => {
    assert.equal(
      formatIcsUtcStamp("2026-09-05T04:30:00.000Z"),
      "20260905T043000Z"
    );
  });
});

describe("formatIcsLocalDateTime", () => {
  it("defaults to Asia/Kolkata wall time", () => {
    const { tzid, local, offset } = formatIcsLocalDateTime(
      "2026-09-05T04:30:00.000Z",
      "Asia/Kolkata"
    );
    assert.equal(tzid, "Asia/Kolkata");
    assert.equal(local, "20260905T100000");
    assert.equal(offset, "+0530");
  });
});

describe("buildSessionIcs", () => {
  const base = {
    sessionId: "11111111-1111-1111-1111-111111111111",
    courseName: "AI/ML Foundation",
    sessionTitle: "Weekend Lab",
    sessionDetails: "Week 1 lab",
    instructorName: "Dr. Faculty",
    startsAt: "2026-09-05T04:30:00.000Z",
    endsAt: "2026-09-05T07:30:00.000Z",
    timezone: "Asia/Kolkata",
    meetingUrl: "https://meet.example.com/lab",
    location: "Online",
    attendeeEmails: ["student@example.com"],
    organizerEmail: "hello@seedqura.com",
    organizerName: "Seedqura",
  };

  it("includes required RFC fields with timezone", () => {
    const ics = buildSessionIcs(base);
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /VERSION:2\.0/);
    assert.match(ics, /METHOD:REQUEST/);
    assert.match(ics, /BEGIN:VTIMEZONE/);
    assert.match(ics, /TZID:Asia\/Kolkata/);
    assert.match(ics, /BEGIN:VEVENT/);
    assert.match(ics, /UID:11111111-1111-1111-1111-111111111111@seedqura\.com/);
    assert.match(ics, /DTSTAMP:\d{8}T\d{6}Z/);
    assert.match(ics, /DTSTART;TZID=Asia\/Kolkata:20260905T100000/);
    assert.match(ics, /DTEND;TZID=Asia\/Kolkata:20260905T130000/);
    assert.match(ics, /SUMMARY:AI\/ML Foundation - Weekend Lab/);
    assert.match(ics, /DESCRIPTION:.*Course: AI\/ML Foundation/);
    assert.match(ics, /LOCATION:Online/);
    assert.match(ics, /URL:https:\/\/meet\.example\.com\/lab/);
    assert.match(ics, /ORGANIZER;CN=Seedqura:mailto:hello@seedqura\.com/);
    assert.match(ics, /student@example\.com/);
    assert.match(ics, /ATTENDEE;/);
    assert.match(ics, /STATUS:CONFIRMED/);
    assert.match(ics, /END:VEVENT/);
    assert.match(ics, /END:VCALENDAR/);
    assert.match(ics, /\r\n/);
  });

  it("uses Asia/Kolkata when timezone omitted", () => {
    const ics = buildSessionIcs({ ...base, timezone: undefined });
    assert.match(ics, /TZID=Asia\/Kolkata:/);
  });

  it("supports cancellation METHOD", () => {
    const ics = buildSessionIcs({ ...base, method: "CANCEL", sequence: 2 });
    assert.match(ics, /METHOD:CANCEL/);
    assert.match(ics, /STATUS:CANCELLED/);
    assert.match(ics, /SEQUENCE:2/);
    assert.doesNotMatch(ics, /^URL:/m);
  });

  it("folds long lines for Outlook compatibility", () => {
    const longDesc = "A".repeat(120);
    const ics = buildSessionIcs({ ...base, sessionDetails: longDesc });
    assert.match(ics, /\r\n /);
  });
});

describe("buildVTimezone", () => {
  it("emits STANDARD block with offset", () => {
    const tz = buildVTimezone("Asia/Kolkata", "+0530");
    assert.match(tz, /BEGIN:VTIMEZONE/);
    assert.match(tz, /TZOFFSETFROM:\+0530/);
    assert.match(tz, /TZOFFSETTO:\+0530/);
  });
});

describe("foldIcsLines", () => {
  it("wraps lines longer than 75 characters", () => {
    const folded = foldIcsLines("DESCRIPTION:" + "x".repeat(80));
    const lines = folded.split("\r\n");
    assert.ok(lines[0]!.length <= 75);
    assert.match(lines[1]!, /^ /);
  });
});
