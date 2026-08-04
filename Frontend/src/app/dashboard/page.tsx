import { Suspense } from "react";
import { StudentDashboard } from "./DashboardClient";

export const metadata = { title: "Dashboard — Seedqura" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="p-10 text-muted">Loading…</p>}>
      <StudentDashboard />
    </Suspense>
  );
}
