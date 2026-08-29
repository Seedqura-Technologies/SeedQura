import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

type CachedToken = {
  token: string;
  /** Epoch ms when we should re-read the session */
  expiresAt: number;
};

let tokenCache: CachedToken | null = null;
let tokenInFlight: Promise<string | null> | null = null;
let warmInFlight: Promise<boolean> | null = null;
let lastWarmOkAt = 0;

function clearTokenCache() {
  tokenCache = null;
}

/**
 * Ping the Express API so Render can leave sleep before dashboard calls.
 * Free-tier Render spins down after idle; first request can take 30–60s.
 */
export async function warmApi(timeoutMs = 55_000): Promise<boolean> {
  if (Date.now() - lastWarmOkAt < 90_000) return true;
  if (warmInFlight) return warmInFlight;

  warmInFlight = (async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        signal: ctrl.signal,
      });
      if (res.ok) {
        lastWarmOkAt = Date.now();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
      warmInFlight = null;
    }
  })();

  return warmInFlight;
}

/** Prefer cached session token; refresh only when missing/near expiry. */
export async function getAccessToken(
  options: { force?: boolean } = {}
): Promise<string | null> {
  const now = Date.now();
  if (
    !options.force &&
    tokenCache &&
    tokenCache.expiresAt > now + 15_000
  ) {
    return tokenCache.token;
  }

  if (!options.force && tokenInFlight) return tokenInFlight;

  tokenInFlight = (async () => {
    try {
      const supabase = createClient();
      if (!supabase) return null;

      const { data } = await supabase.auth.getSession();
      let session = data.session;

      const expiresAtMs = (session?.expires_at ?? 0) * 1000;
      const needsRefresh =
        !session?.access_token || expiresAtMs < now + 60_000;

      if (needsRefresh) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session ?? session;
      }

      const token = session?.access_token ?? null;
      if (token) {
        tokenCache = {
          token,
          expiresAt: (session?.expires_at ?? Math.floor(now / 1000) + 300) * 1000,
        };
      } else {
        clearTokenCache();
      }
      return token;
    } finally {
      tokenInFlight = null;
    }
  })();

  return tokenInFlight;
}

async function fetchApiOnce(
  path: string,
  init: RequestInit,
  headers: Headers
): Promise<Response> {
  const ctrl = new AbortController();
  const parentSignal = init.signal;
  const onAbort = () => ctrl.abort();
  if (parentSignal) {
    if (parentSignal.aborted) ctrl.abort();
    else parentSignal.addEventListener("abort", onAbort, { once: true });
  }
  // Render cold starts can exceed 30s; keep under common proxy limits.
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  try {
    return await fetch(`/api${path}`, {
      ...init,
      headers,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", onAbort);
  }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetchApiOnce(path, init, headers);
  } catch {
    // Likely cold start / transient network — wake API and retry once
    await warmApi();
    res = await fetchApiOnce(path, init, headers);
  }

  // One retry with a forced refresh on auth failure
  if (res.status === 401) {
    clearTokenCache();
    const fresh = await getAccessToken({ force: true });
    if (fresh && fresh !== token) {
      headers.set("Authorization", `Bearer ${fresh}`);
      res = await fetchApiOnce(path, init, headers);
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || `Request failed (${res.status})`
    );
  }
  return data;
}

/** Authenticated download (CSV/binary). Returns blob + suggested filename. */
export async function apiDownload(path: string): Promise<{
  blob: Blob;
  filename: string;
}> {
  const token = await getAccessToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetchApiOnce(path, {}, headers);
  } catch {
    await warmApi();
    res = await fetchApiOnce(path, {}, headers);
  }

  if (res.status === 401) {
    clearTokenCache();
    const fresh = await getAccessToken({ force: true });
    if (fresh && fresh !== token) {
      headers.set("Authorization", `Bearer ${fresh}`);
      res = await fetchApiOnce(path, {}, headers);
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error || `Download failed (${res.status})`
    );
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = /filename="([^"]+)"/i.exec(disposition);
  const filename = match?.[1] || "export.csv";
  const blob = await res.blob();
  return { blob, filename };
}

/** Unauthenticated JSON POST for marketing forms (contact / apply). */
export async function postJson<T = unknown>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || `Request failed (${res.status})`
    );
  }
  return data as T;
}

export { API_URL, clearTokenCache };
