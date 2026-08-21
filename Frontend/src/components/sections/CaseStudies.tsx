"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const caseStudies = [
  {
    id: 1,
    title: "Crop Disease Early Detection",
    challenge: "Farmers losing 30% yield due to late disease identification across 500+ hectares.",
    solution: "Deployed drone + CV pipeline with Seedqura AI models for real-time disease mapping.",
    tech: ["Computer Vision", "YOLO", "Drone Analytics", "TensorFlow"],
    metrics: [{ label: "Accuracy", value: "96.4%" }, { label: "Fields", value: "500+" }, { label: "Cost Saved", value: "40%" }],
    impact: "Reduced crop loss by 35% in first season.",
  },
  {
    id: 2,
    title: "Hospital Medical Imaging AI",
    challenge: "Radiology backlog causing 48-hour diagnostic delays at tertiary hospital.",
    solution: "Integrated Seedqura medical imaging AI for X-ray and MRI triage support.",
    tech: ["Medical AI", "PyTorch", "OpenCV", "Cloud Platform"],
    metrics: [{ label: "Speed", value: "3x faster" }, { label: "Scans", value: "10K+" }, { label: "Accuracy", value: "94.8%" }],
    impact: "Cut diagnostic turnaround from 48h to 16h.",
  },
  {
    id: 3,
    title: "Precision Irrigation System",
    challenge: "Water waste and inconsistent irrigation across agricultural extension zones.",
    solution: "IoT sensor network + satellite data fused with AI prediction models.",
    tech: ["IoT", "Remote Sensing", "Edge AI", "GIS"],
    metrics: [{ label: "Water Saved", value: "28%" }, { label: "Sensors", value: "200+" }, { label: "ROI", value: "18 mo" }],
    impact: "Improved water efficiency across 1,200 hectares.",
  },
];

export function CaseStudies() {
  const [active, setActive] = useState(0);
  const study = caseStudies[active];

  return (
    <section id="case-studies" className="section-light py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          light
          label="Case Studies"
          title="Real Impact, Measurable Results"
          subtitle="How Seedqura AI solutions transform agriculture and healthcare in the field."
          align="center"
        />

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {caseStudies.map((cs, i) => (
            <button
              key={cs.id}
              type="button"
              onClick={() => setActive(i)}
              className="rounded-full px-5 py-2 text-sm font-medium transition-all"
              style={
                active === i
                  ? { background: "var(--accent)", color: "#030303", fontWeight: 700 }
                  : { background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }
              }
            >
              {cs.title}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mt-10"
          >
            <ScrollReveal>
              <div className="gradient-border glass-light grid gap-8 rounded-[24px] p-8 lg:grid-cols-2">
                <div>
                  <h3 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>{study.title}</h3>
                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>Challenge</p>
                      <p className="mt-1 text-muted">{study.challenge}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Solution</p>
                      <p className="mt-1 text-muted">{study.solution}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Technology</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {study.tech.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                  <div className="grid grid-cols-3 gap-4">
                    {study.metrics.map((m) => (
                      <div key={m.label} className="rounded-2xl p-4 text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>{m.value}</p>
                        <p className="mt-1 text-xs text-muted">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-2xl p-5" style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>Impact</p>
                    <p className="mt-2 font-medium" style={{ color: "var(--text)" }}>{study.impact}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
