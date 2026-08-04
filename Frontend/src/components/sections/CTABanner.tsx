import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";

export function CTABanner() {
  return (
    <SectionWrapper className="!py-0">
      <div className="rounded-2xl bg-primary px-6 py-12 text-center text-white md:px-12 md:py-16">
        <h2 className="text-2xl font-bold md:text-4xl">Ready To Collaborate?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-light">
          Partner with us on research, pilots, or join the next Academy cohort.
        </p>
        <div className="mt-8">
          <Button
            href="#contact"
            className="bg-white text-primary hover:bg-primary-light hover:text-primary-dark"
          >
            Get In Touch
          </Button>
        </div>
      </div>
    </SectionWrapper>
  );
}
