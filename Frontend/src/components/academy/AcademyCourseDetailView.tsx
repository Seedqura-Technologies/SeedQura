"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  GraduationCap,
  Layers,
} from "lucide-react";
import {
  fetchPublishedCourses,
  jsonCatalogFallback,
  type CatalogCourse,
} from "@/lib/catalog";
import type { LabCourseDetail } from "@/content/academy/lab-courses";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { BranchAccent, LeafSilhouette } from "@/components/academy/BotanicalMarks";
import {
  isResearchFellowship,
  RESEARCH_FELLOWSHIP_PAY_PATH,
} from "@/lib/fellowship";

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

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--academy-muted)]">
      {children}
    </h2>
  );
}

function EnrollSidebar({ course, detail }: { course: CatalogCourse; detail: LabCourseDetail }) {
  const feeLabel = course.category === "Program" ? "Program fee" : "Course fee";

  return (
    <div className="academy-detail-sidebar space-y-5">
      <div className="academy-detail-sidebar-card p-6">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[var(--academy-text-muted)]">
          {feeLabel}
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--academy-text)]">
          {course.priceDisplay}
        </p>
        <ul className="mt-5 space-y-3 text-sm text-[var(--academy-text-muted)]">
          {course.duration ? (
            <li className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-[var(--academy-sage)]" aria-hidden />
              {course.duration}
            </li>
          ) : null}
          {course.level ? (
            <li className="flex items-center gap-2.5">
              <GraduationCap className="h-4 w-4 shrink-0 text-[var(--academy-sage)]" aria-hidden />
              {course.level}
            </li>
          ) : null}
          {course.format ? (
            <li className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 shrink-0 text-[var(--academy-sage)]" aria-hidden />
              {course.format}
            </li>
          ) : null}
        </ul>
        <div className="mt-6">
          <MagneticButton href={course.cta.href} variant="primary" className="w-full !min-h-11">
            {course.cta.label}
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
          </MagneticButton>
        </div>
        {isResearchFellowship(course.id) ? (
          <p className="mt-4 text-center text-xs leading-relaxed text-[var(--academy-text-muted)]">
            {detail.ctaHeadline}{" "}
            <Link
              href={RESEARCH_FELLOWSHIP_PAY_PATH}
              className="text-[var(--academy-sage)] hover:text-[var(--academy-text)]"
            >
              Pay here after offer
            </Link>
          </p>
        ) : (
          <p className="mt-4 text-center text-xs leading-relaxed text-[var(--academy-text-muted)]">
            {detail.ctaHeadline}
          </p>
        )}
      </div>

      <div className="academy-detail-panel p-5">
        <SectionHeading>Before you start</SectionHeading>
        <p className="mt-3 text-sm leading-relaxed text-[var(--academy-text)]">
          {detail.prerequisites}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--academy-text-muted)]">
          {detail.audience}
        </p>
      </div>

      <p className="px-1 text-xs leading-relaxed text-[var(--academy-text-muted)]">
        {detail.trustLine}
      </p>
      {detail.ecosystemLine ? (
        <p className="px-1 text-xs leading-relaxed text-[var(--academy-sage)]/90">
          {detail.ecosystemLine}
        </p>
      ) : null}
    </div>
  );
}

export function AcademyCourseDetailView({ courseId, detail }: Props) {
  const course = useCourse(courseId);

  if (!course) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
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
    <article className="academy-detail-page relative pb-20 pt-6 md:pb-28 md:pt-10">
      <LeafSilhouette
        className="academy-hide-mobile-deco pointer-events-none absolute right-6 top-10 h-36 w-24 text-[var(--academy-sage)]"
        opacity={0.08}
      />
      <BranchAccent
        className="academy-hide-mobile-deco pointer-events-none absolute left-4 top-32 w-40 text-[var(--academy-muted)]"
        opacity={0.1}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/academy#courses"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--academy-text-muted)] transition-colors hover:text-[var(--academy-sage)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All courses
        </Link>

        <ScrollReveal>
          <header className="mt-8 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="academy-badge">{course.category}</span>
              {course.status ? (
                <span className="academy-badge academy-badge-status">{course.status}</span>
              ) : null}
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--academy-text)] md:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              {course.name}
            </h1>
            {course.tagline ? (
              <p className="mt-3 text-lg font-medium text-[var(--academy-sage)] md:text-xl">
                {course.tagline}
              </p>
            ) : null}
          </header>
        </ScrollReveal>

        <ScrollReveal className="mt-8 lg:hidden">
          <EnrollSidebar course={course} detail={detail} />
        </ScrollReveal>

        <div className="mt-10 grid items-start gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-14">
          <div className="min-w-0 space-y-10 md:space-y-12">
            <ScrollReveal delay={0.05}>
              <div className="max-w-2xl">
                <p className="text-xl font-semibold leading-snug text-[var(--academy-text)] md:text-2xl">
                  {detail.heroHeadline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--academy-text-muted)]">
                  {detail.heroSubline}
                </p>
                <p className="mt-4 text-sm font-medium text-[var(--academy-sage)]">
                  Project: {detail.projectStory}
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

            {detail.premiumBlurb ? (
              <ScrollReveal delay={0.07}>
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--academy-text-muted)] md:text-base">
                  {detail.premiumBlurb}
                </p>
              </ScrollReveal>
            ) : null}

            <ScrollReveal delay={0.08}>
              <section className="max-w-2xl">
                <SectionHeading>Outcomes</SectionHeading>
                <ul className="mt-5 space-y-3">
                  {detail.learnings.map((item) => (
                    <li
                      key={item}
                      className="text-sm leading-relaxed text-[var(--academy-text)]/90"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <section>
                <SectionHeading>Artifacts</SectionHeading>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {detail.deliverables.map((item) => (
                    <div key={item.label} className="academy-detail-panel p-4">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--academy-sage)]">
                        {item.label}
                      </p>
                      <p className="mt-1.5 font-semibold text-[var(--academy-text)]">
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

            {detail.honestyLines && detail.honestyLines.length > 0 ? (
              <ScrollReveal delay={0.11}>
                <ul className="max-w-2xl space-y-2 text-xs leading-relaxed text-[var(--academy-text-muted)]">
                  {detail.honestyLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </ScrollReveal>
            ) : null}
          </div>

          <ScrollReveal delay={0.06} className="hidden lg:block">
            <EnrollSidebar course={course} detail={detail} />
          </ScrollReveal>
        </div>
      </div>
    </article>
  );
}
