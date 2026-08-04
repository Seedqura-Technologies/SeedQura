import { ScrollReveal } from "@/components/motion/ScrollReveal";

type SectionHeadingProps = {
  label?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
};

export function SectionHeading({
  label,
  title,
  subtitle,
  align = "left",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";

  return (
    <ScrollReveal className={`max-w-2xl ${alignClass}`}>
      {label && (
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-accent">
          {label}
        </p>
      )}
      <h2 className="text-3xl font-medium leading-[1.15] tracking-tight text-text md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-6 text-lg leading-relaxed text-muted">{subtitle}</p>
      )}
    </ScrollReveal>
  );
}
