import type { Metadata } from "next";
import "./academy.css";

export const metadata: Metadata = {
  title: "Seedqura Academy — Courses & Programs",
  description:
    "Seedqura Academy — weekend live cohorts on Google Meet. Short courses from ₹5k and a flagship program.",
};

/** Standalone Academy experience — no main SiteShell chrome. */
export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="academy-root">{children}</div>;
}
