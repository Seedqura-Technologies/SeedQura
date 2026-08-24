"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/motion/PageTransition";
import { createClient } from "@/lib/supabase/client";

const pageLinks = [
  { label: "Home",     href: "/" },
  { label: "Research", href: "/research" },
  { label: "About",    href: "/about" },
];

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    // Local session read — avoid getUser network round trip on every marketing page
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null;
      setUserEmail(user?.email ?? null);
      if (user) {
        const metaRole = user.user_metadata?.role;
        if (metaRole === "admin" || metaRole === "student") {
          setRole(metaRole);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        setRole(profile?.role ?? "student");
      } else {
        setRole(null);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setUserEmail(null);
    setRole(null);
    router.push("/");
    router.refresh();
  }

  const hideChrome =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6">
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 ${
            scrolled
              ? "glass-light shadow-lg shadow-black/50"
              : "bg-transparent"
          }`}
        >
          <Logo href="/" variant="header" />

          <nav className="hidden items-center gap-1 lg:flex">
            {pageLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Academy — separate product, minimal pill */}
            <Link
              href="/academy"
              title="Seedqura Academy — courses & programs"
              className="ml-2 flex items-center gap-1.5 rounded-full border border-[var(--accent-border)] bg-[var(--accent-dim)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition-all hover:bg-[var(--accent)] hover:text-black"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Academy
            </Link>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {userEmail ? (
              <>
                <MagneticButton
                  href={role === "admin" ? "/admin" : "/dashboard"}
                  variant="secondary"
                  className="!min-h-10 !px-5 !py-2 !text-xs"
                >
                  {role === "admin" ? "Admin" : "Dashboard"}
                </MagneticButton>
                <MagneticButton
                  type="button"
                  onClick={logout}
                  variant="primary"
                  className="!min-h-10 !px-5 !py-2 !text-xs"
                >
                  Log out
                </MagneticButton>
              </>
            ) : (
              <MagneticButton
                href="/login"
                variant="primary"
                className="!min-h-10 !px-5 !py-2 !text-xs"
              >
                Login
              </MagneticButton>
            )}
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl glass-light lg:hidden"
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
          <div className="mx-auto mt-2 max-w-6xl rounded-2xl glass-light p-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {pageLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-white/[0.07] text-text"
                        : "text-[var(--text-muted)] hover:text-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {/* Academy pill — mobile */}
              <Link
                href="/academy"
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 py-3 text-sm font-semibold text-[var(--accent)]"
              >
                <GraduationCap className="h-4 w-4" />
                Academy — Courses & Programs
              </Link>

              <div className="mt-2 flex flex-col gap-2 px-2">
                {userEmail ? (
                  <>
                    <MagneticButton
                      href={role === "admin" ? "/admin" : "/dashboard"}
                      variant="secondary"
                      className="w-full"
                    >
                      {role === "admin" ? "Admin" : "Dashboard"}
                    </MagneticButton>
                    <MagneticButton
                      type="button"
                      onClick={logout}
                      variant="primary"
                      className="w-full"
                    >
                      Log out
                    </MagneticButton>
                  </>
                ) : (
                  <MagneticButton
                    href="/login"
                    variant="primary"
                    className="w-full"
                  >
                    Login
                  </MagneticButton>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>

      <Footer />
    </>
  );
}
