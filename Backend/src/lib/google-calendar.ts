import { google } from "googleapis";

export type CalendarSessionInput = {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string | null;
  location?: string | null;
  attendeeEmails: string[];
  googleEventId?: string | null;
};

function calendarConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_ID
  );
}

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

function eventBody(input: CalendarSessionInput) {
  const descriptionParts = [
    input.description || "",
    input.meetingUrl ? `Join: ${input.meetingUrl}` : "",
  ].filter(Boolean);

  return {
    summary: input.title,
    description: descriptionParts.join("\n\n"),
    location: input.location || input.meetingUrl || undefined,
    start: { dateTime: input.startsAt },
    end: { dateTime: input.endsAt },
    attendees: input.attendeeEmails.map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };
}

export async function upsertCalendarEvent(input: CalendarSessionInput): Promise<{
  ok: boolean;
  eventId?: string;
  skipped?: boolean;
  error?: string;
}> {
  if (!calendarConfigured()) {
    return { ok: true, skipped: true };
  }

  const auth = getAuth();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  if (!auth) return { ok: true, skipped: true };

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const body = eventBody(input);

    if (input.googleEventId) {
      const updated = await calendar.events.patch({
        calendarId,
        eventId: input.googleEventId,
        sendUpdates: "all",
        requestBody: body,
      });
      return { ok: true, eventId: updated.data.id || input.googleEventId };
    }

    const created = await calendar.events.insert({
      calendarId,
      sendUpdates: "all",
      requestBody: body,
    });
    return { ok: true, eventId: created.data.id || undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[google-calendar]", message);
    return { ok: false, error: message };
  }
}

export async function deleteCalendarEvent(googleEventId: string | null | undefined) {
  if (!calendarConfigured() || !googleEventId) {
    return { ok: true, skipped: true };
  }
  const auth = getAuth();
  const calendarId = process.env.GOOGLE_CALENDAR_ID!;
  if (!auth) return { ok: true, skipped: true };

  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId,
      eventId: googleEventId,
      sendUpdates: "all",
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[google-calendar delete]", message);
    return { ok: false, error: message };
  }
}

/** Build a simple ICS calendar invite (fallback when Google is unset). */
export function buildIcs(input: {
  uid: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  meetingUrl?: string | null;
  location?: string | null;
}): string {
  const stamp = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const desc = [input.description || "", input.meetingUrl || ""]
    .filter(Boolean)
    .join("\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Seedqura//LMS//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${input.uid}@seedqura`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(input.startsAt)}`,
    `DTEND:${stamp(input.endsAt)}`,
    `SUMMARY:${escapeIcs(input.title)}`,
    `DESCRIPTION:${escapeIcs(desc)}`,
    `LOCATION:${escapeIcs(input.location || input.meetingUrl || "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
