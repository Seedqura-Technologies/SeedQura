import { redirect } from "next/navigation";
import { RESEARCH_FELLOWSHIP_APPLY_URL } from "@/lib/fellowship";

/** Short link for LinkedIn / bios → official selection form. */
export default function ApplyPage() {
  redirect(RESEARCH_FELLOWSHIP_APPLY_URL);
}
