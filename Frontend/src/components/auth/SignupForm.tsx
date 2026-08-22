"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { postJson } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export function SignupForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      await postJson("/api/student/register", {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });

      const supabase = createClient();
      if (!supabase) {
        router.push(`/login?next=${encodeURIComponent(next)}&registered=1`);
        return;
      }
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (loginErr) {
        router.push(`/login?next=${encodeURIComponent(next)}&registered=1`);
        return;
      }

      router.replace(next);
      router.refresh();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Sign up failed";
      if (/already|exists|registered/i.test(raw)) {
        setError("An account with this email already exists. Try logging in.");
      } else {
        setError(raw);
      }
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
          Create account
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Already registered?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-medium text-accent hover:text-text"
          >
            Log in
          </Link>
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="text-muted">Full name</span>
            <input
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-premium mt-1.5"
            />
          </label>
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
            <span className="text-muted">Password</span>
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
          <div className="pt-2">
            <MagneticButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating…" : "Sign up"}
            </MagneticButton>
          </div>
        </form>
      </div>
    </div>
  );
}
