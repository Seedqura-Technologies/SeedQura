"use client";

import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ScheduleManagerDashboard } from "@/components/admin/ScheduleManagerDashboard";

export default function AdminSchedulesPage() {
  return (
    <AdminShell title="Schedule Manager">
      <Suspense
        fallback={
          <p className="text-sm text-muted">Loading schedule dashboard…</p>
        }
      >
        <ScheduleManagerDashboard />
      </Suspense>
    </AdminShell>
  );
}
