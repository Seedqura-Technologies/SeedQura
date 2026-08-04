"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

type Enrollment = {
  id: string;
  status: string;
  payment_status: string;
  created_at?: string;
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

function formatAmount(amount?: number, currency = "INR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    // Only students who completed payment successfully
    const data = await apiFetch("/admin/enrollments?payment_status=paid");
    setEnrollments(data.enrollments || []);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed")
    );
  }, []);

  async function setStatus(id: string, status: string) {
    await apiFetch(`/admin/enrollments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <AdminShell title="Enrollments">
      <p className="mb-6 text-sm text-muted">
        Showing only students with successful gateway payment. Paid enrollments
        are auto-activated — use Reject only to revoke access.
      </p>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-[var(--glass-border)] bg-white/40">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--glass-border)] text-muted">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Enrollment</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <Fragment key={e.id}>
                <tr className="border-b border-[var(--glass-border)]">
                  <td className="px-4 py-3">
                    <div>{e.profile?.full_name || "—"}</div>
                    <div className="text-xs text-muted">{e.profile?.email}</div>
                  </td>
                  <td className="px-4 py-3">{e.course?.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        e.status === "active"
                          ? "text-accent"
                          : e.status === "rejected"
                            ? "text-red-600"
                            : "text-muted"
                      }
                    >
                      {e.status === "active" ? "active (auto)" : e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{e.payment_status}</td>
                  <td className="px-4 py-3 space-x-3">
                    <button
                      type="button"
                      className="text-accent"
                      onClick={() =>
                        setExpanded(expanded === e.id ? null : e.id)
                      }
                    >
                      {expanded === e.id ? "Hide" : "Details"}
                    </button>
                    {e.status !== "rejected" && (
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => setStatus(e.id, "rejected")}
                      >
                        Reject
                      </button>
                    )}
                    {e.status === "rejected" && (
                      <button
                        type="button"
                        className="text-accent"
                        onClick={() => setStatus(e.id, "active")}
                      >
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
                {expanded === e.id && (
                  <tr className="border-b border-[var(--glass-border)] bg-white/30">
                    <td colSpan={5} className="px-4 py-4 text-sm">
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
                          <span className="text-muted">Student:</span>{" "}
                          {e.profile?.full_name} ({e.profile?.email})
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
                              {p.status} · {formatAmount(p.amount, p.currency)} ·{" "}
                              {p.razorpay_payment_id || "no gateway id"} ·{" "}
                              {new Date(p.created_at).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted">
                  No paid enrollments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
