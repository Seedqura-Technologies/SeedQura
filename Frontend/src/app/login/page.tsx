import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Login — Seedqura" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center px-4 py-28">
      <Suspense fallback={<p className="mx-auto text-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
