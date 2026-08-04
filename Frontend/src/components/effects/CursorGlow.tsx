"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CursorGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const leave = () => setVisible(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed z-[9999] hidden h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green/5 blur-2xl md:block"
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 120, damping: 25 }}
      />
      <motion.div
        className="pointer-events-none fixed z-[9999] hidden h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-green/40 bg-green/10 mix-blend-screen md:block"
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.4 }}
      />
    </>
  );
}
