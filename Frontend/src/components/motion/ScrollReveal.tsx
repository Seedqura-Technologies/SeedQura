"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
};

const translateMap = {
  up:    "translateY(18px)",
  down:  "translateY(-18px)",
  left:  "translateX(18px)",
  right: "translateX(-18px)",
};

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If already visible in the viewport when mounted (common with lazy-loaded
    // sections), reveal immediately without waiting for the observer callback.
    const rect = el.getBoundingClientRect();
    const inView =
      rect.top < window.innerHeight && rect.bottom > 0;

    if (inView) {
      // Small rAF delay so the CSS class is applied after paint, allowing
      // the transition to actually run instead of snapping to visible.
      requestAnimationFrame(() => {
        el.classList.remove("reveal-hidden");
        el.classList.add("reveal-visible");
      });
      return;
    }

    // Not yet visible — use IntersectionObserver to trigger on scroll.
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-hidden");
          entry.target.classList.add("reveal-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-hidden ${className}`}
      style={
        {
          "--reveal-translate": translateMap[direction],
          "--reveal-delay": delay > 0 ? `${delay}s` : undefined,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
