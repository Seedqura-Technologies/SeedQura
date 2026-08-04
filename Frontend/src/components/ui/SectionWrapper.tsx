import { type ReactNode } from "react";

type SectionWrapperProps = {
  id?: string;
  bg?: "white" | "gray";
  children: ReactNode;
  className?: string;
};

export function SectionWrapper({
  id,
  bg = "white",
  children,
  className = "",
}: SectionWrapperProps) {
  const bgClass = bg === "gray" ? "bg-bg-gray" : "bg-white";

  return (
    <section
      id={id}
      className={`py-12 md:py-20 ${bgClass} ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}
