"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getSiteData } from "@/lib/data";
import { Logo } from "@/components/ui/Logo";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { TextureBackground } from "@/components/effects/TextureBackground";
import { FibonacciSphere } from "@/components/effects/FibonacciSphere";

const ease = [0.22, 1, 0.36, 1] as const;

// The 3D sphere is desktop-only: it stays hidden (and unmounted, so no
// WebGL context is created at all) below the `md` breakpoint.
const SPHERE_BREAKPOINT = "(min-width: 768px)";

export function Hero() {
  const site = getSiteData();
  const [showSphere, setShowSphere] = useState(false);
  const sphereAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia(SPHERE_BREAKPOINT);
    const update = () => setShowSphere(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return (
    <section
      id="overview"
      className="relative flex min-h-[85vh] items-center overflow-hidden pt-28 pb-32"
      style={{ perspective: 1200 }}
    >
      <TextureBackground variant="hero" />

      {/* Full-hero particle canvas — particles can scatter across the
          entire section on scroll. Desktop only. Idle position is locked
          to the right-column anchor so it lines up with the navbar. */}
      {showSphere && (
        <FibonacciSphere
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          anchorRef={sphereAnchorRef}
        />
      )}

      {/* Match Header layout exactly: outer px-4/sm:px-6 + inner max-w-6xl
          with the same horizontal padding, so text + sphere align with the nav. */}
      <div className="pointer-events-none relative z-10 w-full px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="flex w-full flex-col items-center text-center md:max-w-md md:items-start md:text-left lg:max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 16, rotateX: 8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.7, ease }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Logo variant="hero" animate />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease }}
              className="mt-12 text-4xl font-medium leading-[1.15] tracking-tight text-text sm:text-5xl md:text-6xl"
            >
              {site.tagline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.22, ease }}
              className="mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl"
            >
              {site.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34, ease }}
              className="pointer-events-auto mt-14 flex flex-wrap items-center justify-center gap-4 md:justify-start"
            >
              <MagneticButton href="/products" variant="primary">
                Explore
              </MagneticButton>
              <MagneticButton href="#contact" variant="secondary">
                Contact
              </MagneticButton>
            </motion.div>
          </div>

          {/* Right-column anchor — same width band as the navbar's right side.
              The 3D sphere is projected onto this box's center. */}
          <div
            ref={sphereAnchorRef}
            className="pointer-events-none hidden shrink-0 md:block md:h-[340px] md:w-[340px] lg:h-[400px] lg:w-[400px] xl:h-[440px] xl:w-[440px]"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
