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
        className="pointer-events-none fixed z-[9999] hidden h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl md:block"
        style={{ background: "rgba(62,207,142,0.07)" }}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 120, damping: 25 }}
      />
      <motion.div
        className="pointer-events-none fixed z-[9999] hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen md:block"
        style={{
          border: "1px solid rgba(62,207,142,0.45)",
          background: "rgba(62,207,142,0.12)",
        }}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.4 }}
      />
    </>
  );
}
