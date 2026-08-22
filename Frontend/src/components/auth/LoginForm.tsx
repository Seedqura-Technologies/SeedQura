"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "Incorrect email or password.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email before logging in.";
  }
  if (m.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return message;
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const registered = search.get("registered") === "1";
  const reset = search.get("reset") === "1";
  const queryError = search.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    queryError ? friendlyAuthError(queryError) : ""
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Auth is not configured");
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) throw err;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role === "admin" && next === "/dashboard") {
          router.replace("/admin");
          router.refresh();
          return;
        }
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Login failed";
      setError(friendlyAuthError(raw));
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

        <h1 className="mt-7 text-center text-2xl font-medium tracking-tight text-text sm:text-[1.65rem]">
          Log in
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          New here?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-medium text-accent hover:text-text"
          >
            Create an account
          </Link>
        </p>

        {registered && (
          <p className="mt-5 rounded-xl border border-accent/20 bg-accent/5 px-3.5 py-2.5 text-center text-sm text-accent">
            Account created. Log in with your email and password.
          </p>
        )}
        {reset && (
          <p className="mt-5 rounded-xl border border-accent/20 bg-accent/5 px-3.5 py-2.5 text-center text-sm text-accent">
            Password updated. You can log in with your new password.
          </p>
        )}

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
            />
          </label>
          <label className="block text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Password</span>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-accent hover:text-text"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete="current-password"
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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="pt-2">
            <MagneticButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Log in"}
            </MagneticButton>
          </div>
        </form>
      </div>
    </div>
  );
}
