import type { Metadata } from "next";
import { AsciiTextureHero } from "@/components/effects/AsciiTextureHero";
import { Research } from "@/components/sections/Research";

export const metadata: Metadata = {
  title: "Research — Seedqura",
  description:
    "Publications, datasets, and research pilots from Seedqura — evidence over promises.",
};

export default function ResearchPage() {
  return (
    <>
      <AsciiTextureHero />
      <Research />
    </>
  );
}
