import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FocusAreaCard } from "@/components/ui/FocusAreaCard";
import { getFocusAreas } from "@/lib/data";

export function FocusAreas() {
  const areas = getFocusAreas();

  return (
    <SectionWrapper id="products" bg="gray">
      <SectionLabel>OUR FOCUS AREAS</SectionLabel>
      <h2 className="max-w-3xl text-2xl font-bold text-text-primary md:text-4xl">
        We Develop Smart Solutions For Real-World Challenges
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {areas.map((area) => (
          <FocusAreaCard key={area.id} area={area} />
        ))}
      </div>
    </SectionWrapper>
  );
}
