import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seedqura Academy — Courses & Programs",
  description:
    "Seedqura Academy — weekend live cohorts on Google Meet. Short courses from ₹5k and a flagship program.",
};

// No SiteShell — Academy is a fully standalone experience.
export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-bg text-text">{children}</div>;
}
