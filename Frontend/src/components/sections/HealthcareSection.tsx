"use client";

import { motion } from "framer-motion";
import { Activity, Brain, FileText, Heart, Scan, Stethoscope } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const features = [
  { icon: Stethoscope, label: "Clinical Decision AI" },
  { icon: Scan,        label: "Medical Imaging" },
  { icon: Heart,       label: "Patient Analytics" },
  { icon: Brain,       label: "AI Diagnosis" },
];

export function HealthcareSection() {
  return (
    <section id="healthcare" className="section-navy relative py-24 md:py-32">
      <div className="noise-overlay absolute inset-0" />

      {/* Background glow — positioned to bleed from the right */}
      <div
        className="glow-orb glow-orb-green pointer-events-none absolute"
        style={{ width: 560, height: 560, top: "10%", right: "-10%" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">

          {/* Visual */}
          <ScrollReveal direction="left" className="order-2 lg:order-1">
            <div className="gradient-border relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)]">
              {/* Subtle accent wash */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(135deg, rgba(34,211,165,0.06) 0%, transparent 60%)" }}
              />

              <div className="absolute inset-4 rounded-2xl border border-white/[0.06] bg-black/40 p-5">
                {/* Header row */}
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Medical AI Dashboard
                  </span>
                </div>

                {/* Module chips */}
                <div className="grid grid-cols-3 gap-2">
                  {["MRI Analysis", "X-Ray AI", "NLP Notes"].map((label) => (
                    <div
                      key={label}
                      className="rounded-lg p-2 text-center text-xs font-medium"
                      style={{
                        background: "var(--accent-dim)",
                        border: "1px solid var(--accent-border)",
                        color: "var(--accent)",
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Heartbeat waveform */}
                <svg className="mt-5 h-14 w-full" viewBox="0 0 300 56" aria-hidden>
                  <motion.path
                    d="M0,28 L28,28 L38,8 L48,48 L58,28 L88,28 L98,18 L108,38 L118,28 L300,28"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 1 }}
                  />
                </svg>

                {/* Icon row */}
                <div className="mt-4 flex gap-2">
                  {[Brain, Scan, FileText].map((Icon, i) => (
                    <div
                      key={i}
                      className="flex flex-1 items-center justify-center rounded-lg py-2.5"
                      style={{ background: "rgba(34,211,165,0.05)", border: "1px solid var(--border)" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Rotating activity icon */}
              <motion.div
                className="absolute -right-3 top-1/4 opacity-[0.08]"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="h-16 w-16" style={{ color: "var(--accent)" }} />
              </motion.div>
            </div>
          </ScrollReveal>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <SectionHeading
              label="Healthcare AI"
              title="Intelligent medicine for better outcomes"
              subtitle="Clinical decision support, medical imaging AI, and digital health analytics — built with the rigor of active research."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map(({ icon: Icon, label }) => (
                <ScrollReveal key={label}>
                  <div
                    className="flex items-center gap-3 rounded-xl p-4 transition-all duration-200 hover:border-[var(--accent-border)]"
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {label}
                    </span>
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
