import { Suspense } from "react";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export const metadata = { title: "Update password — Seedqura" };

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-screen items-center px-4 py-28">
      <Suspense fallback={<p className="mx-auto text-muted">Loading…</p>}>
        <UpdatePasswordForm />
      </Suspense>
    </main>
  );
}
