import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

type IconCardProps = {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function IconCard({ icon: Icon, emoji, title, description }: IconCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light text-2xl text-primary">
        {emoji ? (
          <span role="img" aria-hidden="true">
            {emoji}
          </span>
        ) : Icon ? (
          <Icon className="h-6 w-6" />
        ) : null}
      </div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}
