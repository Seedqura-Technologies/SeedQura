"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  fetchPublishedCourses,
  jsonCatalogFallback,
  type CatalogCourse,
} from "@/lib/catalog";
import type { LabCourseDetail } from "@/content/academy/lab-courses";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { LeafSilhouette } from "@/components/academy/BotanicalMarks";

type Props = {
  courseId: string;
  detail: LabCourseDetail;
};

function useCourse(courseId: string) {
  const [course, setCourse] = useState<CatalogCourse | null>(
    () => jsonCatalogFallback().find((c) => c.id === courseId) ?? null
  );

  useEffect(() => {
    let cancelled = false;
    fetchPublishedCourses().then((list) => {
      if (cancelled) return;
      setCourse(
        list.find((c) => c.id === courseId) ??
          jsonCatalogFallback().find((c) => c.id === courseId) ??
          null
      );
    });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return course;
}

export function AcademyCourseDetailView({ courseId, detail }: Props) {
  const course = useCourse(courseId);

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="text-[var(--academy-text-muted)]">Course not found.</p>
        <Link
          href="/academy#courses"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--academy-sage)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <article className="relative pb-20 pt-6 md:pb-28 md:pt-10">
      <LeafSilhouette
        className="academy-hide-mobile-deco pointer-events-none absolute right-4 top-8 h-32 w-24 text-[var(--academy-sage)]"
        opacity={0.1}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/academy#courses"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--academy-text-muted)] transition-colors hover:text-[var(--academy-sage)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All courses
        </Link>

        <ScrollReveal>
          <header className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="academy-badge">{course.category}</span>
              {course.status ? (
                <span className="academy-badge academy-badge-status">{course.status}</span>
              ) : null}
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--academy-text)] md:text-4xl">
              {course.name}
            </h1>
            {course.tagline ? (
              <p className="mt-2 text-lg font-medium text-[var(--academy-sage)]">
                {course.tagline}
              </p>
            ) : null}
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <div className="academy-detail-hero mt-10">
            <p className="text-xl font-semibold leading-snug text-[var(--academy-text)] md:text-2xl">
              {detail.heroHeadline}
            </p>
            <p className="mt-3 text-sm text-[var(--academy-text-muted)]">
              {detail.heroSubline} · project story:{" "}
              <span className="font-medium text-[var(--academy-sage)]">
                {detail.projectStory}
              </span>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {detail.uspChips.map((chip) => (
                <span key={chip} className="academy-detail-chip">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--academy-muted)]">
              What you&apos;ll learn
            </h2>
            <ul className="mt-5 space-y-3">
              {detail.learnings.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-[var(--academy-text)]/90"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--academy-sage)]"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--academy-muted)]">
              What you&apos;ll walk away with
            </h2>
            <div className="mt-5 space-y-3">
              {detail.deliverables.map((item) => (
                <div key={item.label} className="academy-detail-panel p-4 md:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--academy-sage)]">
                    {item.label}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--academy-text)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--academy-text-muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.12}>
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--academy-muted)]">
              Course arc
            </h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--academy-border)]">
              <table className="academy-detail-table w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium text-[var(--academy-sage)]">Week</th>
                    <th className="px-4 py-3 font-medium text-[var(--academy-sage)]">Theme</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.arc.map((row) => (
                    <tr key={row.week}>
                      <td className="px-4 py-3 font-medium text-[var(--academy-text)]">
                        {row.week}
                      </td>
                      <td className="px-4 py-3 text-[var(--academy-text-muted)]">
                        {row.theme}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.14}>
          <section className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="academy-detail-panel p-5">
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--academy-muted)]">
                Tools
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--academy-text)]">
                {detail.tools}
              </p>
            </div>
            <div className="academy-detail-panel p-5">
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--academy-muted)]">
                Prerequisites
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--academy-text)]">
                {detail.prerequisites}
              </p>
            </div>
          </section>

          <div className="academy-detail-panel mt-6 p-5">
            <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--academy-muted)]">
              Who it&apos;s for
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--academy-text)]">
              {detail.audience}
            </p>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-[var(--academy-text-muted)]">
            {detail.trustLine}
          </p>
          {detail.ecosystemLine ? (
            <p className="mt-2 text-xs leading-relaxed text-[var(--academy-sage)]/90">
              {detail.ecosystemLine}
            </p>
          ) : null}
        </ScrollReveal>

        <ScrollReveal delay={0.16}>
          <div className="mt-10 flex flex-wrap gap-2">
            {detail.microcopy.map((line) => (
              <span key={line} className="academy-detail-chip opacity-80">
                {line}
              </span>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.18}>
          <div className="academy-cta-panel mt-12 px-6 py-8 text-center md:px-10 md:py-10">
            <p className="text-lg font-semibold text-[var(--academy-text)] md:text-xl">
              {detail.ctaHeadline}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--academy-text)]">
              {course.priceDisplay}
            </p>
            <p className="mt-1 text-sm text-[var(--academy-text-muted)]">
              {course.duration} · {course.format}
            </p>
            <div className="mt-6">
              <MagneticButton href={course.cta.href} variant="primary" className="!min-h-11">
                {course.cta.label}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </MagneticButton>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </article>
  );
}
