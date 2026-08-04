import type { Metadata } from "next";
import { CourseCatalog, ProductsHero } from "@/components/sections/ProductsPage";

export const metadata: Metadata = {
  title: "Products — Seedqura",
  description:
    "Courses and programs in AI for agriculture and precision medicine — mentorship, self-paced learning, and enterprise pilots.",
};

export default function ProductsPage() {
  return (
    <>
      <ProductsHero />
      <CourseCatalog />
    </>
  );
}
