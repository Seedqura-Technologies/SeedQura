"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { LOGO_SRC, LOGO_ALT } from "@/components/ui/Logo";

// Precomputed to avoid server/client float drift from Math.sin/cos during hydration
const LOADER_DOTS = [
  { cx: 85, cy: 50 },
  { cx: 67.5, cy: 80.310889 },
  { cx: 32.5, cy: 80.310889 },
  { cx: 15, cy: 50 },
  { cx: 32.5, cy: 19.689111 },
  { cx: 67.5, cy: 19.689111 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {mounted && loading && (
          <motion.div
            key="loader"
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#050816]"
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-green/20 blur-3xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <Image
                src={LOGO_SRC}
                alt={LOGO_ALT}
                width={160}
                height={56}
                className="relative h-16 w-auto"
                priority
              />
            </div>

            <svg className="mt-10 h-24 w-24" viewBox="0 0 100 100" aria-hidden>
              {LOADER_DOTS.map((dot, i) => (
                <motion.circle
                  key={i}
                  cx={dot.cx}
                  cy={dot.cy}
                  r="3"
                  fill="#22C55E"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
              <motion.circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="url(#loadGrad)"
                strokeWidth="1"
                strokeDasharray="4 6"
                animate={{ rotate: 360 }}
                style={{ transformOrigin: "50px 50px" }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <defs>
                <linearGradient id="loadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </svg>

            <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-green to-blue"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.2, ease: "easeInOut" }}
              />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-widest text-white/40">
              Initializing AI Systems
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5, delay: loading ? 0 : 0.1 }}
      >
        {children}
      </motion.div>
    </>
  );
}
