import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { IconCard } from "@/components/ui/IconCard";

const items = [
  {
    emoji: "🏥",
    title: "Tertiary Hospitals",
    description:
      "Clinical decision support, diagnostics pathways, and research partnerships.",
  },
  {
    emoji: "🌾",
    title: "Agricultural Institutes",
    description: "Field trials, crop monitoring, and extension program integration.",
  },
  {
    emoji: "🎓",
    title: "Students & Researchers",
    description: "Academy cohorts, collaborative projects, and research training.",
  },
  {
    emoji: "🏛️",
    title: "Research Partners",
    description: "Joint publications, MOUs, and pilot deployments.",
  },
];

export function IdealFor() {
  return (
    <SectionWrapper bg="gray">
      <SectionLabel>IDEAL FOR</SectionLabel>
      <h2 className="text-2xl font-bold text-text-primary md:text-4xl">
        Where Our Work Creates Impact
      </h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <IconCard
            key={item.title}
            emoji={item.emoji}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
