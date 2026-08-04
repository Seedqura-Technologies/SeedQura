import Image from "next/image";

type TextureBackgroundProps = {
  variant?: "hero" | "section" | "footer" | "divider";
  className?: string;
};

const variantStyles = {
  hero: "opacity-[0.16] blur-[1px] scale-110 object-[70%_30%]",
  section: "opacity-[0.12] blur-[2px] scale-105 object-[60%_40%]",
  footer: "opacity-[0.1] blur-[2px] scale-105 object-[80%_60%]",
  divider: "opacity-[0.08] blur-[3px] scale-100 object-center",
};

export function TextureBackground({
  variant = "hero",
  className = "",
}: TextureBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="relative h-full w-full">
        <Image
          src="/hero-texture.png"
          alt=""
          fill
          priority={variant === "hero"}
          className={`object-cover ${variantStyles[variant]}`}
          sizes="100vw"
        />
      </div>
      {variant === "hero" && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#f4f2ef]/30 via-transparent to-[#f4f2ef]" />
      )}
      {variant === "section" && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#f4f2ef]/20 via-transparent to-[#f4f2ef]/40" />
      )}
    </div>
  );
}
