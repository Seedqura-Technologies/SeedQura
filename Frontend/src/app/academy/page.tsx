import Link from "next/link";
import { CourseCatalog } from "@/components/sections/ProductsPage";

export default function AcademyPage() {
  return (
    <>
      {/* Standalone Academy nav — no main-site chrome */}
      <header className="sticky top-0 z-50 border-b border-[var(--glass-border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Wordmark + Academy badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-text transition-colors hover:text-[var(--accent)]"
            >
              Seedqura
            </Link>
            <span className="text-[var(--text-faint)]">/</span>
            <span className="text-sm font-semibold text-[var(--accent)]">
              Academy
            </span>
          </div>

          {/* Back to main site */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] transition-colors hover:text-text"
          >
            <span>←</span>
            Back to Seedqura
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-20 md:pt-28 md:pb-20">
        {/* Ambient glow */}
        <div
          className="glow-orb glow-orb-green pointer-events-none absolute"
          style={{ width: 600, height: 600, top: "-20%", left: "40%" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <span className="eyebrow-pill">
            <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
            Seedqura Academy
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.10] tracking-[-0.03em] text-text md:text-6xl">
            Live cohorts for people<br />building with medical AI
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-muted)]">
            Weekend sessions on Google Meet. Short courses from ₹5k · flagship
            ~₹17k. The site is for purchase and account — teaching happens live.
          </p>
        </div>
      </section>

      {/* Full course catalog */}
      <CourseCatalog />

      {/* Minimal footer */}
      <footer className="border-t border-[var(--glass-border)] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-[var(--text-faint)] sm:flex-row">
            <span>© {new Date().getFullYear()} Seedqura Technologies LLP</span>
            <Link
              href="/"
              className="transition-colors hover:text-[var(--accent)]"
            >
              ← Return to Seedqura Research
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
