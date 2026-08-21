"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { getSiteData } from "@/lib/data";

const ease = [0.22, 1, 0.36, 1] as const;

export function Contact() {
  const site = getSiteData();
  const headerRef = useRef(null);
  const bodyRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });
  const bodyInView = useInView(bodyRef, { once: true, margin: "-40px" });

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-white/6 py-24 md:py-32"
      style={{ background: "var(--surface-0)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 0%, rgba(34,211,165,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          className="max-w-2xl"
          initial={{ opacity: 0, y: 12 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.45, ease }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--text-muted)" }}
          >
            Contact
          </p>
          <h2
            className="mt-5 text-3xl font-semibold leading-[1.08] tracking-[-0.03em] md:text-5xl"
            style={{ color: "var(--text)" }}
          >
            Let&apos;s collaborate
          </h2>
          <p
            className="mt-5 text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Research partnerships, NeuroVision pilots, or Sampoorna — write to
            us.
          </p>
        </motion.div>

        <div
          ref={bodyRef}
          className="mt-16 grid gap-14 lg:mt-20 lg:grid-cols-12 lg:gap-16"
        >
          <motion.div
            className="flex flex-col gap-10 lg:col-span-4"
            initial={{ opacity: 0, y: 12 }}
            animate={bodyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.45, ease }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--text-muted)" }}
              >
                Email
              </p>
              <a
                href={`mailto:${site.email}`}
                className="group mt-3 inline-block text-lg transition-colors md:text-xl"
                style={{ color: "var(--text)" }}
              >
                {site.email}
                <span
                  className="mt-1 block h-px w-0 transition-all duration-300 ease-out group-hover:w-full"
                  style={{ background: "var(--accent)" }}
                />
              </a>
            </div>

            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--text-muted)" }}
              >
                Location
              </p>
              <p
                className="mt-3 text-lg md:text-xl"
                style={{ color: "var(--text)" }}
              >
                {site.location}
              </p>
            </div>

            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--text-muted)" }}
              >
                Response
              </p>
              <p
                className="mt-3 text-lg md:text-xl"
                style={{ color: "var(--text)" }}
              >
                Within 1–2 business days
              </p>
            </div>

            {site.social.linkedin && (
              <a
                href={site.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-auto flex items-center gap-2 border-t border-white/6 pt-8 text-sm transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                LinkedIn
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
          </motion.div>

          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 16 }}
            animate={bodyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: 0.06, ease }}
          >
            <div
              className="rounded-lg border border-white/6 p-6 md:p-10"
              style={{ background: "var(--surface-1)" }}
            >
              <ContactForm />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
