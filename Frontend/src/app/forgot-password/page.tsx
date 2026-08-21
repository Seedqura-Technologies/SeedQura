import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password — Seedqura" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center px-4 py-28">
      <ForgotPasswordForm />
    </main>
  );
}
