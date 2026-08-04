import type { Metadata } from "next";
import { About } from "@/components/sections/About";
import { TeamSection } from "@/components/sections/TeamSection";

export const metadata: Metadata = {
  title: "About — Seedqura",
  description:
    "Learn about Seedqura — a research-first technology company building intelligent AI for agriculture and precision medicine.",
};

export default function AboutPage() {
  return (
    <>
      <About variant="page" />
      <TeamSection />
    </>
  );
}
