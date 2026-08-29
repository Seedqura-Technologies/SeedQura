/** Research Fellowship — payment only after admin adds email to allow-list. */

export const RESEARCH_FELLOWSHIP_ID = "research-fellowship";

const FELLOWSHIP_PAYMENT_MESSAGE =
  "Fellowship payment opens only after selection. Check your email for a payment link, or contact gethelp.seedqura@gmail.com if you were selected.";

function parseAllowList(): Set<string> {
  const raw = process.env.FELLOWSHIP_SELECTED_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function fellowshipPaymentBlocked(
  courseId: string,
  email: string | undefined
): { blocked: true; message: string } | { blocked: false } {
  if (courseId !== RESEARCH_FELLOWSHIP_ID) return { blocked: false };

  const allow = parseAllowList();
  const normalized = email?.trim().toLowerCase();

  if (!normalized || !allow.has(normalized)) {
    return { blocked: true, message: FELLOWSHIP_PAYMENT_MESSAGE };
  }

  return { blocked: false };
}
