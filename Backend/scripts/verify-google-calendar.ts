import "dotenv/config";
import { google } from "googleapis";

const email = process.env.GOOGLE_CLIENT_EMAIL;
const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

console.log("email:", email);
console.log("calendarId:", calendarId);
console.log("key_ok:", Boolean(key?.includes("BEGIN PRIVATE KEY") && key.includes("\n")));

if (!email || !key) {
  console.error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY");
  process.exit(1);
}

const auth = new google.auth.JWT({
  email,
  key,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

try {
  const meta = await calendar.calendars.get({ calendarId });
  console.log("OK calendar:", meta.data.summary || "(no summary)", "id:", meta.data.id);

  const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const created = await calendar.events.insert({
    calendarId,
    sendUpdates: "none",
    requestBody: {
      summary: "Seedqura calendar connectivity test",
      description: "Safe to delete — API connectivity check",
      start: { dateTime: start },
      end: { dateTime: end },
    },
  });
  console.log("OK created event:", created.data.id);
  await calendar.events.delete({
    calendarId,
    eventId: created.data.id!,
  });
  console.log("OK deleted test event — Google Calendar is ready");
} catch (err) {
  console.error("FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
}
