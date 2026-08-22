"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";

export type AppShellLink = {
  href: string;
  label: string;
  active: boolean;
};

export function AppShell({
  children,
  title,
  links,
  badge,
  homeHref = "/",
}: {
  children: React.ReactNode;
  title: string;
  links: AppShellLink[];
  badge?: string;
  homeHref?: string;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="relative min-h-screen bg-bg text-text">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="glow-orb glow-orb-green absolute -left-32 top-0 h-[420px] w-[420px]" />
        <div className="glow-orb glow-orb-teal absolute -right-24 top-40 h-[360px] w-[360px]" />
        <div className="noise-overlay absolute inset-0" />
      </div>

      <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 ${
            scrolled
              ? "glass-light shadow-lg shadow-black/50"
              : "border border-transparent bg-transparent"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Logo href={homeHref} variant="header" />
            {badge && (
              <span className="eyebrow-pill hidden sm:inline-flex">{badge}</span>
            )}
          </div>

          <nav className="hidden items-center gap-1 text-sm md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={l.active ? "nav-link nav-link-active" : "nav-link"}
              >
                {l.label}
              </Link>
            ))}
            <button type="button" onClick={logout} className="nav-link ml-1">
              Log out
            </button>
          </nav>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl glass-light md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X className="h-5 w-5 text-text" />
            ) : (
              <Menu className="h-5 w-5 text-text" />
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="mx-auto mt-2 max-w-6xl rounded-2xl glass-light p-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-4 py-3 text-sm transition-colors ${
                    l.active
                      ? "bg-white/[0.07] text-text"
                      : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-text"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={logout}
                className="mt-1 rounded-lg px-4 py-3 text-left text-sm text-[var(--text-muted)] transition-colors hover:bg-white/[0.04] hover:text-text"
              >
                Log out
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8">
          {badge && (
            <p className="eyebrow-pill mb-4 inline-flex sm:hidden">{badge}</p>
          )}
          <h1 className="text-3xl font-medium tracking-tight text-text sm:text-4xl">
            {title}
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
}
