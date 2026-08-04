import type { FocusArea } from "@/lib/data";

export function FocusAreaCard({ area }: { area: FocusArea }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex aspect-[4/3] items-center justify-center bg-bg-gray">
        <span className="text-sm font-medium text-text-muted">{area.title} visual</span>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-text-primary">{area.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{area.description}</p>
      </div>
    </div>
  );
}
