"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const partners = [
  "GovTech India", "AIIMS Network", "ICAR", "IIT Research", "AgriCorp",
  "MedTech Labs", "BioInnovate", "FarmSense", "HealthAI", "DataHarvest",
];

export function Partners() {
  const [hovered, setHovered] = useState<string | null>(null);
  const doubled = [...partners, ...partners];

  return (
    <section className="section-light overflow-hidden py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading light label="Partners" title="Collaborating with Industry Leaders" align="center" />
      </div>
      <div className="relative mt-12">
        {/* Fade edges — must match section background */}
        <div
          className="absolute left-0 top-0 z-10 h-full w-24 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--surface-1), transparent)" }}
        />
        <div
          className="absolute right-0 top-0 z-10 h-full w-24 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--surface-1), transparent)" }}
        />
        <div className="flex animate-marquee gap-6">
          {doubled.map((name, i) => (
            <motion.div
              key={`${name}-${i}`}
              onHoverStart={() => setHovered(name)}
              onHoverEnd={() => setHovered(null)}
              whileHover={{ scale: 1.05, y: -3 }}
              className="flex shrink-0 cursor-default items-center rounded-2xl px-8 py-5 transition-all duration-300"
              style={{
                background: hovered === name ? "var(--accent-dim)" : "var(--surface-2)",
                border: `1px solid ${hovered === name ? "var(--accent-border)" : "var(--border)"}`,
              }}
            >
              <span
                className="whitespace-nowrap text-sm font-semibold transition-colors"
                style={{ color: hovered === name ? "var(--accent)" : "var(--text-muted)" }}
              >
                {name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
