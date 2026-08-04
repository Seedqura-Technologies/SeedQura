"use client";

import { Check, Clock, GraduationCap, Layers } from "lucide-react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  fetchPublishedCourses,
  jsonCatalogFallback,
  type CatalogCourse,
} from "@/lib/catalog";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { TextureBackground } from "@/components/effects/TextureBackground";
import { DepthField } from "@/components/effects/DepthField";

const categoryStyles: Record<string, string> = {
  Program: "border-accent/30 text-accent bg-accent/5",
  Course: "border-accent-warm/30 text-accent-warm bg-accent-warm/5",
  Partnership: "border-[var(--glass-border)] text-muted bg-white/40",
};

function usePublishedCourses() {
  const [courses, setCourses] = useState<CatalogCourse[]>(jsonCatalogFallback);
  useEffect(() => {
    let cancelled = false;
    fetchPublishedCourses().then((list) => {
      if (!cancelled) setCourses(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return courses;
}

export function ProductsHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <TextureBackground variant="section" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          Products
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-medium leading-[1.12] tracking-tight text-text md:text-6xl">
          Learn from researchers building real systems
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
          Courses and programs in AI for agriculture and precision medicine —
          structured, mentor-led, and designed for outcomes you can show.
        </p>
      </div>
    </section>
  );
}

export function CourseCatalog() {
  const courses = usePublishedCourses();
  const featured = courses.filter((c) => c.featured);
  const rest = courses.filter((c) => !c.featured);

  return (
    <section className="section-padding pt-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {featured.length > 0 && (
          <div className="mb-20">
            <ScrollReveal>
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                Featured
              </h2>
            </ScrollReveal>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {featured.map((course, i) => (
                <ScrollReveal key={course.id} delay={i * 0.08}>
                  <CourseCard course={course} large />
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <ScrollReveal>
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
                All courses
              </h2>
            </ScrollReveal>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((course, i) => (
                <ScrollReveal key={course.id} delay={i * 0.06}>
                  <CourseCard course={course} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}

        <ScrollReveal className="mt-24">
          <div className="glass-card mx-auto max-w-3xl p-10 text-center md:p-14">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent-warm">
              Custom learning
            </p>
            <p className="mt-5 text-xl leading-relaxed text-text md:text-2xl">
              Need a cohort program for your institution or team? We design
              custom curricula around your domain and deployment goals.
            </p>
            <div className="mt-8">
              <MagneticButton href="/#contact" variant="secondary">
                Talk to us
              </MagneticButton>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

type CourseCardProps = {
  course: CatalogCourse;
  large?: boolean;
};

function CourseCard({ course, large = false }: CourseCardProps) {
  const categoryClass =
    categoryStyles[course.category] ?? categoryStyles.Partnership;
  const ctaHref = course.cta.href;

  return (
    <article
      className={`group glass-card flex h-full flex-col ${large ? "p-8 md:p-10" : "p-6 md:p-8"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${categoryClass}`}
        >
          {course.category}
        </span>
        {course.status && (
          <span className="rounded-full border border-accent/20 px-3 py-1 text-xs text-accent">
            {course.status}
          </span>
        )}
      </div>

      <h3
        className={`mt-5 font-medium text-text ${large ? "text-2xl md:text-3xl" : "text-xl"}`}
      >
        {course.name}
      </h3>
      <p className="mt-1 text-sm font-medium text-accent">{course.tagline}</p>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted md:text-base">
        {course.description}
      </p>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover:scale-110" />
          {course.duration}
        </span>
        <span className="flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover:scale-110" />
          {course.level}
        </span>
        <span className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-accent transition-transform duration-300 group-hover:scale-110" />
          {course.format}
        </span>
      </div>

      {course.features.length > 0 && (
        <ul className={`space-y-2.5 ${large ? "mt-8" : "mt-6"}`}>
          {course.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-text/80"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-hover:scale-110" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Price</p>
          <p
            className={`font-medium text-text ${large ? "text-3xl" : "text-2xl"}`}
          >
            {course.priceDisplay}
          </p>
        </div>
        <MagneticButton
          href={ctaHref}
          variant={course.featured ? "primary" : "secondary"}
          className={large ? "" : "!min-h-10 !px-5 !text-xs"}
        >
          {course.cta.label}
        </MagneticButton>
      </div>
    </article>
  );
}

export function ProductsPreview() {
  const all = usePublishedCourses();
  const courses = all.filter((c) => c.featured).slice(0, 2);
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });
  const cardsInView = useInView(cardsRef, { once: true, margin: "-40px" });

  return (
    <section id="products" className="section-padding relative overflow-hidden">
      <DepthField tone="accent" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
          initial={{ opacity: 0, y: 12 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-accent">
              Products
            </p>
            <h2 className="text-3xl font-medium leading-[1.15] tracking-tight text-text md:text-5xl">
              Courses built for real research
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              From mentorship programs to focused technical courses — learn
              skills that transfer to field and clinic.
            </p>
          </div>
          <Link
            href="/products"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-text"
          >
            View all courses
            <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>

        <div ref={cardsRef} className="mt-16 grid gap-6 md:grid-cols-2">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={
                cardsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
              }
              transition={{
                duration: 0.4,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="h-full"
            >
              <CourseCard course={course} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
