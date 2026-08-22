import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

export const metadata = { title: "Sign up — Seedqura" };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-28">
      <Suspense fallback={<p className="mx-auto text-muted">Loading…</p>}>
        <SignupForm />
      </Suspense>
      <LegalFooterLinks />
    </main>
  );
}
