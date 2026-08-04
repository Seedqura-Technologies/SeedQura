"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

type Student = {
  id: string;
  full_name: string;
  email: string | null;
  status: string;
  created_at: string;
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const data = await apiFetch(`/admin/students?${params}`);
      setStudents(data.students || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStudentStatus(id: string, next: "active" | "suspended") {
    await apiFetch(`/admin/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    await load();
  }

  return (
    <AdminShell title="Students">
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email"
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-4 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-[var(--glass-border)] bg-white/60 px-4 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-accent px-4 py-2 text-sm text-white"
        >
          Filter
        </button>
      </div>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-[var(--glass-border)] bg-white/40">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--glass-border)] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-[var(--glass-border)]">
                <td className="px-4 py-3 text-text">{s.full_name || "—"}</td>
                <td className="px-4 py-3 text-muted">{s.email}</td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3 text-muted">
                  {s.created_at
                    ? new Date(s.created_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3 space-x-3">
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="text-accent"
                  >
                    View
                  </Link>
                  {s.status === "active" ? (
                    <button
                      type="button"
                      className="text-accent"
                      onClick={() => setStudentStatus(s.id, "suspended")}
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-accent"
                      onClick={() => setStudentStatus(s.id, "active")}
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
