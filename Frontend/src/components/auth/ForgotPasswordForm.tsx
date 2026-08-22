"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";

function siteUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.seedqura.com"
  ).replace(/\/$/, "");
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Auth is not configured");

      const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send reset email"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[26rem]">
      <div className="rounded-2xl border border-white/8 bg-[var(--surface-1)] px-7 py-9 sm:px-9 sm:py-10">
        <div className="flex justify-center">
          <Logo href="/" variant="auth" />
        </div>

        {sent ? (
          <>
            <h1 className="mt-7 text-center text-2xl font-medium tracking-tight text-text">
              Check your email
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-muted">
              If an account exists for{" "}
              <span className="text-text">{email.trim()}</span>, we sent a link
              to reset your password.
            </p>
            <p className="mt-8 text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-accent hover:text-text"
              >
                Back to login
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-7 text-center text-2xl font-medium tracking-tight text-text">
              Reset password
            </h1>
            <p className="mt-2 text-center text-sm text-muted">
              Enter your account email and we&apos;ll send a reset link.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <label className="block text-sm">
                <span className="text-muted">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium mt-1.5"
                  placeholder="you@email.com"
                />
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="pt-2">
                <MagneticButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Sending…" : "Send reset link"}
                </MagneticButton>
              </div>
            </form>

            <p className="mt-6 text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-accent hover:text-text"
              >
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
