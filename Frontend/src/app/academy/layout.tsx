import type { Metadata } from "next";
import "./academy.css";

export const metadata: Metadata = {
  title: "Seedqura Academy — Courses & Programs",
  description:
    "Seedqura Academy — weekend live cohorts on Google Meet. Frameworks Lab, Signal Lab, and Groundtruth Lab at ₹4,999 each.",
};

/** Standalone Academy experience — no main SiteShell chrome. */
export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="academy-root">{children}</div>;
}
