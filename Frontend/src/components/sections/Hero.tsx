"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { MagneticButton } from "@/components/ui/MagneticButton";

const FibonacciSphere = dynamic(
  () =>
    import("@/components/effects/FibonacciSphere").then((m) => ({
      default: m.FibonacciSphere,
    })),
  { ssr: false, loading: () => null }
);

const ease = [0.22, 1, 0.36, 1] as const;
const SPHERE_BREAKPOINT = "(min-width: 768px)";

export function Hero() {
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
      className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-28"
      style={{ perspective: 1200, background: "var(--surface-0)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 55% 45% at 78% 42%, rgba(34,211,165,0.09) 0%, transparent 70%),
            radial-gradient(ellipse 40% 35% at 12% 70%, rgba(15,158,126,0.05) 0%, transparent 65%)
          `,
        }}
      />

      {showSphere && (
        <FibonacciSphere
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          anchorRef={sphereAnchorRef}
        />
      )}

      <div className="pointer-events-none relative z-10 w-full px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="flex w-full flex-col items-center text-center md:max-w-xl md:items-start md:text-left lg:max-w-2xl">
            {/* Brand lives in the nav — hero leads with the thesis */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease }}
              className="text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--text-muted)" }}
            >
              Research lab · Precision medicine
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12, ease }}
              className="mt-5 text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl md:text-6xl lg:text-[4.15rem]"
              style={{ color: "var(--text)" }}
            >
              AI for the{" "}
              <span className="text-gradient">vessel</span>
              {" "}and the{" "}
              <span className="text-gradient">whole of her care</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="mt-7 max-w-lg text-base leading-relaxed md:text-lg"
              style={{ color: "var(--text-muted)" }}
            >
              NeuroVision helps surgeons and students comprehend cerebral
              aneurysms in tight 3D space. Sampoorna builds one companion for
              women&apos;s health — not five fragmented apps.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3, ease }}
              className="pointer-events-auto mt-12 flex flex-wrap items-center justify-center gap-3 md:justify-start"
            >
              <MagneticButton href="#neurovision" variant="primary">
                See the work
              </MagneticButton>
              <MagneticButton href="#contact" variant="secondary">
                Collaborate
              </MagneticButton>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="mt-10 text-xs"
              style={{ color: "var(--text-faint)" }}
            >
              Pre-op · AR · Detection · Women&apos;s health
            </motion.p>
          </div>

          <div
            ref={sphereAnchorRef}
            className="pointer-events-none hidden shrink-0 md:block md:h-[360px] md:w-[360px] lg:h-[420px] lg:w-[420px] xl:h-[460px] xl:w-[460px]"
            aria-hidden
          />
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--surface-0) 100%)",
        }}
        aria-hidden
      />
    </section>
  );
}
