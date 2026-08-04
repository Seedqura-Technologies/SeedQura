import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Sign up — Seedqura" };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center px-4 py-28">
      <Suspense fallback={<p className="mx-auto text-muted">Loading…</p>}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
