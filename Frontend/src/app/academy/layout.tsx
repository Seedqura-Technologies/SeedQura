import type { Metadata } from "next";
import "./academy.css";

export const metadata: Metadata = {
  title: "Seedqura Learnings",
  description:
    "Seedqura Learnings — AI and machine learning from first principles, with depth in medical intelligence and systems you can trust.",
};

/** Standalone Academy experience — no main SiteShell chrome. */
export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="academy-root">{children}</div>;
}
