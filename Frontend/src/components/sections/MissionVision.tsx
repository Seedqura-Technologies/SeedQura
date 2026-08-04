import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MissionVisionCard } from "@/components/ui/MissionVisionCard";

export function MissionVision() {
  return (
    <SectionWrapper>
      <SectionLabel>MISSION &amp; VISION</SectionLabel>
      <h2 className="max-w-3xl text-2xl font-bold text-text-primary md:text-4xl">
        Guiding Principles That Drive Our Innovation
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <MissionVisionCard
          title="Our Mission"
          content="To develop intelligent, evidence-based AI solutions that improve outcomes in agriculture and healthcare through research and engineering excellence."
        />
        <MissionVisionCard
          title="Our Vision"
          content="To become a trusted research and deployment partner — integrating AI tools with tertiary hospitals and agricultural institutions across India."
        />
      </div>
    </SectionWrapper>
  );
}
