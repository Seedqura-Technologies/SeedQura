"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LeafSilhouette } from "@/components/academy/BotanicalMarks";

export function AcademyHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`academy-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-[var(--academy-text)] transition-colors hover:text-[var(--academy-sage)]"
          >
            Seedqura
          </Link>
          <span className="text-[var(--academy-muted)]" aria-hidden>
            /
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--academy-text-muted)]">
            <LeafSilhouette className="h-4 w-3 text-[var(--academy-sage)]" opacity={0.85} />
            Learnings
          </span>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--academy-text-muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--academy-text)]"
        >
          <span aria-hidden>←</span>
          <span className="hidden sm:inline">Back to Seedqura</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>
    </header>
  );
}
