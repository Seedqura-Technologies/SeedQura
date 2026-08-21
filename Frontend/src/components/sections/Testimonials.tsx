"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const testimonials = [
  {
    quote: "Seedqura's AI platform transformed our crop monitoring capabilities. The precision and accuracy exceeded our expectations.",
    author: "Dr. Rajesh Kumar",
    role: "Director, Agricultural Research Institute",
    initials: "RK",
  },
  {
    quote: "Their medical imaging AI integrated seamlessly with our hospital systems. A true partner in digital health innovation.",
    author: "Dr. Priya Sharma",
    role: "Chief Medical Officer, Tertiary Hospital",
    initials: "PS",
  },
  {
    quote: "The Seedqura Academy produced researchers who are now leading AI projects across our organization.",
    author: "Prof. Amit Verma",
    role: "Dean, University AI Research Lab",
    initials: "AV",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: false });

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [inView]);

  const t = testimonials[current];

  return (
    <section className="section-dark py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Testimonials" title="Trusted by Leaders" align="center" />

        <div ref={ref} className="relative mx-auto mt-16 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.96 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="gradient-border glass rounded-[24px] p-10 md:p-12"
            >
              <Quote className="mb-6 h-10 w-10" style={{ color: "var(--accent-border)" }} />
              <p className="text-lg leading-relaxed md:text-xl" style={{ color: "var(--text)" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-8 flex items-center gap-4 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold"
                  style={{
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent-border)",
                    color: "var(--accent)",
                  }}
                >
                  {t.initials}
                </motion.div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>{t.author}</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)}
              className="flex h-10 w-10 items-center justify-center rounded-xl glass transition-colors hover:text-[var(--accent)]"
              style={{ color: "var(--text-muted)" }}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: i === current ? "1.5rem" : "0.5rem",
                    background: i === current ? "var(--accent)" : "var(--border-strong)",
                  }}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCurrent((c) => (c + 1) % testimonials.length)}
              className="flex h-10 w-10 items-center justify-center rounded-xl glass transition-colors hover:text-[var(--accent)]"
              style={{ color: "var(--text-muted)" }}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
