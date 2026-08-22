import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { termsOfService } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: "Terms of Service — Seedqura",
  description: termsOfService.description,
};

export default function TermsPage() {
  return <LegalDocument document={termsOfService} />;
}
