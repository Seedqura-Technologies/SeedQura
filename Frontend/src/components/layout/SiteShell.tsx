"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/motion/PageTransition";
import { createClient } from "@/lib/supabase/client";

const pageLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Research", href: "/research" },
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
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setUserEmail(user?.email ?? null);
      if (user) {
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
    await supabase.auth.signOut();
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
            scrolled ? "glass-light shadow-lg" : "bg-transparent"
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
                    className={`rounded-lg px-4 py-3 text-sm ${
                      isActive
                        ? "bg-white/60 text-text"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
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
