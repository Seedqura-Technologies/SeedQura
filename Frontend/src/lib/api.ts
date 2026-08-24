import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

type CachedToken = {
  token: string;
  /** Epoch ms when we should re-read the session */
  expiresAt: number;
};

let tokenCache: CachedToken | null = null;
let tokenInFlight: Promise<string | null> | null = null;

function clearTokenCache() {
  tokenCache = null;
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

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(`/api${path}`, {
    ...init,
    headers,
  });

  // One retry with a forced refresh on auth failure
  if (res.status === 401) {
    clearTokenCache();
    const fresh = await getAccessToken({ force: true });
    if (fresh && fresh !== token) {
      headers.set("Authorization", `Bearer ${fresh}`);
      res = await fetch(`/api${path}`, { ...init, headers });
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
