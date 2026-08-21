import type { Metadata } from "next";
import { About } from "@/components/sections/About";
import { TeamSection } from "@/components/sections/TeamSection";

export const metadata: Metadata = {
  title: "About — Seedqura",
  description:
    "Seedqura — independent research lab for precision medicine. NeuroVision and Sampoorna.",
};

export default function AboutPage() {
  return (
    <>
      <About variant="page" />
      <TeamSection />
    </>
  );
}
