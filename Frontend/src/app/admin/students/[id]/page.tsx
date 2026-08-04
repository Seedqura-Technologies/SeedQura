"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

type Payment = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

type Enrollment = {
  id: string;
  status: string;
  payment_status: string;
  progress_pct: number;
  created_at: string;
  course?: { id: string; name: string; price_display?: string } | null;
  payments?: Payment[];
};

type Student = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  role: string;
  created_at: string;
};

function formatAmount(amount?: number, currency = "INR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function AdminStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const data = await apiFetch(`/admin/students/${params.id}`);
    setStudent(data.student);
    setEnrollments(data.enrollments || []);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function setStudentStatus(next: "active" | "suspended") {
    await apiFetch(`/admin/students/${params.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await load();
  }

  return (
    <AdminShell title={student?.full_name || "Student"}>
      <p className="mb-6 text-sm text-muted">
        <Link href="/admin/students" className="text-accent">
          ← Students
        </Link>
      </p>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {student && (
        <div className="glass-card mb-8 grid gap-3 p-6 md:grid-cols-2">
          <p>
            <span className="text-muted">Email:</span> {student.email || "—"}
          </p>
          <p>
            <span className="text-muted">Phone:</span> {student.phone || "—"}
          </p>
          <p>
            <span className="text-muted">Status:</span> {student.status}
          </p>
          <p>
            <span className="text-muted">Joined:</span>{" "}
            {new Date(student.created_at).toLocaleString()}
          </p>
          <div className="md:col-span-2">
            {student.status === "active" ? (
              <button
                type="button"
                className="rounded-xl border border-[var(--glass-border)] px-4 py-2 text-sm text-red-600"
                onClick={() => setStudentStatus("suspended")}
              >
                Suspend account
              </button>
            ) : (
              <button
                type="button"
                className="rounded-xl bg-accent px-4 py-2 text-sm text-white"
                onClick={() => setStudentStatus("active")}
              >
                Activate account
              </button>
            )}
          </div>
        </div>
      )}

      <h2 className="mb-4 text-lg font-medium text-text">
        Enrollments & payments
      </h2>
      <div className="space-y-4">
        {enrollments.map((e) => (
          <article
            key={e.id}
            className="rounded-2xl border border-[var(--glass-border)] bg-white/40 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-text">
                  {e.course?.name || e.course?.id || "Course"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Enrollment:{" "}
                  <span className="text-text">
                    {e.status === "active" && e.payment_status === "paid"
                      ? "active (auto-approved after payment)"
                      : e.status}
                  </span>
                  {" · "}
                  Payment: <span className="text-text">{e.payment_status}</span>
                  {" · "}
                  Progress: {e.progress_pct}%
                </p>
                <p className="text-xs text-muted">
                  Enrolled {new Date(e.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {(e.payments || []).map((p) => (
                <li key={p.id}>
                  Payment {p.status}: {formatAmount(p.amount, p.currency)}
                  {p.razorpay_payment_id
                    ? ` · ${p.razorpay_payment_id}`
                    : ""}
                  {" · "}
                  {new Date(p.created_at).toLocaleString()}
                </li>
              ))}
              {(e.payments || []).length === 0 && <li>No payments recorded</li>}
            </ul>
          </article>
        ))}
        {enrollments.length === 0 && (
          <p className="text-muted">No enrollments for this student.</p>
        )}
      </div>
    </AdminShell>
  );
}
