"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) {
      setError("Auth is not configured");
      setReady(true);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !cancelled) {
        setHasSession(true);
        setReady(true);
      }
    });

    (async () => {
      // Support older hash-based recovery links (#access_token=…&type=recovery)
      if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (!cancelled) {
            setHasSession(!error);
            setReady(true);
            window.history.replaceState(null, "", window.location.pathname);
          }
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setHasSession(Boolean(data.session));
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Auth is not configured");
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update password"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <p className="mx-auto text-center text-muted">Loading…</p>
    );
  }

  if (!hasSession) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-10 flex justify-center">
          <Logo href="/" variant="header" />
        </div>
        <h1 className="text-3xl font-medium tracking-tight text-text">
          Link expired
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This password reset link is invalid or has expired. Request a new one
          to continue.
        </p>
        <Link
          href="/forgot-password"
          className="mt-10 inline-block text-sm font-medium text-accent hover:text-text"
        >
          Request a new link
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
        Choose a new password
      </h1>
      <p className="mt-3 text-center text-sm text-muted">
        Enter a new password for your Seedqura account.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-10 space-y-5 rounded-2xl border border-white/6 bg-[var(--surface-1)] p-8"
      >
        <label className="block text-sm">
          <span className="text-muted">New password</span>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-premium pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-text"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </label>
        <label className="block text-sm">
          <span className="text-muted">Confirm password</span>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-premium mt-1.5"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <MagneticButton
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Saving…" : "Update password"}
        </MagneticButton>
      </form>
    </div>
  );
}
