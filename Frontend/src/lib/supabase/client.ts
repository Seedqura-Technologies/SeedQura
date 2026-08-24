import { createBrowserClient } from "@supabase/ssr";

let cached: ReturnType<typeof makeClient> | undefined;

function makeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

/** Singleton browser client — avoids recreating auth storage listeners per call. */
export function createClient() {
  if (cached === undefined) cached = makeClient();
  return cached;
}

export type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;
