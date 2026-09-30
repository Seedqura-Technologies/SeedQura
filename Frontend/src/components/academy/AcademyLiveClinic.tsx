"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import {
  isWorkshopActive,
  WORKSHOP_COURSE_ID,
  WORKSHOP_REGISTER_URL,
} from "@/lib/workshop";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Time-boxed live invitation for the AI Care Clinic.
 * Sits above the course grid — event energy, not another catalog card.
 */
export function AcademyLiveClinic() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isWorkshopActive());
  }, []);

  if (!active) return null;

  return (
    <section
      id="live-clinic"
      className="relative z-[1] pb-4 pt-2 md:pb-8"
      aria-labelledby="live-clinic-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="academy-live-clinic relative overflow-hidden">
            <div className="academy-live-clinic-glow" aria-hidden />

            <div className="relative grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <Link
                href={`/academy/${WORKSHOP_COURSE_ID}`}
                className="group relative block min-h-[220px] overflow-hidden sm:min-h-[260px] lg:min-h-full"
                aria-label="Open AI Care Clinic details"
              >
                <Image
                  src="/workshops/ai-healthcare-flyer.jpg"
                  alt=""
                  fill
                  className="object-cover object-[center_12%] transition duration-700 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 480px"
                  priority
                  unoptimized
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[rgba(7,17,13,0.92)] via-[rgba(7,17,13,0.25)] to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[rgba(7,17,13,0.35)] lg:to-[rgba(7,17,13,0.95)]"
                  aria-hidden
                />
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,165,0.35)] bg-[rgba(7,17,13,0.65)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--academy-sage)] backdrop-blur-sm lg:bottom-6 lg:left-6">
                  <span className="academy-live-pulse" aria-hidden />
                  Live this weekend
                </span>
              </Link>

              <div className="relative flex flex-col px-5 py-7 sm:px-8 sm:py-9 lg:py-10 lg:pl-9 lg:pr-10">
                <motion.p
                  className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--academy-sage)]"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease }}
                >
                  Seedqura Learnings · Clinic hours
                </motion.p>

                <motion.h2
                  id="live-clinic-title"
                  className="mt-3 max-w-[16ch] text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-[var(--academy-text)] sm:text-[2.1rem]"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.06, duration: 0.45, ease }}
                >
                  AI Care Clinic
                </motion.h2>

                <motion.p
                  className="mt-2 text-sm font-medium text-[var(--accent-warm)]"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.4, ease }}
                >
                  Where the ward meets the whiteboard.
                </motion.p>

                <motion.p
                  className="mt-4 max-w-[38ch] text-[14.5px] leading-relaxed text-[var(--academy-text-muted)]"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.14, duration: 0.4, ease }}
                >
                  A clinician from AIIMS. A builder of startups. Two mornings —
                  judgment, products, and the floor where AI already shows up.
                </motion.p>

                <motion.div
                  className="mt-5 flex flex-wrap gap-2"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.18, duration: 0.4, ease }}
                >
                  {["3–4 Oct", "10:00–12:00 IST", "₹499", "Certificate"].map(
                    (chip) => (
                      <span key={chip} className="academy-live-chip">
                        {chip}
                      </span>
                    )
                  )}
                </motion.div>

                <motion.div
                  className="mt-6 flex items-center gap-3"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.22, duration: 0.4, ease }}
                >
                  <div className="flex -space-x-2.5">
                    <Image
                      src="/workshops/bhavna.jpg"
                      alt="Dr. Bhavna Gupta"
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full border-2 border-[var(--academy-card)] object-cover ring-1 ring-[var(--academy-border)]"
                      unoptimized
                    />
                    <Image
                      src="/workshops/vaibhav.jpg"
                      alt="Dr. S. Vaibhav"
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full border-2 border-[var(--academy-card)] object-cover ring-1 ring-[var(--academy-border)]"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 text-[13px] leading-snug">
                    <p className="font-medium text-[var(--academy-text)]">
                      Dr. Bhavna Gupta · Dr. S. Vaibhav
                    </p>
                    <p className="text-[var(--academy-text-muted)]">
                      AIIMS Rishikesh · Startup mentoring
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.28, duration: 0.4, ease }}
                >
                  <MagneticButton
                    href={WORKSHOP_REGISTER_URL}
                    variant="primary"
                    className="!min-h-11"
                  >
                    Register &amp; pay
                    <ArrowUpRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </MagneticButton>
                  <Link
                    href={`/academy/${WORKSHOP_COURSE_ID}`}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 px-2 text-sm font-medium text-[var(--academy-text-muted)] transition-colors hover:text-[var(--academy-sage)]"
                  >
                    Read the clinic brief
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </motion.div>

                <p className="mt-4 text-[11px] leading-relaxed text-[var(--academy-text-muted)]/80">
                  Opens Razorpay. Seat confirms only after payment — receipt
                  emailed to you.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
