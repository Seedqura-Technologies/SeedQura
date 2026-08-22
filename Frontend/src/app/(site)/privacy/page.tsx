import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacyPolicy } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy — Seedqura",
  description: privacyPolicy.description,
};

export default function PrivacyPage() {
  return <LegalDocument document={privacyPolicy} />;
}
