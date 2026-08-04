"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const hotspots = [
  { id: 1, x: 30, y: 25, title: "Data Ingestion", desc: "IoT, satellite, and medical data streams unified in real-time." },
  { id: 2, x: 70, y: 30, title: "Neural Processing", desc: "Deep learning models for vision, NLP, and predictive analytics." },
  { id: 3, x: 50, y: 55, title: "Edge AI", desc: "On-device inference for fields, drones, and clinical environments." },
  { id: 4, x: 25, y: 70, title: "Insights Engine", desc: "Actionable intelligence delivered to dashboards and APIs." },
  { id: 5, x: 75, y: 65, title: "Deployment", desc: "Scalable cloud and on-premise deployment pipelines." },
];

export function AIPlatform() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="platform" className="section-dark relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="AI Platform"
          title="The Seedqura Intelligence Engine"
          subtitle="A unified neural architecture connecting agricultural and healthcare data into actionable intelligence."
          align="center"
        />

        <ScrollReveal className="relative mx-auto mt-16 aspect-[16/10] max-w-4xl">
          <div className="gradient-border glass relative h-full w-full overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 bg-gradient-to-br from-green/10 via-transparent to-blue/10" />

            {/* Neural network lines */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              {[
                [30, 25, 50, 55], [70, 30, 50, 55], [50, 55, 25, 70],
                [50, 55, 75, 65], [30, 25, 70, 30],
              ].map(([x1, y1, x2, y2], i) => (
                <motion.line
                  key={i}
                  x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                  stroke="rgba(34,197,94,0.3)"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: i * 0.2 }}
                />
              ))}
            </svg>

            {/* Central brain */}
            <motion.div
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-green to-blue shadow-2xl shadow-green/30"
              animate={{ scale: [1, 1.08, 1], boxShadow: ["0 0 40px rgba(34,197,94,0.3)", "0 0 60px rgba(34,197,94,0.5)", "0 0 40px rgba(34,197,94,0.3)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex h-full items-center justify-center text-2xl font-bold text-white">AI</div>
            </motion.div>

            {hotspots.map((spot) => (
              <div
                key={spot.id}
                className="absolute"
                style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <button
                  type="button"
                  className="group relative flex h-8 w-8 items-center justify-center"
                  onMouseEnter={() => setActive(spot.id)}
                  onMouseLeave={() => setActive(null)}
                  aria-label={spot.title}
                >
                  <span className="absolute h-full w-full animate-ping rounded-full bg-green/40" />
                  <span className="relative h-4 w-4 rounded-full bg-green shadow-lg shadow-green/50" />
                </button>
                {active === spot.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-xl glass p-3 text-left"
                  >
                    <p className="text-xs font-semibold text-green">{spot.title}</p>
                    <p className="mt-1 text-xs text-white/60">{spot.desc}</p>
                  </motion.div>
                )}
              </div>
            ))}

            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-cyan/60"
                style={{ left: `${10 + (i * 7) % 80}%`, top: `${15 + (i * 11) % 70}%` }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
              />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
