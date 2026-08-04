type MissionVisionCardProps = {
  title: string;
  content: string;
};

export function MissionVisionCard({ title, content }: MissionVisionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
      <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
      <p className="mt-4 leading-relaxed text-text-muted">{content}</p>
    </div>
  );
}
