import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;

  // Session may need a refresh after project switch / tab resume
  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed.session?.access_token ?? null;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
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

export { API_URL };
