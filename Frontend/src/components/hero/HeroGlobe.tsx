"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Cpu,
  Plus,
  Dna,
  HeartPulse,
  Leaf,
  Plane,
  Radio,
  Satellite,
  Sparkles,
} from "lucide-react";

const orbitItems = [
  { Icon: Leaf, color: "#22C55E", delay: 0, radius: 140, label: "Agriculture" },
  { Icon: Dna, color: "#06B6D4", delay: 0.4, radius: 125, label: "Genomics" },
  { Icon: Plus, color: "#2563EB", delay: 0.8, radius: 150, label: "Healthcare" },
  { Icon: HeartPulse, color: "#2563EB", delay: 1.2, radius: 130, label: "Medical AI" },
  { Icon: Plane, color: "#22C55E", delay: 1.6, radius: 160, label: "Drone" },
  { Icon: Satellite, color: "#06B6D4", delay: 2, radius: 135, label: "Satellite" },
  { Icon: Cpu, color: "#22C55E", delay: 2.4, radius: 145, label: "AI Chip" },
  { Icon: Radio, color: "#2563EB", delay: 2.8, radius: 120, label: "IoT" },
];

const floatingStats = [
  { value: "98.7%", label: "AI Accuracy", x: "5%", y: "12%" },
  { value: "250+", label: "Research Projects", x: "72%", y: "8%" },
  { value: "500+", label: "Datasets", x: "78%", y: "72%" },
  { value: "40+", label: "Partners", x: "8%", y: "78%" },
];

export function HeroGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 80, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 80, damping: 20 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="relative mx-auto aspect-square w-full max-w-xl">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green/25 via-cyan/15 to-blue/25 blur-3xl" />

      {floatingStats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="absolute z-20 glass rounded-xl px-3 py-2 text-center shadow-lg"
          style={{ left: stat.x, top: stat.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { delay: 0.8 + i * 0.15, duration: 0.5 },
            scale: { delay: 0.8 + i * 0.15, duration: 0.5 },
            y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <p className="font-heading text-sm font-bold text-green">{stat.value}</p>
          <p className="text-[10px] text-white/50">{stat.label}</p>
        </motion.div>
      ))}

      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        className="relative flex h-full w-full items-center justify-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute h-[88%] w-[88%] rounded-full border border-white/10"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(34,197,94,0.35), rgba(6,182,212,0.25), rgba(37,99,235,0.35), rgba(34,197,94,0.35))",
          }}
        />

        {/* Data streams */}
        {[0, 90, 180, 270].map((angle) => (
          <motion.div
            key={angle}
            className="absolute left-1/2 top-1/2 h-[44%] w-px origin-bottom bg-gradient-to-t from-transparent via-cyan/60 to-transparent"
            style={{ rotate: `${angle}deg`, marginLeft: -0.5 }}
            animate={{ opacity: [0.2, 0.8, 0.2], scaleY: [0.8, 1.1, 0.8] }}
            transition={{ duration: 2.5, delay: angle / 360, repeat: Infinity }}
          />
        ))}

        <div className="relative h-[76%] w-[76%] overflow-hidden rounded-full border border-white/25 shadow-2xl shadow-green/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#071A2B] via-[#0a2540] to-[#050816]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 28% 38%, rgba(34,197,94,0.55) 0%, transparent 48%), radial-gradient(circle at 72% 62%, rgba(37,99,235,0.55) 0%, transparent 48%)",
            }}
          />
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom bg-white/10"
              style={{ rotate: `${i * 15}deg` }}
              animate={{ opacity: [0.15, 0.45, 0.15] }}
              transition={{ duration: 3, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
          <motion.div
            className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green shadow-lg shadow-green/60"
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Sparkles className="absolute right-[22%] top-[30%] h-4 w-4 text-cyan/80" />
        </div>

        {orbitItems.map(({ Icon, color, delay, radius }, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2"
            animate={{ rotate: 360 }}
            transition={{ duration: 22 + i * 2, repeat: Infinity, ease: "linear", delay }}
            style={{ width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius }}
          >
            <motion.div
              className="absolute left-1/2 top-0 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-xl glass"
              animate={{ rotate: -360 }}
              transition={{ duration: 22 + i * 2, repeat: Infinity, ease: "linear", delay }}
              style={{ boxShadow: `0 0 24px ${color}50` }}
              whileHover={{ scale: 1.15 }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
