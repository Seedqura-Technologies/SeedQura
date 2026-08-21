import Image from "next/image";

type TextureBackgroundProps = {
  variant?: "hero" | "section" | "footer" | "divider";
  className?: string;
};

const variantStyles = {
  hero:    "opacity-[0.07] blur-[1px] scale-110 object-[70%_30%]",
  section: "opacity-[0.05] blur-[2px] scale-105 object-[60%_40%]",
  footer:  "opacity-[0.04] blur-[2px] scale-105 object-[80%_60%]",
  divider: "opacity-[0.03] blur-[3px] scale-100 object-center",
};

// Overlay fades the texture edges into the dark surface color.
const overlayStyles: Record<string, string> = {
  hero:    "background: linear-gradient(to bottom, rgba(8,8,8,0.30) 0%, transparent 40%, rgba(8,8,8,0.85) 100%)",
  section: "background: linear-gradient(to bottom, rgba(8,8,8,0.25) 0%, transparent 50%, rgba(8,8,8,0.55) 100%)",
  footer:  "background: linear-gradient(to bottom, rgba(8,8,8,0.20) 0%, rgba(8,8,8,0.40) 100%)",
  divider: "",
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
          className={`object-cover mix-blend-luminosity ${variantStyles[variant]}`}
          sizes="100vw"
        />
      </div>
      {overlayStyles[variant] && (
        <div className="absolute inset-0" style={{ background: overlayStyles[variant] }} />
      )}
    </div>
  );
}
