import { DateTime } from "luxon";
import {
  buildCalendarEventDescription,
  sessionEventSummary,
} from "./calendar-format.js";

const DEFAULT_TIMEZONE = () =>
  process.env.SESSION_TIMEZONE?.trim() || "Asia/Kolkata";

const DEFAULT_ORGANIZER = () => {
  const from = process.env.MAIL_FROM || "hello@seedqura.com";
  const match = from.match(/<([^>]+)>/);
  return {
    name: "Seedqura",
    email: match?.[1] || from.replace(/.*<|>.*/g, "") || "hello@seedqura.com",
  };
};

export type SessionIcsInput = {
  /** Stable session id — used for UID (one ICS per DB session). */
  sessionId: string;
  courseName: string;
  sessionTitle: string;
  sessionDetails?: string;
  instructorName?: string;
  startsAt: string;
  endsAt: string;
  timezone?: string;
  meetingUrl?: string | null;
  location?: string | null;
  attendeeEmails?: string[];
  organizerName?: string;
  organizerEmail?: string;
  /** Increment on updates so calendar clients replace the same event. */
  sequence?: number;
  method?: "REQUEST" | "CANCEL";
};

/** @deprecated Use buildSessionIcs — kept for scripts/tests. */
export type LegacyIcsInput = {
  uid: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string | null;
  location?: string | null;
  attendeeEmails?: string[];
  timezone?: string;
};

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** RFC 5545 UTC timestamp: YYYYMMDDTHHMMSSZ */
export function formatIcsUtcStamp(iso: string): string {
  return DateTime.fromISO(iso, { zone: "utc" })
    .toUTC()
    .toFormat("yyyyMMdd'T'HHmmss'Z'");
}

/** Local wall time + offset for VTIMEZONE / TZID properties. */
export function formatIcsLocalDateTime(isoUtc: string, timezone: string) {
  const zone = timezone.trim() || DEFAULT_TIMEZONE();
  const dt = DateTime.fromISO(isoUtc, { zone: "utc" }).setZone(zone);
  const offsetMin = dt.offset;
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const offset = `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}${String(abs % 60).padStart(2, "0")}`;
  return {
    tzid: zone,
    local: dt.toFormat("yyyyMMdd'T'HHmmss"),
    offset,
  };
}

/** Fold long lines at 75 octets (RFC 5545). */
export function foldIcsLines(content: string): string {
  const normalized = content.replace(/\r?\n/g, "\r\n");
  const lines = normalized.split("\r\n");
  const out: string[] = [];
  for (const line of lines) {
    if (line.length <= 75) {
      out.push(line);
      continue;
    }
    let rest = line;
    out.push(rest.slice(0, 75));
    rest = rest.slice(75);
    while (rest.length > 0) {
      out.push(` ${rest.slice(0, 74)}`);
      rest = rest.slice(74);
    }
  }
  return out.join("\r\n");
}

export function buildVTimezone(tzid: string, offset: string): string {
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${escapeIcs(tzid)}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    `TZOFFSETFROM:${offset}`,
    `TZOFFSETTO:${offset}`,
    `TZNAME:${escapeIcs(tzid)}`,
    "END:STANDARD",
    "END:VTIMEZONE",
  ].join("\r\n");
}

/**
 * Build one RFC 5545 VEVENT (.ics) for a single course session.
 * Individual events only — no RRULE (each session has its own row + Google event id).
 */
export function buildSessionIcs(input: SessionIcsInput): string {
  const timezone = input.timezone?.trim() || DEFAULT_TIMEZONE();
  const organizer = {
    name: input.organizerName || DEFAULT_ORGANIZER().name,
    email: input.organizerEmail || DEFAULT_ORGANIZER().email,
  };
  const method = input.method || "REQUEST";
  const isCancel = method === "CANCEL";
  const sequence = input.sequence ?? 0;

  const summary = sessionEventSummary(input.courseName, input.sessionTitle);
  const description = buildCalendarEventDescription({
    courseName: input.courseName,
    instructorName: input.instructorName,
    meetingUrl: input.meetingUrl,
    location: input.location,
    sessionDetails: input.sessionDetails,
  });

  const start = formatIcsLocalDateTime(input.startsAt, timezone);
  const end = formatIcsLocalDateTime(input.endsAt, timezone);
  const vtimezone = buildVTimezone(start.tzid, start.offset);

  const uid = `${input.sessionId}@seedqura.com`;
  const dtstamp = formatIcsUtcStamp(new Date().toISOString());
  const location = (input.location?.trim() || input.meetingUrl?.trim() || "").trim();
  const uniqueAttendees = [
    ...new Set(
      (input.attendeeEmails ?? [])
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  const eventLines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${start.tzid}:${start.local}`,
    `DTEND;TZID=${end.tzid}:${end.local}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    ...(location ? [`LOCATION:${escapeIcs(location)}`] : []),
    ...(input.meetingUrl?.trim() && !isCancel
      ? [`URL:${escapeIcs(input.meetingUrl.trim())}`]
      : []),
    `ORGANIZER;CN=${escapeIcs(organizer.name)}:mailto:${organizer.email}`,
    ...uniqueAttendees.map(
      (email) =>
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeIcs(email)}:mailto:${email}`
    ),
    `STATUS:${isCancel ? "CANCELLED" : "CONFIRMED"}`,
    `SEQUENCE:${sequence}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ];

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Seedqura//LMS//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    vtimezone,
    ...eventLines,
    "END:VCALENDAR",
  ].join("\r\n");

  return foldIcsLines(calendar);
}

/** Legacy wrapper — maps old buildIcs call sites to buildSessionIcs. */
export function buildIcs(input: LegacyIcsInput): string {
  return buildSessionIcs({
    sessionId: input.uid.replace(/@seedqura.*$/, ""),
    courseName: input.title.includes(" - ")
      ? input.title.split(" - ")[0]!
      : input.title,
    sessionTitle: input.title.includes(" - ")
      ? input.title.split(" - ").slice(1).join(" - ")
      : input.title,
    sessionDetails: input.description,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    timezone: input.timezone,
    meetingUrl: input.meetingUrl,
    location: input.location,
    attendeeEmails: input.attendeeEmails,
  });
}

export function buildSessionIcsAttachment(input: SessionIcsInput) {
  const content = buildSessionIcs(input);
  return {
    filename: `${input.sessionTitle.replace(/[^\w.-]+/g, "_").slice(0, 40) || "session"}.ics`,
    content,
  };
}
