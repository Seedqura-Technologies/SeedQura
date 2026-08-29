/** Canonical display strings — must match amount-locked UPI QR codes. */
const CANONICAL_BY_INR: Record<number, string> = {
  4999: "₹4,999",
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
