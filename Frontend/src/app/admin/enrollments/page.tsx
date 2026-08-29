"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

type Enrollment = {
  id: string;
  status: string;
  payment_status: string;
  created_at?: string;
  utr?: string | null;
  institution?: string | null;
  degree?: string | null;
  year_of_study?: string | null;
  applicant_phone?: string | null;
  applicant_name?: string | null;
  utr_submitted_at?: string | null;
  course?: { id: string; name: string } | null;
  profile?: { id: string; full_name: string; email: string | null } | null;
  payments?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    razorpay_payment_id: string | null;
    created_at: string;
  }[];
};

type Filter = "awaiting_verification" | "paid" | "all";

function formatAmount(amount?: number, currency = "INR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function displayName(e: Enrollment) {
  return e.applicant_name || e.profile?.full_name || "—";
}

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState<Filter>("awaiting_verification");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (paymentStatus: Filter) => {
    const q =
      paymentStatus === "all"
        ? "payment_status=all"
        : `payment_status=${paymentStatus}`;
    const data = await apiFetch(`/admin/enrollments?${q}`);
    setEnrollments(data.enrollments || []);
  }, []);

  useEffect(() => {
    load(filter).catch((err) =>
      setError(err instanceof Error ? err.message : "Failed")
    );
  }, [filter, load]);

  async function setStatus(id: string, status: string) {
    if (status === "active") {
      const ok = window.confirm(
        "Approve this enrollment? The student will get access and an email."
      );
      if (!ok) return;
    }
    setBusyId(id);
    setError("");
    try {
      await apiFetch(`/admin/enrollments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function copyUtr(utr: string) {
    try {
      await navigator.clipboard.writeText(utr);
    } catch {
      setError("Couldn’t copy UTR — select it manually.");
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "awaiting_verification", label: "Awaiting verification" },
    { id: "paid", label: "Paid" },
    { id: "all", label: "All" },
  ];

  return (
    <AdminShell title="Enrollments">
      <p className="mb-4 text-sm text-muted">
        Match UTR in GPay / bank, then Approve to activate. Reject if payment
        cannot be verified. For filtered CSV downloads, use{" "}
        <a href="/admin/export" className="text-accent hover:underline">
          Export
        </a>
        .
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              filter === f.id
                ? "bg-accent/20 text-accent"
                : "text-muted hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-error">{error}</p>}
      <div className="table-shell overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">UTR</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => {
              const pay = e.payments?.[0];
              return (
                <Fragment key={e.id}>
                  <tr>
                    <td className="px-4 py-3">
                      <div>{displayName(e)}</div>
                      <div className="text-xs text-muted">
                        {e.profile?.email}
                      </div>
                      {e.applicant_phone && (
                        <div className="text-xs text-muted">
                          {e.applicant_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{e.course?.name}</div>
                      <div className="text-xs text-muted">
                        Expected: {formatAmount(pay?.amount, pay?.currency)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {e.utr ? (
                        <button
                          type="button"
                          className="font-mono text-sm tracking-wide text-accent hover:text-text"
                          title="Click to copy"
                          onClick={() => copyUtr(e.utr!)}
                        >
                          {e.utr}
                        </button>
                      ) : (
                        <span className="font-mono text-sm tracking-wide">—</span>
                      )}
                      {e.utr_submitted_at && (
                        <div className="mt-1 text-xs text-muted">
                          {new Date(e.utr_submitted_at).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{e.institution || "—"}</div>
                      <div className="text-xs text-muted">
                        {[e.degree, e.year_of_study].filter(Boolean).join(" · ") ||
                          "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={
                          e.payment_status === "awaiting_verification"
                            ? "text-amber-400"
                            : e.payment_status === "paid"
                              ? "text-accent"
                              : "text-muted"
                        }
                      >
                        {e.payment_status}
                      </div>
                      <div className="text-xs text-muted">{e.status}</div>
                    </td>
                    <td className="space-x-3 px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        className="text-muted hover:text-text"
                        onClick={() =>
                          setExpanded(expanded === e.id ? null : e.id)
                        }
                      >
                        {expanded === e.id ? "Hide" : "More"}
                      </button>
                      {e.payment_status === "awaiting_verification" && (
                        <>
                          <button
                            type="button"
                            className="text-accent"
                            disabled={busyId === e.id}
                            onClick={() => setStatus(e.id, "active")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="text-error"
                            disabled={busyId === e.id}
                            onClick={() => setStatus(e.id, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {e.payment_status === "paid" &&
                        e.status !== "rejected" && (
                          <button
                            type="button"
                            className="text-error"
                            disabled={busyId === e.id}
                            onClick={() => setStatus(e.id, "rejected")}
                          >
                            Reject
                          </button>
                        )}
                      {e.status === "rejected" && (
                        <button
                          type="button"
                          className="text-accent"
                          disabled={busyId === e.id}
                          onClick={() => setStatus(e.id, "active")}
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === e.id && (
                    <tr className="table-row-expanded">
                      <td colSpan={6} className="px-4 py-4 text-sm">
                        <div className="grid gap-2 md:grid-cols-2">
                          <p>
                            <span className="text-muted">Enrollment ID:</span>{" "}
                            {e.id}
                          </p>
                          <p>
                            <span className="text-muted">Created:</span>{" "}
                            {e.created_at
                              ? new Date(e.created_at).toLocaleString()
                              : "—"}
                          </p>
                          <p>
                            <span className="text-muted">Applicant:</span>{" "}
                            {displayName(e)} ({e.profile?.email})
                          </p>
                          <p>
                            <span className="text-muted">Course:</span>{" "}
                            {e.course?.name} ({e.course?.id})
                          </p>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs uppercase tracking-widest text-muted">
                            Payments
                          </p>
                          {(e.payments || []).length === 0 && (
                            <p className="mt-2 text-muted">No payment rows</p>
                          )}
                          <ul className="mt-2 space-y-1">
                            {(e.payments || []).map((p) => (
                              <li key={p.id} className="text-muted">
                                {p.status} ·{" "}
                                {formatAmount(p.amount, p.currency)} ·{" "}
                                {p.razorpay_payment_id || "UPI / UTR"} ·{" "}
                                {new Date(p.created_at).toLocaleString()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-muted">
                  {filter === "awaiting_verification"
                    ? "No UTR submissions waiting for approval."
                    : "No enrollments in this view."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
