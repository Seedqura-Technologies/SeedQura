/** Research Fellowship — payment only after admin adds email via Admin → Fellowship. */

import { loadFellowshipAllowListEmails } from "./fellowship-selections.js";

export const RESEARCH_FELLOWSHIP_ID = "research-fellowship";

export const FELLOWSHIP_PAYMENT_MESSAGE =
  "Fellowship payment opens only after selection. Check your email for a payment link, or contact gethelp.seedqura@gmail.com if you were selected.";

const ALLOW_LIST_CACHE_TTL_MS = 30_000;
let allowListCache: { emails: Set<string>; expiresAt: number } | null = null;

export function invalidateFellowshipAllowListCache(): void {
  allowListCache = null;
}

async function getAllowList(): Promise<Set<string>> {
  if (allowListCache && allowListCache.expiresAt > Date.now()) {
    return allowListCache.emails;
  }
  const emails = await loadFellowshipAllowListEmails();
  allowListCache = {
    emails,
    expiresAt: Date.now() + ALLOW_LIST_CACHE_TTL_MS,
  };
  return emails;
}

/** Sync check — use in tests or when allow-list is already loaded. */
export function checkFellowshipPayment(
  courseId: string,
  email: string | undefined,
  allow: Set<string>
): { blocked: true; message: string } | { blocked: false } {
  if (courseId !== RESEARCH_FELLOWSHIP_ID) return { blocked: false };

  const normalized = email?.trim().toLowerCase();
  if (!normalized || !allow.has(normalized)) {
    return { blocked: true, message: FELLOWSHIP_PAYMENT_MESSAGE };
  }

  return { blocked: false };
}

export async function fellowshipPaymentBlocked(
  courseId: string,
  email: string | undefined
): Promise<{ blocked: true; message: string } | { blocked: false }> {
  const allow = await getAllowList();
  return checkFellowshipPayment(courseId, email, allow);
}
