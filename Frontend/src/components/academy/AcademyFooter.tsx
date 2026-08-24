import Link from "next/link";
import { LeafSilhouette } from "@/components/academy/BotanicalMarks";

export function AcademyFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-[var(--academy-border)] py-9">
      <LeafSilhouette
        className="pointer-events-none absolute bottom-2 right-6 h-16 w-12 text-[var(--academy-sage)] opacity-40 sm:right-10"
        opacity={0.2}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-[var(--academy-text-muted)] sm:flex-row sm:px-6 lg:px-8">
        <span>© {year} Seedqura Technologies LLP</span>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/terms" className="transition-colors hover:text-[var(--academy-sage)]">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-[var(--academy-sage)]">
            Privacy
          </Link>
          <Link
            href="/refund-policy"
            className="transition-colors hover:text-[var(--academy-sage)]"
          >
            Refunds
          </Link>
          <Link href="/" className="transition-colors hover:text-[var(--academy-sage)]">
            ← Research
          </Link>
        </div>
      </div>
    </footer>
  );
}
