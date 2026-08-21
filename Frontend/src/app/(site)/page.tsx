import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/Hero";

/**
 * Lab homepage — Academy only via navbar pill → /academy
 * Hero → proof reel → editorial systems → Contact
 */

function SectionSkeleton({ height = "20rem" }: { height?: string }) {
  return <div style={{ minHeight: height }} aria-hidden />;
}

const NeuroVision = dynamic(
  () =>
    import("@/components/sections/NeuroVision").then((m) => ({
      default: m.NeuroVision,
    })),
  { loading: () => <SectionSkeleton height="100vh" /> }
);

const Domains = dynamic(
  () =>
    import("@/components/sections/Domains").then((m) => ({
      default: m.Domains,
    })),
  { loading: () => <SectionSkeleton height="32rem" /> }
);

const Contact = dynamic(
  () =>
    import("@/components/sections/Contact").then((m) => ({
      default: m.Contact,
    })),
  { loading: () => <SectionSkeleton height="28rem" /> }
);

export default function HomePage() {
  return (
    <>
      <Hero />
      <NeuroVision />
      <Domains />
      <Contact />
    </>
  );
}
