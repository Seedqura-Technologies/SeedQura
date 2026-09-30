import type { CatalogCourse } from "@/lib/catalog";

/** Live Razorpay Payment Page — AI Healthcare workshop */
export const WORKSHOP_REGISTER_URL = "https://rzp.io/rzp/b8KUI9s";

export const WORKSHOP_COURSE_ID = "ai-healthcare-clinic";

export const WORKSHOP_STORAGE_KEY =
  "seedqura.workshop.promo.ai-healthcare-2026-10";

/** Hide after workshop weekend (IST) */
export const WORKSHOP_EXPIRES_AT = Date.parse("2026-10-05T23:59:59+05:30");

export function isWorkshopCourseId(id: string): boolean {
  return id === WORKSHOP_COURSE_ID;
}

export function isWorkshopActive(now = Date.now()): boolean {
  return now <= WORKSHOP_EXPIRES_AT;
}

/** Catalog row — not platform-enrolled; pays via Razorpay Payment Page */
export function workshopCatalogCourse(): CatalogCourse {
  return {
    id: WORKSHOP_COURSE_ID,
    name: "AI Care Clinic",
    tagline: "Where the ward meets the whiteboard.",
    description:
      "Two live mornings with an AIIMS clinician and a startup builder — AI on the care floor, judgment that stays human, and how medical products actually ship.",
    category: "Live",
    level: "Open to all curious minds",
    duration: "3 & 4 Oct · 10:00–12:00 IST",
    format: "Live online · certificate included",
    priceDisplay: "₹499",
    priceSecondary: null,
    priceNote: "Secure Razorpay checkout · registered after payment",
    status: "This weekend",
    featured: true,
    features: [
      "AIIMS Rishikesh clinical perspective",
      "Startup building for healthcare AI",
      "Certificate of participation",
    ],
    price_inr: 499,
    cta: {
      label: "Register & pay",
      href: WORKSHOP_REGISTER_URL,
    },
  };
}

export function applyWorkshopCta(course: CatalogCourse): CatalogCourse {
  if (!isWorkshopCourseId(course.id)) return course;
  return {
    ...course,
    category: course.category || "Live",
    cta: {
      label: "Register & pay",
      href: WORKSHOP_REGISTER_URL,
    },
    priceNote:
      course.priceNote ||
      "Secure Razorpay checkout · registered after payment",
  };
}

/** Inject / refresh the live clinic into any catalog list while active */
export function withLiveWorkshop(courses: CatalogCourse[]): CatalogCourse[] {
  const mapped = courses.map(applyWorkshopCta);
  if (!isWorkshopActive()) {
    return mapped.filter((c) => !isWorkshopCourseId(c.id));
  }
  if (mapped.some((c) => isWorkshopCourseId(c.id))) return mapped;
  return [workshopCatalogCourse(), ...mapped];
}
