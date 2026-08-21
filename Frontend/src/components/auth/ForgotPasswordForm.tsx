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

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-10 flex justify-center">
          <Logo href="/" variant="header" />
        </div>
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Check your email
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          If an account exists for{" "}
          <span className="text-text">{email.trim()}</span>, we sent a link to
          reset your password. The link expires after a short time.
        </p>
        <Link
          href="/login"
          className="mt-10 inline-block text-sm font-medium text-accent transition-colors hover:text-text"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-10 flex justify-center">
        <Logo href="/" variant="header" />
      </div>
      <h1 className="text-center text-3xl font-medium tracking-tight text-text">
        Reset password
      </h1>
      <p className="mt-3 text-center text-sm text-muted">
        Enter your account email and we&apos;ll send a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5 rounded-2xl border border-white/6 bg-[var(--surface-1)] p-8">
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
        <MagneticButton
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Sending…" : "Send reset link"}
        </MagneticButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-accent hover:text-text">
          Back to login
        </Link>
      </p>
    </div>
  );
}
