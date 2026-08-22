import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { cookiePolicy } from "@/content/legal/cookies";

export const metadata: Metadata = {
  title: "Cookie Policy — Seedqura",
  description: cookiePolicy.description,
};

export default function CookiesPage() {
  return <LegalDocument document={cookiePolicy} />;
}
