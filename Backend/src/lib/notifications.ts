import { getSupabaseAdmin } from "./supabase.js";

export async function createNotification(opts: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = getSupabaseAdmin();
  await admin.from("notifications").insert({
    user_id: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? "",
    metadata: opts.metadata ?? {},
  });
}
