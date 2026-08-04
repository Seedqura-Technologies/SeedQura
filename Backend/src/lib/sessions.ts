import { getSupabaseAdmin } from "./supabase.js";
import { createNotification } from "./notifications.js";
import { sendMail, sessionScheduledEmail } from "./mail.js";
import {
  buildIcs,
  deleteCalendarEvent,
  upsertCalendarEvent,
} from "./google-calendar.js";

export type SessionRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  instructor_name: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string | null;
  location: string;
  status: string;
  google_event_id: string | null;
};

export async function getActiveEnrolledStudents(courseId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("enrollments")
    .select("user_id, profile:profiles(id, full_name, email, status)")
    .eq("course_id", courseId)
    .eq("status", "active");
  if (error) throw error;

  const students: { id: string; full_name: string; email: string }[] = [];
  for (const row of data ?? []) {
    const profile = row.profile as
      | { id: string; full_name: string; email: string | null; status: string }
      | { id: string; full_name: string; email: string | null; status: string }[]
      | null;
    const p = Array.isArray(profile) ? profile[0] : profile;
    if (!p?.email || p.status === "suspended") continue;
    students.push({
      id: p.id,
      full_name: p.full_name || "",
      email: p.email,
    });
  }
  return students;
}

export async function syncSessionCalendarAndNotify(opts: {
  session: SessionRow;
  courseName: string;
  action: "created" | "updated" | "cancelled";
}) {
  const students = await getActiveEnrolledStudents(opts.session.course_id);
  const emails = students.map((s) => s.email);

  let googleEventId = opts.session.google_event_id;

  if (opts.action === "cancelled") {
    await deleteCalendarEvent(googleEventId);
    googleEventId = null;
  } else {
    const cal = await upsertCalendarEvent({
      title: `${opts.courseName}: ${opts.session.title}`,
      description: [
        opts.session.description,
        opts.session.instructor_name
          ? `Instructor: ${opts.session.instructor_name}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      startsAt: opts.session.starts_at,
      endsAt: opts.session.ends_at,
      meetingUrl: opts.session.meeting_url,
      location: opts.session.location,
      attendeeEmails: emails,
      googleEventId,
    });
    if (cal.eventId) googleEventId = cal.eventId;
  }

  if (googleEventId !== opts.session.google_event_id) {
    const admin = getSupabaseAdmin();
    await admin
      .from("course_sessions")
      .update({
        google_event_id: googleEventId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opts.session.id);
  }

  const ics =
    opts.action === "cancelled"
      ? null
      : buildIcs({
          uid: opts.session.id,
          title: `${opts.courseName}: ${opts.session.title}`,
          description: opts.session.description,
          startsAt: opts.session.starts_at,
          endsAt: opts.session.ends_at,
          meetingUrl: opts.session.meeting_url,
          location: opts.session.location,
        });

  for (const student of students) {
    const mail = sessionScheduledEmail({
      name: student.full_name,
      courseName: opts.courseName,
      sessionTitle: opts.session.title,
      startsAt: opts.session.starts_at,
      endsAt: opts.session.ends_at,
      meetingUrl: opts.session.meeting_url,
      instructorName: opts.session.instructor_name,
      action: opts.action,
    });

    await sendMail({
      to: student.email,
      ...mail,
      attachments: ics
        ? [{ filename: "session.ics", content: ics }]
        : undefined,
    });

    await createNotification({
      userId: student.id,
      type: `session_${opts.action}`,
      title:
        opts.action === "cancelled"
          ? `Class cancelled: ${opts.session.title}`
          : `Class ${opts.action === "created" ? "scheduled" : "updated"}: ${opts.session.title}`,
      body: `${opts.courseName} · ${new Date(opts.session.starts_at).toLocaleString("en-IN")}`,
      metadata: {
        sessionId: opts.session.id,
        courseId: opts.session.course_id,
      },
    });
  }

  return {
    notified: students.length,
    googleEventId,
  };
}
