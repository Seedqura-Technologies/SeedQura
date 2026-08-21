"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const technologies = [
  {
    title: "Artificial Intelligence",
    description: "Applied machine learning for crop intelligence and clinical decision support.",
  },
  {
    title: "Computer Vision",
    description: "Real-time visual intelligence for field monitoring and medical imaging.",
  },
  {
    title: "Remote Sensing",
    description: "Satellite and aerial analytics for large-scale agricultural insight.",
  },
  {
    title: "Healthcare Informatics",
    description: "Clinical pathways, diagnostics support, and hospital-grade integrations.",
  },
  {
    title: "Edge & IoT",
    description: "On-device inference and connected sensor networks for low-latency decisions.",
  },
  {
    title: "Cloud Systems",
    description: "Scalable infrastructure for training, inference, and secure data pipelines.",
  },
];

export function Technology() {
  return (
    <section id="technology" className="section-padding relative overflow-hidden">
      {/* Ambient right glow */}
      <div
        className="glow-orb glow-orb-teal pointer-events-none absolute"
        style={{ width: 500, height: 500, top: "10%", right: "-8%" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Technology"
          title="Core capabilities"
          subtitle="A focused stack — no noise, no filler. Every layer serves deployment in agriculture or medicine."
          align="center"
        />

        {/* Bento grid — separated by 1px accent dividers */}
        <div
          className="mt-20 grid gap-px sm:grid-cols-2 lg:grid-cols-3"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {technologies.map((tech, i) => (
            <ScrollReveal key={tech.title} delay={i * 0.06}>
              <div
                className="group relative flex flex-col gap-4 p-8 transition-all duration-300"
                style={{ background: "var(--bg-warm)" }}
              >
                {/* Hover radial glow */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at 25% 25%, rgba(62,207,142,0.08) 0%, transparent 65%)",
                  }}
                />
                {/* Top accent line */}
                <div
                  className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(62,207,142,0.55), transparent)",
                  }}
                />

                {/* Number badge */}
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold tabular-nums"
                  style={{
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent-border)",
                    color: "var(--accent)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div>
                  <h3 className="text-base font-semibold tracking-[-0.01em] text-text">
                    {tech.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-(--text-muted)">
                    {tech.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
