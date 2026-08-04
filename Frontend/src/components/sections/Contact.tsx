"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight, Clock3, Mail, MapPin } from "lucide-react";
import { ContactForm, contactSubjects } from "@/components/forms/ContactForm";
import { DepthField } from "@/components/effects/DepthField";
import { getSiteData } from "@/lib/data";

const topicHints: Record<string, string> = {
  "General Inquiry": "Questions about Seedqura",
  Partnership: "Pilots & institutional work",
  Academy: "Mentorship & enrollment",
  "Research Collaboration": "Joint research & papers",
};

export function Contact() {
  const site = getSiteData();
  const [subject, setSubject] = useState("");
  const headerRef = useRef(null);
  const bodyRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });
  const bodyInView = useInView(bodyRef, { once: true, margin: "-40px" });

  return (
    <section id="contact" className="section-padding relative overflow-hidden">
      <DepthField tone="warm" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-accent">
            Contact
          </p>
          <h2 className="text-3xl font-medium leading-[1.15] tracking-tight text-text md:text-5xl">
            Let&apos;s collaborate
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Research partnerships, pilot programs, or Academy inquiries — we&apos;d
            like to hear from you.
          </p>
        </motion.div>

        <div ref={bodyRef} className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-5 lg:gap-12">
          <motion.div
            className="flex flex-col gap-8 lg:col-span-2"
            initial={{ opacity: 0, y: 12 }}
            animate={bodyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-5">
              <div className="flex gap-3">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/50">
                  <Mail className="h-4 w-4 text-accent" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                    Email
                  </p>
                  <a
                    href={`mailto:${site.email}`}
                    className="group mt-1 inline-block text-lg text-text transition-colors hover:text-accent"
                  >
                    {site.email}
                    <span className="mt-1 block h-px w-0 bg-accent transition-all duration-300 ease-out group-hover:w-full" />
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/50">
                  <MapPin className="h-4 w-4 text-accent" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                    Location
                  </p>
                  <p className="mt-1 text-lg text-text">{site.location}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-white/50">
                  <Clock3 className="h-4 w-4 text-accent" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                    Response
                  </p>
                  <p className="mt-1 text-lg text-text">Within 1–2 business days</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                What can we help with?
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {contactSubjects.map((topic) => {
                  const active = subject === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setSubject(topic)}
                      className={`rounded-full border px-3.5 py-2 text-left text-sm transition-all duration-200 ${
                        active
                          ? "border-accent/40 bg-accent/10 text-text"
                          : "border-[var(--glass-border)] bg-white/40 text-muted hover:border-accent/30 hover:text-text"
                      }`}
                    >
                      <span className="block font-medium text-text">{topic}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {topicHints[topic]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto space-y-3 border-t border-[var(--glass-border)] pt-6">
              {site.social.linkedin && (
                <a
                  href={site.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between text-sm text-muted transition-colors hover:text-text"
                >
                  LinkedIn
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              )}
              <Link
                href="/apply"
                className="group flex items-center justify-between text-sm text-muted transition-colors hover:text-text"
              >
                Apply to Seedqura Academy
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/products"
                className="group flex items-center justify-between text-sm text-muted transition-colors hover:text-text"
              >
                Browse courses
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 16 }}
            animate={bodyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{
              duration: 0.45,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="glass-card p-6 md:p-10">
              <ContactForm subject={subject} onSubjectChange={setSubject} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
