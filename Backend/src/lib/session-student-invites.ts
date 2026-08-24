import { getSupabaseAdmin } from "./supabase.js";
import type { CalendarInviteChannel } from "./google-calendar.js";

export type SessionStudentInviteChannel = "google" | "ics_email";

/** Load session IDs this user already received a calendar invite for. */
export async function getInvitedSessionIdsForUser(
  userId: string,
  sessionIds: string[]
): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("course_session_student_invites")
    .select("session_id")
    .eq("user_id", userId)
    .in("session_id", sessionIds);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.session_id as string));
}

export async function recordSessionStudentInvite(opts: {
  sessionId: string;
  userId: string;
  channel: SessionStudentInviteChannel;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("course_session_student_invites").upsert(
    {
      session_id: opts.sessionId,
      user_id: opts.userId,
      invite_channel: opts.channel,
      invited_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id", ignoreDuplicates: false }
  );
  if (error) throw error;
}

export async function recordSessionStudentInvites(opts: {
  sessionId: string;
  userIds: string[];
  channel: SessionStudentInviteChannel;
}): Promise<void> {
  if (opts.userIds.length === 0) return;
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const rows = opts.userIds.map((userId) => ({
    session_id: opts.sessionId,
    user_id: userId,
    invite_channel: opts.channel,
    invited_at: now,
  }));
  const { error } = await admin
    .from("course_session_student_invites")
    .upsert(rows, { onConflict: "session_id,user_id", ignoreDuplicates: true });
  if (error) throw error;
}

export type InvitedSessionRow = {
  sessionId: string;
  inviteChannel: SessionStudentInviteChannel;
};

/** Future scheduled sessions this user was invited to for a course. */
export async function listFutureInvitedSessionsForUser(
  userId: string,
  courseId: string,
  nowIso: string = new Date().toISOString()
): Promise<InvitedSessionRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("course_session_student_invites")
    .select(
      `session_id, invite_channel,
       session:course_sessions!inner(id, course_id, status, starts_at)`
    )
    .eq("user_id", userId);
  if (error) throw error;

  const out: InvitedSessionRow[] = [];
  for (const row of data ?? []) {
    const session = Array.isArray(row.session) ? row.session[0] : row.session;
    if (!session) continue;
    if (session.course_id !== courseId) continue;
    if (session.status !== "scheduled") continue;
    if (String(session.starts_at) < nowIso) continue;
    out.push({
      sessionId: row.session_id as string,
      inviteChannel: row.invite_channel as SessionStudentInviteChannel,
    });
  }
  return out;
}

/** Remove per-student invite record. Returns true when a row existed. */
export async function revokeSessionStudentInvite(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("course_session_student_invites")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/** Map session-level channel to per-student invite channel (or null if none). */
export function sessionChannelToStudentInvite(
  channel: CalendarInviteChannel | string | null | undefined
): SessionStudentInviteChannel | null {
  if (channel === "google") return "google";
  if (channel === "ics_email") return "ics_email";
  return null;
}
