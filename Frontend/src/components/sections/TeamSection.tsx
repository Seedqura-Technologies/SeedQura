"use client";

import { getTeamMembers } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const skillsMap: Record<string, string[]> = {
  "1": ["Applied AI", "Research", "Publications"],
  "2": ["Systems", "MLOps", "Product"],
  "3": ["Medical Imaging", "CV", "Deep Learning"],
  "4": ["Agricultural AI", "Remote Sensing", "GIS"],
  "5": ["Healthcare NLP", "Clinical AI", "LLMs"],
  "6": ["Operations", "Community", "Programs"],
};

export function TeamSection() {
  const members = getTeamMembers();

  return (
    <section className="section-padding relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Team"
          title="The minds behind Seedqura"
          subtitle="Researchers, engineers, and innovators driving the future of AI in agriculture and medicine."
          align="center"
        />

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, i) => (
            <ScrollReveal key={member.id} delay={i * 0.08}>
              <article className="glass-card flex h-full flex-col p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-lg font-medium text-accent">
                  {member.initials}
                </div>
                <h3 className="text-lg font-medium text-text">{member.name}</h3>
                <p className="mt-1 text-sm font-medium text-accent">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{member.bio}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {(skillsMap[member.id] || []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[var(--glass-border)] bg-white/40 px-2.5 py-1 text-xs text-muted"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
