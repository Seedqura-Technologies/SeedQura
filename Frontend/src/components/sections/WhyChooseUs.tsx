import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { IconCard } from "@/components/ui/IconCard";
import { Lightbulb, FlaskConical, TrendingUp, Handshake } from "lucide-react";

const items = [
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "Modern AI research applied to agriculture and healthcare challenges.",
  },
  {
    icon: FlaskConical,
    title: "Research-First",
    description: "Rigorous, publication-oriented approach backed by evidence.",
  },
  {
    icon: TrendingUp,
    title: "Scalable",
    description: "Solutions designed to grow from pilot to full deployment.",
  },
  {
    icon: Handshake,
    title: "Partnership-Ready",
    description: "Built for hospitals, institutes, and field partners.",
  },
];

export function WhyChooseUs() {
  return (
    <SectionWrapper bg="gray">
      <h2 className="text-2xl font-bold text-text-primary md:text-4xl">
        Why Choose Seedqura
      </h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <IconCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
