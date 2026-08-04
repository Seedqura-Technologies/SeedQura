"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";

const links = [
  { href: "/dashboard", label: "Dashboard", tab: "home" },
  { href: "/dashboard?tab=products", label: "Products", tab: "products" },
  { href: "/dashboard?tab=purchased", label: "Purchased", tab: "purchased" },
];

export function DashboardShell({
  children,
  title,
  tab,
}: {
  children: React.ReactNode;
  title: string;
  tab: string;
}) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--glass-border)] bg-white/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo href="/" variant="header" />
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {links.map((l) => {
              const active = tab === l.tab;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2 ${
                    active ? "bg-white text-text shadow-sm" : "text-muted hover:text-text"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={logout}
              className="ml-2 rounded-lg px-3 py-2 text-muted hover:text-text"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-medium tracking-tight text-text">{title}</h1>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
