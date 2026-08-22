import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Check your email — Seedqura" };

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; type?: string }>;
}) {
  const { email, type } = await searchParams;
  const isReset = type === "reset";

  return (
    <main className="flex min-h-screen items-center px-4 py-28">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-10 flex justify-center">
          <Logo href="/" variant="auth" />
        </div>
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Check your email
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {isReset ? (
            <>
              We sent a password reset link
              {email ? (
                <>
                  {" "}
                  to <span className="text-text">{email}</span>
                </>
              ) : null}
              . Open it to choose a new password.
            </>
          ) : (
            <>
              We sent a message
              {email ? (
                <>
                  {" "}
                  to <span className="text-text">{email}</span>
                </>
              ) : null}
              . Follow the instructions there, then log in.
            </>
          )}
        </p>
        <Link
          href="/login"
          className="mt-10 inline-block text-sm font-medium text-accent hover:text-text"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
