"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

type Selection = {
  email: string;
  full_name: string | null;
  notes: string | null;
  selected_at: string;
  selection_email_sent_at: string | null;
};

export default function AdminFellowshipPage() {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [seatCount, setSeatCount] = useState(0);
  const [seatCap, setSeatCap] = useState(30);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await apiFetch("/admin/fellowship-selections");
    setSelections(data.selections || []);
    setSeatCount(data.seatCount ?? 0);
    setSeatCap(data.seatCap ?? 30);
  }, []);

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load")
    );
  }, [load]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiFetch("/admin/fellowship-selections", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim() || undefined,
          notes: notes.trim() || undefined,
          sendEmail,
        }),
      });
      setEmail("");
      setFullName("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add selection");
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(targetEmail: string) {
    const ok = window.confirm(
      `Revoke payment access for ${targetEmail}? They will not be able to pay until re-selected.`
    );
    if (!ok) return;
    setRevoking(targetEmail);
    setError("");
    try {
      await apiFetch(
        `/admin/fellowship-selections/${encodeURIComponent(targetEmail)}`,
        { method: "DELETE" }
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <AdminShell title="Research Fellowship">
      <div className="space-y-8">
        <div className="rounded-2xl border border-white/8 bg-[var(--surface-1)] p-6">
          <p className="text-sm text-muted">
            Add the <span className="text-text">Seedqura login email</span> for
            each selected candidate. They can pay immediately. Optional: send
            the payment link by email.
          </p>
          <p className="mt-3 text-sm font-medium text-text">
            Seats: {seatCount} / {seatCap}
          </p>
        </div>

        <form
          onSubmit={onAdd}
          className="space-y-4 rounded-2xl border border-white/8 bg-[var(--surface-1)] p-6"
        >
          <h2 className="text-lg font-medium text-text">Select candidate</h2>
          <label className="block text-sm">
            <span className="text-muted">Login email (required)</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="input-premium mt-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Name (optional)</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-premium mt-1.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Notes (optional)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Track, group, etc."
              className="input-premium mt-1.5"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              Email payment link to candidate (₹19,999 · sign in with this
              email)
            </span>
          </label>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add to allow-list"}
          </button>
        </form>

        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/8 bg-[var(--surface-1)] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Selected</th>
                <th className="px-4 py-3 font-medium">Offer email</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {selections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No selected candidates yet.
                  </td>
                </tr>
              ) : (
                selections.map((row) => (
                  <tr key={row.email} className="border-b border-white/5">
                    <td className="px-4 py-3 font-mono text-text">
                      {row.email}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {row.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(row.selected_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {row.selection_email_sent_at
                        ? new Date(row.selection_email_sent_at).toLocaleString()
                        : "Not sent"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={revoking === row.email}
                        onClick={() => onRevoke(row.email)}
                        className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        {revoking === row.email ? "Revoking…" : "Revoke"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
