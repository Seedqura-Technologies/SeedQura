"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const hotspots = [
  { id: 1, x: 30, y: 25, title: "Data Ingestion",   desc: "IoT, satellite, and medical data streams unified in real-time." },
  { id: 2, x: 70, y: 30, title: "Neural Processing", desc: "Deep learning models for vision, NLP, and predictive analytics." },
  { id: 3, x: 50, y: 55, title: "Edge AI",           desc: "On-device inference for fields, drones, and clinical environments." },
  { id: 4, x: 25, y: 70, title: "Insights Engine",   desc: "Actionable intelligence delivered to dashboards and APIs." },
  { id: 5, x: 75, y: 65, title: "Deployment",        desc: "Scalable cloud and on-premise deployment pipelines." },
];

const LINES: [number, number, number, number][] = [
  [30, 25, 50, 55],
  [70, 30, 50, 55],
  [50, 55, 25, 70],
  [50, 55, 75, 65],
  [30, 25, 70, 30],
];

export function AIPlatform() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="platform" className="section-dark relative py-24 md:py-32">
      {/* Background glow */}
      <div
        className="glow-orb glow-orb-green pointer-events-none absolute"
        style={{ width: 640, height: 640, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="AI Platform"
          title="The Seedqura intelligence engine"
          subtitle="A unified neural architecture connecting agricultural and healthcare data into actionable intelligence."
          align="center"
        />

        <ScrollReveal className="relative mx-auto mt-16 aspect-[16/10] max-w-4xl">
          <div
            className="gradient-border relative h-full w-full overflow-hidden rounded-[var(--radius-xl)]"
            style={{ background: "var(--surface-1)" }}
          >
            {/* Neural network lines */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              {LINES.map(([x1, y1, x2, y2], i) => (
                <motion.line
                  key={i}
                  x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                  stroke="rgba(34, 211, 165, 0.22)"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: i * 0.2 }}
                />
              ))}
            </svg>

            {/* Central hub */}
            <motion.div
              className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, var(--grad-a) 0%, var(--grad-c) 100%)",
                boxShadow: "0 0 40px rgba(34,211,165,0.28)",
              }}
              animate={{
                scale: [1, 1.06, 1],
                boxShadow: [
                  "0 0 40px rgba(34,211,165,0.22)",
                  "0 0 60px rgba(34,211,165,0.38)",
                  "0 0 40px rgba(34,211,165,0.22)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-base font-bold" style={{ color: "#030303" }}>AI</span>
            </motion.div>

            {/* Hotspots */}
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
                  <span
                    className="absolute h-full w-full animate-ping rounded-full"
                    style={{ background: "rgba(34,211,165,0.30)" }}
                  />
                  <span
                    className="relative h-3.5 w-3.5 rounded-full shadow-lg"
                    style={{
                      background: "var(--accent)",
                      boxShadow: "0 0 12px rgba(34,211,165,0.50)",
                    }}
                  />
                </button>

                {active === spot.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-1/2 top-full z-10 mt-2 w-52 -translate-x-1/2 rounded-xl p-3 text-left"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-glass)",
                    }}
                  >
                    <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                      {spot.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {spot.desc}
                    </p>
                  </motion.div>
                )}
              </div>
            ))}

            {/* Particle field */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full"
                style={{
                  left: `${10 + (i * 7) % 80}%`,
                  top: `${15 + (i * 11) % 70}%`,
                  background: "var(--accent)",
                }}
                animate={{ opacity: [0.15, 0.6, 0.15], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
              />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
