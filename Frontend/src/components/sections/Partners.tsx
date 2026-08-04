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
        <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#F8FAFC] to-transparent" />
        <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#F8FAFC] to-transparent" />
        <div className="flex animate-marquee gap-6">
          {doubled.map((name, i) => (
            <motion.div
              key={`${name}-${i}`}
              onHoverStart={() => setHovered(name)}
              onHoverEnd={() => setHovered(null)}
              whileHover={{ scale: 1.08, y: -4 }}
              className={`flex shrink-0 cursor-default items-center rounded-2xl border px-8 py-5 transition-all duration-300 ${
                hovered === name
                  ? "border-green/40 bg-white shadow-xl shadow-green/15"
                  : "border-slate-200 bg-slate-100 grayscale"
              }`}
            >
              <span
                className={`font-heading whitespace-nowrap text-sm font-semibold transition-colors ${
                  hovered === name ? "text-green" : "text-navy/50"
                }`}
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
