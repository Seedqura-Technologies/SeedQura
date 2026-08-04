"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminHomePage() {
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    enrollments: 0,
    paidEnrollments: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/admin/stats")
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );
  }, []);

  return (
    <AdminShell title="Admin">
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Students", stats.students],
          ["Courses", stats.courses],
          ["Enrollments", stats.enrollments],
          ["Paid", stats.paidEnrollments],
        ].map(([label, value]) => (
          <div key={String(label)} className="glass-card p-6">
            <p className="text-xs uppercase tracking-widest text-muted">
              {label}
            </p>
            <p className="mt-3 text-3xl font-medium text-text">{value}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
