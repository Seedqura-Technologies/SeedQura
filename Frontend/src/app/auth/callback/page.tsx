import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; code?: string; error?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  if (params.error) {
    const msg = params.error_description || params.error;
    redirect(
      `/login?error=${encodeURIComponent(msg)}`
    );
  }

  const supabase = await createClient();

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      if (next.includes("update-password")) {
        redirect("/forgot-password");
      }
      redirect(
        `/login?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  redirect(next);
}
