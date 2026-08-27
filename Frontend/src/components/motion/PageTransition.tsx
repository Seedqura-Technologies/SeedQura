"use client";

import { type ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

/**
 * CSS-driven page enter — paints immediately (no opacity:0 waiting on JS).
 * Survives failed/slow hydration better than framer-motion initial={opacity:0}.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return <div className="animate-fade-in-up">{children}</div>;
}
