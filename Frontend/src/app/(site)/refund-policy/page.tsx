import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { refundPolicy } from "@/content/legal/refund";

export const metadata: Metadata = {
  title: "Refund Policy — Seedqura Academy",
  description: refundPolicy.description,
};

export default function RefundPolicyPage() {
  return <LegalDocument document={refundPolicy} />;
}
