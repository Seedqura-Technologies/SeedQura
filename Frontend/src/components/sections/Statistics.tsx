"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const stats = [
  { value: 24, suffix: "", label: "Models Running", decimals: 0 },
  { value: 1.2, suffix: "M+", label: "Satellite Images Processed", decimals: 1 },
  { value: 850, suffix: "K+", label: "Medical Images Analysed", decimals: 0 },
  { value: 3200, suffix: "+", label: "Crop Fields Monitored", decimals: 0 },
  { value: 12000, suffix: "+", label: "Patients Assisted", decimals: 0 },
  { value: 4.8, suffix: "M+", label: "Predictions Generated", decimals: 1 },
];

function LiveStat({ value, suffix, label, decimals }: { value: number; suffix: string; label: string; decimals: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2500;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(value * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();

  return (
    <div ref={ref} className="text-center">
      <span className="font-heading text-3xl font-bold gradient-text md:text-4xl">
        {display}{suffix}
      </span>
      <p className="font-sub mt-2 text-xs font-medium uppercase tracking-widest text-white/50">{label}</p>
    </div>
  );
}

export function Statistics() {
  return (
    <section className="section-navy relative py-24 md:py-32">
      <div className="noise-overlay absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Live AI Metrics"
          title="Impact at Scale"
          subtitle="Real-time intelligence powering agriculture and healthcare worldwide."
          align="center"
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.08}>
              <motion.div
                whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(34,197,94,0.15)" }}
                className="gradient-border glass rounded-[24px] p-8"
              >
                <LiveStat {...stat} />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
