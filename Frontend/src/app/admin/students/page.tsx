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
          className="input-premium max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-premium max-w-[12rem]"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="button" onClick={load} className="btn-admin btn-admin-primary">
          Filter
        </button>
      </div>
      {error && <p className="mb-4 text-error">{error}</p>}
      <div className="table-shell">
        <table>
          <thead>
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
              <tr key={s.id}>
                <td className="px-4 py-3 text-text">{s.full_name || "—"}</td>
                <td className="px-4 py-3 text-muted">{s.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      s.status === "active" ? "text-accent" : "text-muted"
                    }
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">
                  {s.created_at
                    ? new Date(s.created_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="space-x-3 px-4 py-3">
                  <Link href={`/admin/students/${s.id}`} className="text-accent">
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
