"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
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
        <p className="mt-4 text-center text-xs leading-relaxed text-[var(--academy-text-muted)]">
          {detail.ctaHeadline}
        </p>
      </div>

      <div className="academy-detail-panel p-5">
        <SectionHeading>Tools</SectionHeading>
        <p className="mt-3 text-sm leading-relaxed text-[var(--academy-text)]">{detail.tools}</p>
      </div>

      <div className="academy-detail-panel p-5">
        <SectionHeading>Prerequisites</SectionHeading>
        <p className="mt-3 text-sm leading-relaxed text-[var(--academy-text)]">
          {detail.prerequisites}
        </p>
      </div>

      <div className="academy-detail-panel p-5">
        <SectionHeading>Who it&apos;s for</SectionHeading>
        <p className="mt-3 text-sm leading-relaxed text-[var(--academy-text)]">{detail.audience}</p>
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
          <header className="mt-8 max-w-3xl">
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
            {course.description ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--academy-text-muted)]">
                {course.description}
              </p>
            ) : null}
          </header>
        </ScrollReveal>

        {/* Mobile enroll card — shown before main grid on small screens */}
        <ScrollReveal className="mt-8 lg:hidden">
          <EnrollSidebar course={course} detail={detail} />
        </ScrollReveal>

        <div className="mt-10 grid items-start gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-14">
          <div className="min-w-0 space-y-12 md:space-y-14">
            <ScrollReveal delay={0.05}>
              <div className="academy-detail-hero lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:items-center">
                <div>
                  <p className="text-xl font-semibold leading-snug text-[var(--academy-text)] md:text-2xl">
                    {detail.heroHeadline}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--academy-text-muted)]">
                    {detail.heroSubline}
                  </p>
                </div>
                <div className="mt-6 rounded-2xl border border-[var(--academy-border)] bg-black/20 p-5 lg:mt-0">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[var(--academy-muted)]">
                    Project story
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--academy-sage)]">
                    {detail.projectStory}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {detail.uspChips.map((chip) => (
                      <span key={chip} className="academy-detail-chip">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {detail.premiumBlurb ? (
              <ScrollReveal delay={0.09}>
                <section>
                  <SectionHeading>What makes this premium</SectionHeading>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--academy-text-muted)] md:text-base">
                    {detail.premiumBlurb}
                  </p>
                </section>
              </ScrollReveal>
            ) : null}

            <ScrollReveal delay={0.08}>
              <section>
                <SectionHeading>What you&apos;ll learn</SectionHeading>
                <ul className="mt-6 grid gap-3 md:grid-cols-2 md:gap-x-8 md:gap-y-4">
                  {detail.learnings.map((item) => (
                    <li
                      key={item}
                      className="academy-detail-learn-item flex items-start gap-3 text-sm leading-relaxed text-[var(--academy-text)]/90"
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
              <section>
                <SectionHeading>What you&apos;ll walk away with</SectionHeading>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {detail.deliverables.map((item) => (
                    <div key={item.label} className="academy-detail-panel p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--academy-sage)]">
                        {item.label}
                      </p>
                      <p className="mt-2 font-semibold text-[var(--academy-text)]">{item.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--academy-text-muted)]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </ScrollReveal>

            {detail.researchTracks && detail.researchTracks.length > 0 ? (
              <ScrollReveal delay={0.11}>
                <section>
                  <SectionHeading>Research groups & projects</SectionHeading>
                  <p className="mt-3 text-sm text-[var(--academy-text-muted)]">
                    30 students · 5 groups · 6 per group · one core problem per group.
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {detail.researchTracks.map((track) => (
                      <div key={track.title} className="academy-detail-panel p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--academy-sage)]">
                          {track.title}
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--academy-text)]/90">
                          {track.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            ) : null}

            {detail.programMonths && detail.programMonths.length > 0 ? (
              <ScrollReveal delay={0.12}>
                <section>
                  <SectionHeading>Program journey</SectionHeading>
                  <p className="mt-3 text-sm font-medium text-[var(--academy-text)]">
                    Learn, practice, experiment, collaborate, build, demonstrate.
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {detail.programMonths.map((row) => (
                      <div key={row.label} className="academy-detail-week-card p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--academy-sage)]">
                          {row.label}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--academy-text)]">
                          {row.theme}
                        </p>
                      </div>
                    ))}
                  </div>
                  {detail.liveTrainingLine ? (
                    <p className="mt-4 text-sm leading-relaxed text-[var(--academy-text-muted)]">
                      {detail.liveTrainingLine}
                    </p>
                  ) : null}
                </section>
              </ScrollReveal>
            ) : null}

            {detail.honestyLines && detail.honestyLines.length > 0 ? (
              <ScrollReveal delay={0.13}>
                <ul className="space-y-2 text-xs leading-relaxed text-[var(--academy-text-muted)]">
                  {detail.honestyLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </ScrollReveal>
            ) : null}
          </div>

          {/* Desktop sticky sidebar */}
          <ScrollReveal delay={0.06} className="hidden lg:block">
            <EnrollSidebar course={course} detail={detail} />
          </ScrollReveal>
        </div>
      </div>
    </article>
  );
}
