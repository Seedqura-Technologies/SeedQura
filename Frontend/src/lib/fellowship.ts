/** Research Fellowship — application vs payment are separate steps. */

export const RESEARCH_FELLOWSHIP_ID = "research-fellowship";

/** Public application form (LinkedIn + website Apply for Selection). */
export const RESEARCH_FELLOWSHIP_APPLY_URL =
  "https://forms.gle/DnkQ8Km3GTPzqwjr6";

export const RESEARCH_FELLOWSHIP_PAY_PATH = `/enroll/${RESEARCH_FELLOWSHIP_ID}`;

export function isResearchFellowship(courseId: string) {
  return courseId === RESEARCH_FELLOWSHIP_ID;
}

export function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}
