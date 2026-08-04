"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

/** Soft 3D orb that tilts with the cursor — kept lightweight, no Three.js */
export function FloatingOrb({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const glowX = useTransform(sx, [-0.5, 0.5], ["35%", "65%"]);
  const glowY = useTransform(sy, [-0.5, 0.5], ["35%", "65%"]);
  const glow = useMotionTemplate`radial-gradient(circle at ${glowX} ${glowY}, rgba(95,175,143,0.35), transparent 55%)`;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`pointer-events-auto absolute inset-0 flex items-center justify-center ${className}`}
      aria-hidden
    >
      <motion.div
        className="relative h-[280px] w-[280px] sm:h-[340px] sm:w-[340px] md:h-[400px] md:w-[400px]"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          perspective: 900,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: glow, transform: "translateZ(-40px)" }}
        />

        {/* Outer ring */}
        <motion.div
          className="absolute inset-[8%] rounded-full border border-accent/25"
          style={{ transform: "translateZ(20px)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
        />

        {/* Mid ring — opposite spin */}
        <motion.div
          className="absolute inset-[18%] rounded-full border border-accent-warm/20"
          style={{
            transform: "rotateX(68deg) translateZ(10px)",
            transformStyle: "preserve-3d",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
        />

        {/* Core */}
        <div
          className="absolute inset-[28%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(95,175,143,0.25) 45%, rgba(184,149,106,0.15) 70%, transparent)",
            boxShadow:
              "inset 0 0 40px rgba(255,255,255,0.5), 0 20px 60px rgba(95,175,143,0.18)",
            transform: "translateZ(40px)",
          }}
        />

        {/* Specular highlight */}
        <div
          className="absolute left-[32%] top-[28%] h-10 w-16 rounded-full bg-white/50 blur-md"
          style={{ transform: "translateZ(50px)" }}
        />
      </motion.div>
    </div>
  );
}
