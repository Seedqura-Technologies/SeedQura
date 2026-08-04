"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";

type GlassCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
};

export function GlassCard({
  title,
  description,
  children,
  className = "",
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const sheen = useMotionTemplate`radial-gradient(420px circle at ${gx}% ${gy}%, rgba(95,175,143,0.14), transparent 50%)`;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 10);
    rx.set((0.5 - py) * 10);
    gx.set(px * 100);
    gy.set(py * 100);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
      className={`glass-card relative overflow-hidden p-8 ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: sheen }}
        aria-hidden
      />
      <div style={{ transform: "translateZ(18px)" }} className="relative">
        <h3 className="text-lg font-medium text-text">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        {children}
      </div>
    </motion.div>
  );
}
