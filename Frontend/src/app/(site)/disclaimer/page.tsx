import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { disclaimer } from "@/content/legal/disclaimer";

export const metadata: Metadata = {
  title: "Disclaimer — Seedqura",
  description: disclaimer.description,
};

export default function DisclaimerPage() {
  return <LegalDocument document={disclaimer} />;
}
