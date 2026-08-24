import { AcademyHeader } from "@/components/academy/AcademyHeader";
import { AcademyHero } from "@/components/academy/AcademyHero";
import { AcademyCatalog } from "@/components/academy/AcademyCatalog";
import { AcademyFooter } from "@/components/academy/AcademyFooter";

export default function AcademyPage() {
  return (
    <>
      <AcademyHeader />
      <main>
        <AcademyHero />
        <AcademyCatalog />
      </main>
      <AcademyFooter />
    </>
  );
}
