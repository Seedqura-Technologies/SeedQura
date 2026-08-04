"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
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
    <section id="technology" className="section-padding">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Technology"
          title="Core capabilities"
          subtitle="A focused stack — no noise, no filler. Every layer serves deployment in agriculture or medicine."
          align="center"
        />

        <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {technologies.map((tech, i) => (
            <ScrollReveal key={tech.title} delay={i * 0.06}>
              <GlassCard title={tech.title} description={tech.description} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
