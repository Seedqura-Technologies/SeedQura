"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  GraduationCap,
  Layers,
  Network,
} from "lucide-react";
import {
  fetchPublishedCourses,
  jsonCatalogFallback,
  type CatalogCourse,
} from "@/lib/catalog";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import {
  BranchAccent,
  LeafSilhouette,
  PetalMark,
} from "@/components/academy/BotanicalMarks";

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

function CategoryIcon({ category }: { category: string }) {
  if (category === "Program") {
    return <LeafSilhouette className="h-3.5 w-2.5 text-[var(--academy-sage)]" opacity={0.9} />;
  }
  if (category === "Partnership") {
    return <Network className="h-3.5 w-3.5 text-[var(--academy-text-muted)]" aria-hidden />;
  }
  return <BookOpen className="h-3.5 w-3.5 text-[var(--academy-sage)]" aria-hidden />;
}

function categoryBadgeClass(category: string) {
  if (category === "Partnership") return "academy-badge academy-badge-partnership";
  return "academy-badge";
}

type CardProps = {
  course: CatalogCourse;
  large?: boolean;
  mark?: "leaf" | "branch" | "petal";
};

function AcademyCourseCard({ course, large = false, mark = "leaf" }: CardProps) {
  const detailHref = `/academy/${course.id}`;

  return (
    <article className={`academy-card group relative ${large ? "p-7 md:p-9" : "p-6 md:p-7"}`}>
      <Link
        href={detailHref}
        className="absolute inset-0 z-0 rounded-[18px]"
        aria-label={`View ${course.name} syllabus and details`}
      />

      <div className="academy-card-mark pointer-events-none absolute text-[var(--academy-sage)]" aria-hidden>
        {mark === "branch" ? (
          <BranchAccent className="absolute -right-2 bottom-8 w-36" opacity={0.14} />
        ) : mark === "petal" ? (
          <PetalMark className="absolute -right-1 -top-1 h-20 w-20" opacity={0.16} />
        ) : (
          <LeafSilhouette className="absolute -right-1 -top-2 h-24 w-16" opacity={0.16} />
        )}
      </div>

      <div className="relative flex flex-wrap items-center gap-2">
        <span className={`${categoryBadgeClass(course.category)} gap-1.5`}>
          <CategoryIcon category={course.category} />
          {course.category}
        </span>
        {course.status ? (
          <span className="academy-badge academy-badge-status">{course.status}</span>
        ) : null}
      </div>

      <h3
        className={`relative mt-5 font-semibold tracking-tight text-[var(--academy-text)] ${
          large ? "text-2xl md:text-[1.7rem]" : "text-xl"
        }`}
      >
        {course.name}
      </h3>
      {course.tagline ? (
        <p className="relative mt-1.5 text-sm font-medium text-[var(--academy-sage)]">
          {course.tagline}
        </p>
      ) : null}
      <p
        className={`relative mt-4 flex-1 text-sm leading-relaxed text-[var(--academy-text-muted)] ${
          large ? "md:text-[0.95rem]" : ""
        }`}
      >
        {course.description}
      </p>

      <div className="relative mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--academy-text-muted)]">
        {course.duration ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[var(--academy-sage)]" aria-hidden />
            {course.duration}
          </span>
        ) : null}
        {course.level ? (
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-[var(--academy-sage)]" aria-hidden />
            {course.level}
          </span>
        ) : null}
        {course.format ? (
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[var(--academy-sage)]" aria-hidden />
            {course.format}
          </span>
        ) : null}
      </div>

      {course.features.length > 0 ? (
        <ul className={`relative space-y-2 ${large ? "mt-7" : "mt-5"}`}>
          {course.features.slice(0, large ? 6 : 4).map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-[var(--academy-text)]/85"
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--academy-sage)] transition-transform duration-300 group-hover:scale-110"
                aria-hidden
              />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
        <div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[var(--academy-text-muted)]">
            Price
          </p>
          <p
            className={`mt-1 font-semibold tracking-tight text-[var(--academy-text)] ${
              large ? "text-3xl" : "text-2xl"
            }`}
          >
            {course.priceDisplay}
          </p>
          <Link
            href={detailHref}
            className="relative z-10 mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--academy-sage)] transition-colors hover:text-[var(--academy-text)]"
          >
            View syllabus
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        <MagneticButton
          href={course.cta.href}
          variant={course.featured ? "primary" : "secondary"}
          className={`relative z-10 ${large ? "!min-h-11" : "!min-h-10 !px-5 !text-xs"}`}
        >
          {course.cta.label}
          <ArrowRight
            className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden
          />
        </MagneticButton>
      </div>
    </article>
  );
}

const FEATURED_MARKS: Array<"leaf" | "branch" | "petal"> = ["leaf", "branch"];

export function AcademyCatalog() {
  const courses = usePublishedCourses();
  const featured = courses.filter((c) => c.featured);
  const rest = courses.filter((c) => !c.featured);

  return (
    <section id="courses" className="relative pb-20 pt-2 md:pb-28">
      <div className="academy-section-curve" aria-hidden />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {featured.length > 0 ? (
          <div className="mb-16 md:mb-20">
            <ScrollReveal>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--academy-muted)]">
                Featured
              </p>
            </ScrollReveal>
            <div className="mt-7 grid gap-6 lg:grid-cols-2 lg:gap-8">
              {featured.map((course, i) => (
                <ScrollReveal key={course.id} delay={i * 0.07}>
                  <AcademyCourseCard
                    course={course}
                    large
                    mark={FEATURED_MARKS[i % FEATURED_MARKS.length]}
                  />
                </ScrollReveal>
              ))}
            </div>
          </div>
        ) : null}

        {rest.length > 0 ? (
          <div>
            <ScrollReveal>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--academy-muted)]">
                All courses
              </p>
            </ScrollReveal>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {rest.map((course, i) => (
                <ScrollReveal key={course.id} delay={i * 0.05}>
                  <AcademyCourseCard
                    course={course}
                    mark={i % 3 === 0 ? "leaf" : i % 3 === 1 ? "petal" : "branch"}
                  />
                </ScrollReveal>
              ))}
            </div>
          </div>
        ) : null}

        <ScrollReveal className="mt-20 md:mt-24">
          <div className="academy-cta-panel px-7 py-10 text-center md:px-14 md:py-14">
            <LeafSilhouette
              className="pointer-events-none absolute -left-2 top-4 h-28 w-20 text-[var(--academy-sage)]"
              opacity={0.14}
            />
            <BranchAccent
              className="pointer-events-none absolute -right-4 bottom-6 w-44 text-[var(--academy-muted)]"
              opacity={0.16}
            />
            <p className="relative text-xs font-medium uppercase tracking-[0.24em] text-[var(--academy-sage)]">
              Custom learning
            </p>
            <h2 className="relative mx-auto mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-[var(--academy-text)] md:text-3xl">
              Custom learning for institutions and teams
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--academy-text-muted)] md:text-lg">
              Need a cohort program for your institution or team? We design
              research-focused curricula around your domain and deployment goals.
            </p>
            <div className="relative mt-8">
              <MagneticButton href="/#contact" variant="primary" className="!min-h-11">
                Talk to us
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </MagneticButton>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
