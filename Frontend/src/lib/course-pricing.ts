/** Canonical display strings — must match amount-locked UPI QR codes. */
const CANONICAL_BY_INR: Record<number, string> = {
  4999: "₹4,999",
  6999: "₹6,999 / month",
  19999: "₹19,999 · incl. GST",
};

export function displayCoursePrice(
  priceInr: number | null | undefined,
  priceDisplay?: string | null
): string {
  if (priceInr != null && CANONICAL_BY_INR[priceInr]) {
    return CANONICAL_BY_INR[priceInr];
  }
  if (priceDisplay?.trim()) return priceDisplay.trim();
  if (priceInr == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(priceInr);
}

/**
 * Public marketing price for Research Fellowship.
 * Lead with monthly so ₹19,999 is not the first number students see;
 * keep full fee visible as secondary honesty.
 */
export type MarketingPrice = {
  /** Big number on cards / fee sidebar */
  hero: string;
  /** Smaller line under hero (optional) */
  secondary: string | null;
  /** Microcopy near CTA (optional) */
  note: string | null;
};

export function fellowshipMarketingPrice(): MarketingPrice {
  return {
    hero: "₹6,999/mo",
    secondary: "or ₹19,999 full · incl. GST",
    note: "Apply free · pay only if selected",
  };
}

export function marketingPriceForCourse(
  courseId: string,
  priceInr: number | null | undefined,
  priceDisplay?: string | null
): MarketingPrice {
  if (courseId === "research-fellowship") {
    return fellowshipMarketingPrice();
  }
  return {
    hero: displayCoursePrice(priceInr, priceDisplay),
    secondary: null,
    note: null,
  };
}
