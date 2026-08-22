import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

export const metadata = { title: "Forgot password — Seedqura" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-28">
      <ForgotPasswordForm />
      <LegalFooterLinks />
    </main>
  );
}
