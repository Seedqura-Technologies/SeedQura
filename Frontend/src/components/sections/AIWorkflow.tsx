"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Cloud,
  Cpu,
  Plane,
  Radio,
  Satellite,
  Stethoscope,
  User,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const pipeline = [
  { icon: Satellite, title: "Satellite", desc: "Multispectral imagery & remote sensing data capture from orbit.", color: "#06B6D4" },
  { icon: Plane, title: "Drone", desc: "Aerial surveys and high-resolution field mapping.", color: "#22C55E" },
  { icon: Radio, title: "IoT Sensors", desc: "Real-time soil, weather, and crop health monitoring.", color: "#2563EB" },
  { icon: Cpu, title: "Computer Vision", desc: "Image analysis, object detection, and disease identification.", color: "#06B6D4" },
  { icon: Brain, title: "Artificial Intelligence", desc: "Deep learning models for prediction and decision support.", color: "#22C55E" },
  { icon: Cloud, title: "Cloud Platform", desc: "Scalable processing, storage, and model deployment.", color: "#2563EB" },
  { icon: Stethoscope, title: "Decision Support", desc: "Actionable insights for clinicians and agronomists.", color: "#06B6D4" },
  { icon: User, title: "Farmer / Doctor", desc: "End-user delivery via dashboards, alerts, and reports.", color: "#22C55E" },
];

export function AIWorkflow() {
  const [active, setActive] = useState(0);

  return (
    <section id="workflow" className="section-navy relative py-24 md:py-32">
      <div className="noise-overlay absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="How It Works"
          title="From Data to Decision"
          subtitle="An end-to-end AI pipeline connecting satellite, drone, IoT, and medical data into intelligent outcomes."
          align="center"
        />

        <ScrollReveal className="mt-16">
          <div className="hidden lg:block">
            <div className="relative flex items-start justify-between gap-2">
              <div className="absolute left-0 right-0 top-8 h-px bg-gradient-to-r from-green/0 via-green/50 to-blue/0" />
              {pipeline.map((step, i) => {
                const Icon = step.icon;
                const isActive = active === i;
                return (
                  <motion.button
                    key={step.title}
                    type="button"
                    className="relative z-10 flex flex-1 flex-col items-center px-1"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    whileHover={{ y: -4 }}
                  >
                    <motion.div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl glass"
                      animate={{
                        boxShadow: isActive ? `0 0 30px ${step.color}40` : "0 0 0px transparent",
                        scale: isActive ? 1.08 : 1,
                      }}
                    >
                      <Icon className="h-7 w-7" style={{ color: step.color }} />
                    </motion.div>
                    <p className="mt-3 text-center text-xs font-semibold text-white">{step.title}</p>
                    {i < pipeline.length - 1 && (
                      <span className="absolute -right-1 top-7 text-white/20">↓</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {pipeline.map((step, i) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`glass flex items-center gap-3 rounded-2xl p-4 text-left ${active === i ? "ring-1 ring-green/50" : ""}`}
                >
                  <Icon className="h-5 w-5 shrink-0" style={{ color: step.color }} />
                  <span className="text-sm font-medium text-white">{step.title}</span>
                </button>
              );
            })}
          </div>

          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="gradient-border glass mt-10 rounded-[24px] p-8 text-center lg:mt-12"
          >
            {(() => {
              const DetailIcon = pipeline[active].icon;
              return (
                <>
                  <DetailIcon className="mx-auto mb-3 h-8 w-8" style={{ color: pipeline[active].color }} />
                  <h3 className="font-heading text-xl font-bold text-white">{pipeline[active].title}</h3>
                  <p className="mx-auto mt-3 max-w-2xl text-white/60">{pipeline[active].desc}</p>
                </>
              );
            })()}
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
