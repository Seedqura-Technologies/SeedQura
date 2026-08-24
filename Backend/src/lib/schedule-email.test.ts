import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { schedulePublishedEmail, sessionCancelledEmail, sessionRescheduledEmail } from "./mail.js";
import { formatDaysOfWeekLabel } from "./schedule-generator.js";

describe("schedulePublishedEmail", () => {
  const base = {
    name: "Ada Lovelace",
    courseName: "AI/ML Foundation",
    scheduleTitle: "Weekend Lab",
    courseDuration: "12 weeks",
    classDays: "Saturday, Sunday",
    classTime: "10:00 – 13:00",
    timezone: "Asia/Kolkata",
    instructor: "Dr. Faculty",
    meetingUrl: "https://meet.example.com/lab",
    location: "Online",
    sessionCount: 8,
    firstClassDate: "Sat, 5 Sept 2026",
    lastClassDate: "Sun, 27 Sept 2026",
  };

  it("includes required schedule fields in HTML and plain text", () => {
    const mail = schedulePublishedEmail(base);
    assert.match(mail.subject, /Schedule published/);
    assert.match(mail.subject, /Weekend Lab/);
    assert.match(mail.html, /AI\/ML Foundation/);
    assert.match(mail.html, /Weekend Lab/);
    assert.match(mail.html, /12 weeks/);
    assert.match(mail.html, /Saturday, Sunday/);
    assert.match(mail.html, /10:00/);
    assert.match(mail.html, /Asia\/Kolkata/);
    assert.match(mail.html, /Dr\. Faculty/);
    assert.match(mail.html, /meet\.example\.com/);
    assert.match(mail.html, /Online/);
    assert.match(mail.html, /Sessions[\s\S]*?>\s*8\s*</);
    assert.match(mail.html, /Sat, 5 Sept 2026/);
    assert.match(mail.html, /Sun, 27 Sept 2026/);
    assert.match(mail.html, /Sessions[\s\S]*?>\s*8\s*</);
    assert.match(mail.html, /dashboard/i);
    assert.ok(mail.text);
    assert.match(mail.text, /Course: AI\/ML Foundation/);
    assert.match(mail.text, /Number of sessions: 8/);
  });

  it("uses honest Google copy when google invites are active", () => {
    const mail = schedulePublishedEmail({
      ...base,
      calendarInviteSummary: "google",
    });
    assert.match(mail.html, /Google Calendar invitation/i);
    assert.doesNotMatch(mail.html, /not.*available/i);
  });

  it("uses honest ICS fallback copy when Google cannot invite", () => {
    const mail = schedulePublishedEmail({
      ...base,
      calendarInviteSummary: "ics_email",
    });
    assert.match(mail.html, /not.*available/i);
    assert.match(mail.html, /\.ics/i);
  });

  it("omits empty optional location and duration from text", () => {
    const mail = schedulePublishedEmail({
      ...base,
      courseDuration: "",
      location: "",
      meetingUrl: null,
      instructor: "",
    });
    assert.ok(mail.text);
    assert.doesNotMatch(mail.text, /Course duration:/);
    assert.doesNotMatch(mail.text, /Location:/);
    assert.doesNotMatch(mail.text, /Meeting URL:/);
    assert.doesNotMatch(mail.text, /Instructor:/);
    assert.match(mail.html, /Open dashboard/);
  });
});

describe("sessionCancelledEmail", () => {
  it("includes course, date, time, instructor, reason, and replacement copy", () => {
    const mail = sessionCancelledEmail({
      name: "Ada",
      courseName: "AI/ML Foundation",
      sessionTitle: "Weekend Lab",
      startsAt: "2026-09-19T04:30:00.000Z",
      endsAt: "2026-09-19T07:30:00.000Z",
      instructorName: "Dr. Faculty",
      cancellationReason: "Instructor unavailable",
      replacementPlanned: "yes",
      timezone: "Asia/Kolkata",
    });
    assert.match(mail.subject, /Class cancelled/i);
    assert.match(mail.html, /AI\/ML Foundation/);
    assert.match(mail.html, /Weekend Lab/);
    assert.match(mail.html, /Instructor unavailable/);
    assert.match(mail.html, /replacement session will be scheduled/i);
    assert.match(mail.text, /Original time:/);
    assert.match(mail.text, /Instructor: Dr\. Faculty/);
    assert.match(mail.text, /Other upcoming sessions/);
  });
});

describe("sessionRescheduledEmail", () => {
  it("includes previous and new schedule details", () => {
    const mail = sessionRescheduledEmail({
      name: "Ada",
      courseName: "AI/ML Foundation",
      sessionTitle: "Weekend Lab",
      previousStartsAt: "2026-09-12T04:30:00.000Z",
      previousEndsAt: "2026-09-12T07:30:00.000Z",
      newStartsAt: "2026-09-13T05:30:00.000Z",
      newEndsAt: "2026-09-13T08:30:00.000Z",
      instructorName: "Dr. Faculty",
      timezone: "Asia/Kolkata",
      note: "Venue conflict",
    });
    assert.match(mail.subject, /rescheduled/i);
    assert.match(mail.html, /Previous date/);
    assert.match(mail.html, /New date/);
    assert.match(mail.html, /Venue conflict/);
    assert.match(mail.text, /Previous:/);
    assert.match(mail.text, /New:/);
  });
});

describe("formatDaysOfWeekLabel", () => {
  it("formats JS weekdays for email copy", () => {
    assert.equal(formatDaysOfWeekLabel([6, 0]), "Sunday, Saturday");
    assert.equal(formatDaysOfWeekLabel([1, 2, 3, 4, 5]), "Monday, Tuesday, Wednesday, Thursday, Friday");
  });
});
