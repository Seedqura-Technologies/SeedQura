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
            <span className="academy-badge inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--academy-sage)]" />
              Seedqura Academy
            </span>

            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--academy-text)] md:text-5xl lg:text-[3.35rem]">
              Live cohorts for people building with{" "}
              <span className="text-[var(--academy-sage)]">medical AI</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--academy-text-muted)] md:text-lg">
              Weekend sessions on Google Meet. Three hands-on labs at ₹4,999
              each. The site is for purchase and account — teaching happens
              live.
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
