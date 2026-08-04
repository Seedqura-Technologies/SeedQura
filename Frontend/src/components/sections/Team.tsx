"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Mail } from "lucide-react";
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

export function Team() {
  const members = getTeamMembers();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="team" className="section-navy relative py-24 md:py-32">
      <div className="noise-overlay absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Our Team"
          title="The Minds Behind Seedqura"
          subtitle="Researchers, engineers, and innovators driving the future of AI."
          align="center"
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, i) => (
            <ScrollReveal key={member.id} delay={i * 0.08}>
              <motion.div
                onHoverStart={() => setHovered(member.id)}
                onHoverEnd={() => setHovered(null)}
                whileHover={{ y: -8 }}
                className="gradient-border glass relative overflow-hidden rounded-[24px] p-6 text-center"
              >
                <motion.div
                  animate={{ scale: hovered === member.id ? 1.1 : 1 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green/30 to-blue/30 text-xl font-bold text-white"
                >
                  {member.initials}
                </motion.div>
                <h3 className="font-heading text-lg font-bold text-white">{member.name}</h3>
                <p className="mt-1 text-sm font-medium text-green">{member.role}</p>
                <p className="mt-2 text-sm text-white/50">{member.bio}</p>

                <motion.div
                  initial={false}
                  animate={{ height: hovered === member.id ? "auto" : 0, opacity: hovered === member.id ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-white/10 pt-4">
                    {(skillsMap[member.id] || []).map((skill) => (
                      <span key={skill} className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <Share2 className="h-3 w-3" /> LinkedIn
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <Mail className="h-3 w-3" /> Email
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
