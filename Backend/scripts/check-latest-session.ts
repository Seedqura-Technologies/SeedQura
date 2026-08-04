import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;
const apiBase = process.env.API_URL?.includes("onrender")
  ? process.env.API_URL
  : "https://seedqura.onrender.com";

const db = createClient(url, serviceKey);

console.log("=== 1) Latest course sessions in DB ===");
const { data: sessions, error: sErr } = await db
  .from("course_sessions")
  .select("id, course_id, title, starts_at, ends_at, status, google_event_id, meeting_url, instructor_name, created_at")
  .order("created_at", { ascending: false })
  .limit(10);
if (sErr) throw sErr;

if (!sessions?.length) {
  console.log("No sessions found in database.");
  process.exit(1);
}

for (const s of sessions) {
  console.log({
    id: s.id,
    title: s.title,
    course_id: s.course_id,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    status: s.status,
    google_event_id: s.google_event_id,
    created_at: s.created_at,
  });
}

const latest = sessions[0];
console.log("\n=== 2) Active enrollments for that course ===");
const { data: enrollments, error: eErr } = await db
  .from("enrollments")
  .select("id, status, payment_status, profile:profiles(full_name, email, status)")
  .eq("course_id", latest.course_id)
  .eq("status", "active");
if (eErr) throw eErr;
console.log("active_count:", enrollments?.length ?? 0);
for (const e of enrollments ?? []) {
  const p = Array.isArray(e.profile) ? e.profile[0] : e.profile;
  console.log(" student:", p?.full_name, p?.email, "profile_status:", p?.status);
}

console.log("\n=== 3) Google Calendar event lookup ===");
if (!latest.google_event_id) {
  console.log("FAIL: google_event_id is NULL — Google sync did not save an event id.");
  console.log("Likely causes: Render missing GOOGLE_* env vars, or sync skipped/failed when session was created.");
} else {
  const email = process.env.GOOGLE_CLIENT_EMAIL!;
  const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  const calendar = google.calendar({ version: "v3", auth });
  try {
    const ev = await calendar.events.get({
      calendarId,
      eventId: latest.google_event_id,
    });
    console.log("OK event found:", {
      id: ev.data.id,
      summary: ev.data.summary,
      start: ev.data.start,
      end: ev.data.end,
      attendees: (ev.data.attendees || []).map((a) => ({
        email: a.email,
        responseStatus: a.responseStatus,
      })),
      htmlLink: ev.data.htmlLink,
    });
  } catch (err) {
    console.log(
      "FAIL fetching Google event:",
      err instanceof Error ? err.message : err
    );
  }
}

console.log("\n=== 4) Production admin API (Render) ===");
const authClient = createClient(url, anon);
const { data: signIn, error: loginErr } = await authClient.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});
if (loginErr) {
  console.log("Admin login failed:", loginErr.message);
  process.exit(0);
}
const token = signIn.session?.access_token;
const res = await fetch(
  `${apiBase}/api/admin/courses/${latest.course_id}/sessions`,
  { headers: { Authorization: `Bearer ${token}` } }
);
console.log("API status:", res.status, apiBase);
const body = await res.json();
const apiSessions = body.sessions || [];
const match = apiSessions.find((s: { id: string }) => s.id === latest.id);
console.log("API latest session google_event_id:", match?.google_event_id ?? "(not found)");
console.log("API sessions count:", apiSessions.length);

console.log("\n=== Verdict ===");
if (latest.google_event_id) {
  console.log("PASS: Session has google_event_id — calendar sync ran.");
  if ((enrollments?.length ?? 0) === 0) {
    console.log("NOTE: No active enrollments — invites went to 0 students (event still on SA calendar).");
  } else {
    console.log("Students should have received Resend email + Google invite (Accept required).");
  }
} else {
  console.log("FAIL: Session exists but Google event was not linked.");
}
