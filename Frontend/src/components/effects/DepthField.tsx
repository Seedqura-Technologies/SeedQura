"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

type DepthFieldProps = {
  className?: string;
  tone?: "accent" | "warm";
};

/** Cursor-reactive 3D depth field for section backgrounds (no Three.js). */
export function DepthField({
  className = "",
  tone = "accent",
}: DepthFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 70, damping: 20 });
  const sy = useSpring(my, { stiffness: 70, damping: 20 });

  const rotateX = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const shiftX = useTransform(sx, [-0.5, 0.5], [-28, 28]);
  const shiftY = useTransform(sy, [-0.5, 0.5], [-20, 20]);
  const counterX = useTransform(sx, [-0.5, 0.5], [18, -18]);
  const counterY = useTransform(sy, [-0.5, 0.5], [14, -14]);
  const counterRX = useTransform(sy, [-0.5, 0.5], [-8, 8]);
  const counterRY = useTransform(sx, [-0.5, 0.5], [10, -10]);
  const glowX = useTransform(sx, [-0.5, 0.5], ["32%", "68%"]);
  const glowY = useTransform(sy, [-0.5, 0.5], ["30%", "70%"]);

  const primary =
    tone === "warm" ? "rgba(184,149,106,0.28)" : "rgba(95,175,143,0.32)";
  const secondary =
    tone === "warm" ? "rgba(95,175,143,0.18)" : "rgba(184,149,106,0.16)";

  const glow = useMotionTemplate`radial-gradient(ellipse 55% 45% at ${glowX} ${glowY}, ${primary}, transparent 70%)`;
  const glowSoft = useMotionTemplate`radial-gradient(ellipse 40% 35% at ${glowX} ${glowY}, ${secondary}, transparent 65%)`;

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;

    const onMove = (e: MouseEvent) => {
      const r = parent.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [mx, my]);

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: glow, opacity: 0.85 }}
      />
      <motion.div
        className="absolute inset-0"
        style={{ background: glowSoft, opacity: 0.7 }}
      />

      <motion.div
        className="absolute -right-[8%] top-[12%] h-[340px] w-[340px] md:h-[420px] md:w-[420px]"
        style={{
          x: shiftX,
          y: shiftY,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          perspective: 1000,
        }}
      >
        <motion.div
          className="absolute inset-[6%] rounded-full border border-accent/20"
          style={{ transform: "translateZ(16px)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 56, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[18%] rounded-full border border-accent-warm/15"
          style={{ transform: "rotateX(62deg) translateZ(8px)" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
        />
        <div
          className="absolute inset-[30%] rounded-full"
          style={{
            background:
              tone === "warm"
                ? "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.75), rgba(184,149,106,0.22) 48%, transparent 72%)"
                : "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.75), rgba(95,175,143,0.22) 48%, transparent 72%)",
            boxShadow:
              "inset 0 0 36px rgba(255,255,255,0.35), 0 18px 50px rgba(95,175,143,0.12)",
            transform: "translateZ(36px)",
          }}
        />
      </motion.div>

      <motion.div
        className="absolute -left-[6%] bottom-[8%] h-[220px] w-[220px] opacity-70 md:h-[280px] md:w-[280px]"
        style={{
          x: counterX,
          y: counterY,
          rotateX: counterRX,
          rotateY: counterRY,
          transformStyle: "preserve-3d",
          perspective: 900,
        }}
      >
        <motion.div
          className="absolute inset-[10%] rounded-full border border-accent/15"
          animate={{ rotate: -360 }}
          transition={{ duration: 64, repeat: Infinity, ease: "linear" }}
          style={{ transform: "translateZ(12px)" }}
        />
        <div
          className="absolute inset-[34%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 40% 32%, rgba(255,255,255,0.65), rgba(95,175,143,0.14) 50%, transparent 70%)",
            transform: "translateZ(28px)",
          }}
        />
      </motion.div>
    </div>
  );
}
