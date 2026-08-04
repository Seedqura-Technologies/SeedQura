import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { StepCard } from "@/components/ui/StepCard";

const steps = [
  {
    number: "01",
    title: "Identify",
    description: "Understand real-world problems in agriculture and healthcare.",
  },
  {
    number: "02",
    title: "Research",
    description: "Explore technologies, publish findings, validate with data.",
  },
  {
    number: "03",
    title: "Develop",
    description: "Build, test, and validate prototypes with partners.",
  },
  {
    number: "04",
    title: "Deploy",
    description: "Deliver practical solutions to hospitals and field systems.",
  },
];

export function HowWeWork() {
  return (
    <SectionWrapper>
      <h2 className="text-2xl font-bold text-text-primary md:text-4xl">How We Work</h2>
      <p className="mt-4 text-lg text-text-muted">
        From concept to deployment, we follow a structured innovation process.
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <StepCard key={step.number} {...step} />
        ))}
      </div>
    </SectionWrapper>
  );
}
