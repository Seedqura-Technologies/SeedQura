import legalData from "../../data/legal.json";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  description: string;
  sections: LegalSection[];
};

export type LegalData = typeof legalData;

export function getLegalData(): LegalData {
  return legalData;
}

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Disclaimer", href: "/disclaimer" },
] as const;
