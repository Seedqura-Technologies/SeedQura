import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; code?: string }>;
}) {
  const params = await searchParams;
  const next = params.next || "/dashboard";
  const supabase = await createClient();

  if (params.code) {
    await supabase.auth.exchangeCodeForSession(params.code);
  }

  redirect(next);
}
