/** Shared URL helpers for scheduling / session inputs. */

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Empty / null is allowed; non-empty must be http(s). */
export function normalizeOptionalHttpUrl(
  value: unknown
): { ok: true; url: string | null } | { ok: false; error: string } {
  if (value == null) return { ok: true, url: null };
  const trimmed = String(value).trim();
  if (!trimmed) return { ok: true, url: null };
  if (!isHttpUrl(trimmed)) {
    return { ok: false, error: "meeting_url must be an http(s) URL" };
  }
  return { ok: true, url: trimmed };
}
