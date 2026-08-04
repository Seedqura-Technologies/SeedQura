import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { syncSessionCalendarAndNotify, type SessionRow } from "../src/lib/sessions.ts";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const { data: session, error } = await db
  .from("course_sessions")
  .select("*")
  .eq("id", "80f5a34d-386b-4b93-9ad3-22d0ca7256f0")
  .single();
if (error || !session) throw error || new Error("session not found");

const { data: course } = await db
  .from("courses")
  .select("name")
  .eq("id", session.course_id)
  .maybeSingle();

console.log("Re-syncing session:", session.title);
console.log("GOOGLE configured:", Boolean(process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CALENDAR_ID));

const result = await syncSessionCalendarAndNotify({
  session: session as SessionRow,
  courseName: course?.name || session.course_id,
  action: session.google_event_id ? "updated" : "created",
});

console.log("result:", result);

const { data: refreshed } = await db
  .from("course_sessions")
  .select("id, title, google_event_id, starts_at, ends_at")
  .eq("id", session.id)
  .single();
console.log("refreshed:", refreshed);
