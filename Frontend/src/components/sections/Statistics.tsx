"use client";

import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const stats = [
  { value: 24,    suffix: "",   label: "Models Running",              decimals: 0 },
  { value: 1.2,   suffix: "M+", label: "Satellite Images Processed",  decimals: 1 },
  { value: 850,   suffix: "K+", label: "Medical Images Analysed",     decimals: 0 },
  { value: 3200,  suffix: "+",  label: "Crop Fields Monitored",       decimals: 0 },
  { value: 12000, suffix: "+",  label: "Patients Assisted",           decimals: 0 },
  { value: 4.8,   suffix: "M+", label: "Predictions Generated",       decimals: 1 },
];

function LiveStat({
  value, suffix, label, decimals,
}: {
  value: number; suffix: string; label: string; decimals: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Trigger counter once when element enters viewport
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          obs.disconnect();
          const duration = 2000;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(value * eased);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  const display = decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString();

  return (
    <div ref={ref} className="text-center">
      <span
        className="text-gradient text-3xl font-bold tabular-nums md:text-4xl"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {display}{suffix}
      </span>
      <p
        className="mt-2 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
    </div>
  );
}

export function Statistics() {
  return (
    <section className="section-navy relative py-20 md:py-28">
      <div className="noise-overlay absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Live AI Metrics"
          title="Impact at scale"
          subtitle="Real-time intelligence powering agriculture and healthcare worldwide."
          align="center"
        />
        <div className="mt-16 grid gap-px sm:grid-cols-2 lg:grid-cols-3"
          style={{
            background: "var(--border)",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            border: "1px solid var(--border)",
          }}
        >
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.05}>
              <div
                className="p-8 transition-colors duration-200 hover:bg-[var(--surface-3)]"
                style={{ background: "var(--surface-1)" }}
              >
                <LiveStat {...stat} />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
