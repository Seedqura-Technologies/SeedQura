import Image from "next/image";
import Link from "next/link";

export const LOGO_SRC = "/logo.png";
export const LOGO_ALT = "Seedqura";

type LogoProps = {
  href?: string;
  variant?: "header" | "footer" | "hero";
  className?: string;
  animate?: boolean;
  framed?: boolean;
};

const sizes = {
  header: "h-9 w-auto sm:h-10",
  footer: "h-12 w-auto",
  hero: "h-24 w-auto sm:h-28 md:h-32",
};

export function Logo({
  href,
  variant = "header",
  className = "",
  animate = false,
  framed = false,
}: LogoProps) {
  const image = (
    <Image
      src={LOGO_SRC}
      alt={LOGO_ALT}
      width={variant === "hero" ? 320 : variant === "footer" ? 200 : 160}
      height={variant === "hero" ? 120 : variant === "footer" ? 72 : 56}
      className={`object-contain ${sizes[variant]} ${animate ? "animate-logo" : ""}`}
      priority={variant === "header" || variant === "hero"}
      unoptimized
    />
  );

  const content = framed ? (
    <span className="glass-logo-frame">{image}</span>
  ) : (
    image
  );

  if (href) {
    return (
      <Link href={href} className={`inline-flex shrink-0 items-center ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`inline-flex shrink-0 items-center ${className}`}>{content}</div>;
}
