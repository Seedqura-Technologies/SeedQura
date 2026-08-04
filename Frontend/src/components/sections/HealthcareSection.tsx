"use client";

import { motion } from "framer-motion";
import { Activity, Brain, FileText, Heart, Scan, Stethoscope } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export function HealthcareSection() {
  return (
    <section id="healthcare" className="section-navy relative py-24 md:py-32">
      <div className="noise-overlay absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <ScrollReveal direction="left" className="order-2 lg:order-1">
            <div className="gradient-border glass relative aspect-[4/3] overflow-hidden rounded-[24px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue/20 via-transparent to-cyan/10" />

              {/* Dashboard mockup */}
              <div className="absolute inset-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green" />
                  <span className="text-xs text-white/50">Medical AI Dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["MRI", "X-Ray", "NLP"].map((label) => (
                    <div key={label} className="rounded-lg bg-white/5 p-2 text-center text-xs text-white/60">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Heartbeat waveform */}
                <svg className="mt-4 h-16 w-full" viewBox="0 0 300 60" aria-hidden>
                  <motion.path
                    d="M0,30 L30,30 L40,10 L50,50 L60,30 L90,30 L100,20 L110,40 L120,30 L300,30"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
                  />
                </svg>

                <div className="mt-3 flex gap-2">
                  {[Brain, Scan, FileText].map((Icon, i) => (
                    <div key={i} className="flex flex-1 items-center justify-center rounded-lg bg-blue/10 py-2">
                      <Icon className="h-4 w-4 text-blue" />
                    </div>
                  ))}
                </div>
              </div>

              {/* DNA helix */}
              <motion.div
                className="absolute -right-4 top-1/4 opacity-30"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="h-20 w-20 text-cyan" />
              </motion.div>
            </div>
          </ScrollReveal>

          <div className="order-1 lg:order-2">
            <SectionHeading
              label="Healthcare AI"
              title="Intelligent Medicine for Better Outcomes"
              subtitle="Clinical decision support, medical imaging AI, and digital health analytics for tertiary hospitals."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Stethoscope, label: "Clinical AI" },
                { icon: Scan, label: "Medical Imaging" },
                { icon: Heart, label: "Patient Analytics" },
                { icon: Brain, label: "AI Diagnosis" },
              ].map(({ icon: Icon, label }) => (
                <ScrollReveal key={label}>
                  <div className="glass flex items-center gap-3 rounded-2xl p-4">
                    <Icon className="h-5 w-5 text-blue" />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
