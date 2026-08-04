"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
};

export function MagneticButton({
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  className = "",
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 18 });
  const sy = useSpring(y, { stiffness: 280, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || disabled) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.28);
    y.set((e.clientY - r.top - r.height / 2) * 0.28);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const base = `btn-premium ${variant === "primary" ? "btn-primary" : "btn-secondary"} disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

  const inner = href ? (
    <a href={href} className={base}>
      {children}
    </a>
  ) : (
    <button type={type} disabled={disabled} onClick={onClick} className={base}>
      {children}
    </button>
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className="inline-flex"
      whileTap={{ scale: 0.97 }}
    >
      {inner}
    </motion.div>
  );
}
