/** Research Fellowship — application vs payment are separate steps. */

export const RESEARCH_FELLOWSHIP_ID = "research-fellowship";

/** Full program fee (amount-locked UPI QR). */
export const RESEARCH_FELLOWSHIP_FULL_INR = 19999;

/** Monthly installment option (amount-locked UPI QR) — soft entry vs full fee. */
export const RESEARCH_FELLOWSHIP_MONTHLY_INR = 6999;

export const RESEARCH_FELLOWSHIP_PAYMENT_AMOUNTS = [
  RESEARCH_FELLOWSHIP_FULL_INR,
  RESEARCH_FELLOWSHIP_MONTHLY_INR,
] as const;

export type ResearchFellowshipPaymentPlan = "full" | "monthly";

/** Public application form (LinkedIn + website Apply for Selection). */
export const RESEARCH_FELLOWSHIP_APPLY_URL =
  "https://forms.gle/DnkQ8Km3GTPzqwjr6";

export const RESEARCH_FELLOWSHIP_PAY_PATH = `/enroll/${RESEARCH_FELLOWSHIP_ID}`;

/** Pay section anchor — use in login `next` and deep links. */
export const RESEARCH_FELLOWSHIP_PAY_ANCHOR = `${RESEARCH_FELLOWSHIP_PAY_PATH}#pay`;

export function isResearchFellowship(courseId: string) {
  return courseId === RESEARCH_FELLOWSHIP_ID;
}

export function fellowshipAmountForPlan(
  plan: ResearchFellowshipPaymentPlan
): number {
  return plan === "monthly"
    ? RESEARCH_FELLOWSHIP_MONTHLY_INR
    : RESEARCH_FELLOWSHIP_FULL_INR;
}

export function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}
