import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ApplyForm } from "@/components/forms/ApplyForm";
import { TextureBackground } from "@/components/effects/TextureBackground";

export const metadata: Metadata = {
  title: "Apply — Seedqura Academy",
  description:
    "Apply to Seedqura Academy — a research mentorship program in AI for agriculture and precision medicine.",
};

export default function ApplyPage() {
  return (
    <div className="relative flex min-h-full flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl glass-light px-4 py-3 sm:px-6">
          <Logo href="/" variant="header" />
          <Link
            href="/"
            className="text-sm text-muted transition-colors hover:text-text"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="relative flex-1 pt-28 pb-20">
        <TextureBackground variant="hero" className="!h-[50vh]" />
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-accent">
            Seedqura Academy
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-text md:text-5xl">
            Apply to Seedqura Academy
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Join our research mentorship program in AI for agriculture and
            precision medicine.
          </p>
          <div className="glass-card mt-12 p-6 md:p-10">
            <ApplyForm />
          </div>
        </div>
      </main>
    </div>
  );
}
