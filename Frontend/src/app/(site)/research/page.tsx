import type { Metadata } from "next";
import Link from "next/link";
import { AsciiTextureHero } from "@/components/effects/AsciiTextureHero";

export const metadata: Metadata = {
  title: "Research — Seedqura",
  description:
    "Seedqura research in precision medicine — NeuroVision and Sampoorna.",
};

export default function ResearchPage() {
  return (
    <>
      <AsciiTextureHero />
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--text-muted)" }}
              >
                NeuroVision
              </p>
              <h2
                className="mt-4 text-2xl font-semibold tracking-[-0.02em] md:text-3xl"
                style={{ color: "var(--text)" }}
              >
                Cerebral vasculature
              </h2>
              <p
                className="mt-4 text-sm leading-relaxed md:text-base"
                style={{ color: "var(--text-muted)" }}
              >
                Pre-op 3D comprehension of aneurysm spaces, AR for surgery and
                training, ML-assisted detection — built for clinicians and
                students.
              </p>
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--text-muted)" }}
              >
                Sampoorna
              </p>
              <h2
                className="mt-4 text-2xl font-semibold tracking-[-0.02em] md:text-3xl"
                style={{ color: "var(--text)" }}
              >
                Women&apos;s healthcare
              </h2>
              <p
                className="mt-4 text-sm leading-relaxed md:text-base"
                style={{ color: "var(--text-muted)" }}
              >
                One companion across period, habits, PCOS-oriented pathways, and
                breast health navigation — continuity instead of fragmented apps.
              </p>
            </div>
          </div>

          <div className="mt-14">
            <Link
              href="/#neurovision"
              className="text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--accent)" }}
            >
              See systems in motion →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
