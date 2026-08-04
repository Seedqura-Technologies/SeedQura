"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { CloudRain, Droplets, Plane, Satellite, Sprout, Thermometer, Wifi } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export function AgricultureSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} id="agriculture" className="section-light relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <SectionHeading
            light
            label="Agriculture AI"
            title="Precision Farming at Planetary Scale"
            subtitle="From satellite monitoring to drone analytics — intelligent systems that grow with your fields."
          />

          <ScrollReveal direction="right">
            <motion.div style={{ y }} className="relative aspect-square max-w-lg justify-self-center">
              <div className="gradient-border glass-light relative h-full w-full overflow-hidden rounded-[24px]">
                <div className="absolute inset-0 bg-gradient-to-b from-green/20 via-emerald/10 to-transparent" />

                {/* Farm rows */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-3 rounded-full bg-green/40"
                    style={{ bottom: `${15 + i * 12}%`, left: "10%", right: "10%" }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.8 }}
                  />
                ))}

                <motion.div
                  className="absolute left-[20%] bottom-[30%]"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Sprout className="h-10 w-10 text-green" />
                </motion.div>

                <motion.div
                  className="absolute right-[15%] top-[20%]"
                  animate={{ x: [0, 30, 0], y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                >
                  <Plane className="h-8 w-8 text-navy/60" />
                </motion.div>

                <motion.div
                  className="absolute left-[10%] top-[15%]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Satellite className="h-7 w-7 text-blue" />
                </motion.div>

                {[
                  { Icon: Wifi, pos: "bottom-[20%] right-[20%]" },
                  { Icon: Droplets, pos: "bottom-[45%] left-[30%]" },
                  { Icon: Thermometer, pos: "top-[40%] right-[30%]" },
                  { Icon: CloudRain, pos: "top-[25%] left-[40%]" },
                ].map(({ Icon, pos }, i) => (
                  <motion.div
                    key={i}
                    className={`absolute ${pos} flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-md`}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                  >
                    <Icon className="h-4 w-4 text-green" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
