"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { TextureBackground } from "@/components/effects/TextureBackground";

const principles = [
  {
    title: "Research-first",
    description:
      "Rigorous, publication-oriented work backed by evidence — not marketing claims.",
  },
  {
    title: "Dual vertical",
    description:
      "Intelligent systems for agriculture and precision medicine, built with equal depth.",
  },
  {
    title: "Deployment-ready",
    description:
      "From lab to field to hospital — prototypes designed for real-world integration.",
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
              Building intelligent systems for the real world
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-muted md:text-xl">
              Seedqura is a research-focused technology company applying AI to
              agriculture and precision medicine — combining machine learning,
              computer vision, and domain expertise.
            </p>
          </div>
        ) : (
          <SectionHeading
            label="About"
            title="Building intelligent systems for the real world"
            subtitle="Seedqura is a research-focused technology company applying AI to agriculture and precision medicine — combining machine learning, computer vision, and domain expertise."
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
              To develop intelligent, evidence-based AI that improves outcomes in
              agriculture and healthcare through research and engineering excellence.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
