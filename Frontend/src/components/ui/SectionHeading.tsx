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
  const alignClass = align === "center" ? "text-center mx-auto items-center" : "items-start";

  return (
    <ScrollReveal className={`flex max-w-2xl flex-col ${alignClass}`}>
      {label && (
        <span className="eyebrow-pill mb-5">
          <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
          {label}
        </span>
      )}
      <h2 className="text-3xl font-semibold leading-[1.12] tracking-tight text-text md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-6 text-lg leading-relaxed text-(--text-muted)">{subtitle}</p>
      )}
    </ScrollReveal>
  );
}
