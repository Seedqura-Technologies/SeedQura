import { Hero } from "@/components/sections/Hero";
import { Technology } from "@/components/sections/Technology";
import { ProductsPreview } from "@/components/sections/ProductsPage";
import { Contact } from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Technology />
      <ProductsPreview />
      <Contact />
    </>
  );
}
