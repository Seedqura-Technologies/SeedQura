import { Suspense } from "react";
import { StudentDashboard } from "./DashboardClient";

export const metadata = { title: "Dashboard — Seedqura" };

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-loading min-h-screen bg-bg">Loading…</div>
      }
    >
      <StudentDashboard />
    </Suspense>
  );
}
