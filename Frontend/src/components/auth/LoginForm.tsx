"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
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
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-10 flex justify-center">
        <Logo href="/" variant="header" />
      </div>
      <h1 className="text-center text-3xl font-medium tracking-tight text-text">
        Log in
      </h1>
      <p className="mt-3 text-center text-sm text-muted">
        New here?{" "}
        <Link
          href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-accent hover:text-text"
        >
          Create an account
        </Link>
      </p>

      <form onSubmit={onSubmit} className="glass-card mt-10 space-y-5 p-8">
        <label className="block text-sm">
          <span className="text-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[var(--glass-border)] bg-white/60 px-4 py-3 text-text outline-none focus:border-accent"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Password</span>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--glass-border)] bg-white/60 px-4 py-3 pr-12 text-text outline-none focus:border-accent"
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <MagneticButton
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Log in"}
        </MagneticButton>
      </form>
    </div>
  );
}
