"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { TextureBackground } from "@/components/effects/TextureBackground";

const principles = [
  {
    title: "Research-first",
    description:
      "Evidence before narrative — systems we can show, not claims we can’t defend.",
  },
  {
    title: "Two healthcare systems",
    description:
      "NeuroVision for cerebral vasculature. Sampoorna for women’s continuous care.",
  },
  {
    title: "Deployment-minded",
    description:
      "Built for surgeons, students, and real clinical pathways — not demos alone.",
  },
];

type AboutProps = {
  variant?: "section" | "page";
};

export function About({ variant = "section" }: AboutProps) {
  const isPage = variant === "page";

  return (
    <section
      id="about"
      className={`section-padding relative ${isPage ? "pt-32" : ""}`}
    >
      {isPage && <TextureBackground variant="section" />}

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {isPage ? (
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-accent">
              About
            </p>
            <h1 className="text-4xl font-medium leading-[1.15] tracking-tight text-text md:text-6xl">
              An independent lab for precision medicine
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-muted md:text-xl">
              Seedqura builds AI for cerebral vasculature and women&apos;s
              healthcare — NeuroVision and Sampoorna — with the discipline of
              research and the urgency of deployment.
            </p>
          </div>
        ) : (
          <SectionHeading
            label="About"
            title="An independent lab for precision medicine"
            subtitle="Seedqura builds AI for cerebral vasculature and women's healthcare — NeuroVision and Sampoorna."
            align="center"
          />
        )}

        <div className={`grid gap-6 md:grid-cols-3 ${isPage ? "mt-24" : "mt-20"}`}>
          {principles.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 0.1}>
              <GlassCard title={item.title} description={item.description} />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-24">
          <div className="glass-card mx-auto max-w-3xl p-10 text-center md:p-14">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent-warm">
              Mission
            </p>
            <p className="mt-6 text-xl leading-relaxed text-text md:text-2xl">
              Help clinicians and students see what flat imaging can&apos;t —
              and give women one continuous place for care that is usually
              scattered.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
