import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  href?: string;
  children: ReactNode;
};

const baseStyles =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-7 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary:
    "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white",
};

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `${baseStyles} ${variants[variant]} ${className}`;

  if (href) {
    const isExternal = href.startsWith("http");
    const isAnchor = href.startsWith("#");

    if (isExternal) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }

    if (isAnchor) {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
