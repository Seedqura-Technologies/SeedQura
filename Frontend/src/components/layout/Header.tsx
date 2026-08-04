"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Technology", href: "#technology" },
  { label: "Products", href: "#products" },
  { label: "Research", href: "#research" },
  { label: "Contact", href: "#contact" },
];

type HeaderProps = {
  homeHref?: string;
};

export function Header({ homeHref = "/" }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const anchorPrefix = homeHref === "/" ? "/" : "";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6">
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 ${
          scrolled ? "glass shadow-lg shadow-black/20" : "bg-transparent"
        }`}
      >
        <Logo href={homeHref} variant="header" />

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={`${anchorPrefix}${link.href}`}
              className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <MagneticButton
            href={`${anchorPrefix}#contact`}
            variant="secondary"
            className="!min-h-10 !px-5 !py-2 !text-xs"
          >
            Contact
          </MagneticButton>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl glass lg:hidden"
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
        <div className="mx-auto mt-2 max-w-6xl rounded-2xl glass p-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={`${anchorPrefix}${link.href}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm text-muted hover:text-text"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 px-2">
              <MagneticButton
                href={`${anchorPrefix}#contact`}
                variant="primary"
                className="w-full"
              >
                Contact
              </MagneticButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
