"use client";

import { motion } from "framer-motion";
import { Activity, BarChart3, Map, Scan } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const widgets = [
  { icon: Activity, label: "Crop Health", value: "94.2%", trend: "+2.1%", color: "#22C55E" },
  { icon: Scan, label: "Disease Detection", value: "12 alerts", trend: "3 critical", color: "#EF4444" },
  { icon: BarChart3, label: "Yield Prediction", value: "8.4 t/ha", trend: "+5.3%", color: "#06B6D4" },
  { icon: Map, label: "Fields Monitored", value: "1,240", trend: "Live", color: "#2563EB" },
];

export function DashboardPreview() {
  return (
    <section id="dashboard" className="section-dark relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="AI Dashboard"
          title="Real-Time Intelligence at Your Fingertips"
          subtitle="Live analytics for crop health, medical imaging, satellite monitoring, and predictive AI."
          align="center"
        />

        <ScrollReveal className="mt-16">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="gradient-border glass overflow-hidden rounded-[24px] shadow-2xl shadow-green/5"
          >
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green/80" />
              </div>
              <span className="ml-2 text-xs text-white/40">Seedqura AI Command Center</span>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-4 md:p-6">
              {widgets.map((w, i) => (
                <motion.div
                  key={w.label}
                  whileHover={{ y: -4, boxShadow: `0 8px 32px ${w.color}20` }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <w.icon className="h-5 w-5" style={{ color: w.color }} />
                  <p className="mt-3 text-xs text-white/50">{w.label}</p>
                  <p className="font-heading text-2xl font-bold text-white">{w.value}</p>
                  <p className="mt-1 text-xs" style={{ color: w.color }}>{w.trend}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-4 border-t border-white/10 p-4 md:grid-cols-3 md:p-6">
              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/40">
                  Satellite Heatmap
                </p>
                <div className="grid h-40 grid-cols-8 gap-1">
                  {[...Array(32)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="rounded-sm"
                      style={{
                        background: `rgba(34,197,94,${0.15 + (i % 5) * 0.12})`,
                      }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.05 }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/40">
                  Medical Analytics
                </p>
                <svg viewBox="0 0 200 80" className="h-24 w-full" aria-hidden>
                  <motion.path
                    d="M0,60 L30,60 L40,30 L50,70 L60,60 L90,60 L100,25 L110,55 L120,60 L200,60"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "loop", repeatDelay: 2 }}
                  />
                </svg>
                <p className="text-xs text-white/50">Patient monitoring · Live</p>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
