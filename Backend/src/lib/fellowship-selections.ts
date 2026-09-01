import { getSupabaseAdmin } from "./supabase.js";

export const FELLOWSHIP_SEAT_CAP = 30;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FellowshipSelectionRow = {
  email: string;
  full_name: string | null;
  notes: string | null;
  selected_at: string;
  selected_by: string | null;
  revoked_at: string | null;
  selection_email_sent_at: string | null;
};

export function normalizeFellowshipEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function listActiveFellowshipSelections(): Promise<
  FellowshipSelectionRow[]
> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("fellowship_selections")
    .select(
      "email, full_name, notes, selected_at, selected_by, revoked_at, selection_email_sent_at"
    )
    .is("revoked_at", null)
    .order("selected_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function loadFellowshipAllowListEmails(): Promise<Set<string>> {
  const rows = await listActiveFellowshipSelections();
  return new Set(rows.map((r) => normalizeFellowshipEmail(r.email)));
}

export async function countActiveFellowshipSelections(): Promise<number> {
  const rows = await listActiveFellowshipSelections();
  return rows.length;
}

export async function addFellowshipSelection(opts: {
  email: string;
  fullName?: string;
  notes?: string;
  selectedBy: string;
}): Promise<FellowshipSelectionRow> {
  const email = normalizeFellowshipEmail(opts.email);
  if (!EMAIL_RE.test(email)) {
    throw new Error("Invalid email");
  }

  const admin = getSupabaseAdmin();
  const { data: existing, error: findErr } = await admin
    .from("fellowship_selections")
    .select(
      "email, full_name, notes, selected_at, selected_by, revoked_at, selection_email_sent_at"
    )
    .eq("email", email)
    .maybeSingle();
  if (findErr) throw findErr;

  const payload = {
    full_name: opts.fullName?.trim() || existing?.full_name || null,
    notes: opts.notes?.trim() || existing?.notes || null,
    selected_at: new Date().toISOString(),
    selected_by: opts.selectedBy,
    revoked_at: null,
  };

  if (existing) {
    const { data, error } = await admin
      .from("fellowship_selections")
      .update(payload)
      .eq("email", email)
      .select(
        "email, full_name, notes, selected_at, selected_by, revoked_at, selection_email_sent_at"
      )
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await admin
    .from("fellowship_selections")
    .insert({ email, ...payload })
    .select(
      "email, full_name, notes, selected_at, selected_by, revoked_at, selection_email_sent_at"
    )
    .single();
  if (error) throw error;
  return data;
}

export async function revokeFellowshipSelection(email: string): Promise<void> {
  const normalized = normalizeFellowshipEmail(email);
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("fellowship_selections")
    .update({ revoked_at: new Date().toISOString() })
    .eq("email", normalized)
    .is("revoked_at", null);
  if (error) throw error;
}

export async function markFellowshipSelectionEmailSent(
  email: string
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("fellowship_selections")
    .update({ selection_email_sent_at: new Date().toISOString() })
    .eq("email", normalizeFellowshipEmail(email));
  if (error) throw error;
}
