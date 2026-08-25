"use client";

import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import {
  AcademyHeroVisual,
  BranchAccent,
  LeafSilhouette,
} from "@/components/academy/BotanicalMarks";

export function AcademyHero() {
  return (
    <section className="academy-hero">
      <div className="academy-hero-bg" aria-hidden />
      <LeafSilhouette
        className="academy-hide-mobile-deco academy-float pointer-events-none absolute left-[4%] top-[18%] h-40 w-28 text-[var(--academy-sage)]"
        opacity={0.1}
      />
      <BranchAccent
        className="academy-hide-mobile-deco pointer-events-none absolute right-[6%] top-[12%] w-48 text-[var(--academy-muted)]"
        opacity={0.12}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <ScrollReveal>
          <div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--academy-text)] md:text-5xl lg:text-[3.35rem]">
              Seedqura{" "}
              <span className="text-[var(--academy-sage)]">Learnings</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg font-medium leading-snug tracking-tight text-[var(--academy-text)] md:text-xl">
              Intelligence is a craft — not a shortcut.
            </p>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--academy-text-muted)] md:text-lg">
              Learn AI and machine learning from first principles, then go deeper
              where it matters most: medical intelligence, signal systems, and
              the discipline of building what can be trusted.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton href="#courses" variant="primary" className="!min-h-11">
                Browse courses
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </MagneticButton>
              <MagneticButton href="/#contact" variant="secondary" className="!min-h-11">
                Talk to us
              </MagneticButton>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="academy-hero-visual-wrap flex justify-center lg:justify-end">
          <AcademyHeroVisual />
        </ScrollReveal>
      </div>
    </section>
  );
}
