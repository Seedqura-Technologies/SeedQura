import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

export const metadata = { title: "Login — Seedqura" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-28">
      <Suspense fallback={<p className="mx-auto text-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
      <LegalFooterLinks />
    </main>
  );
}
