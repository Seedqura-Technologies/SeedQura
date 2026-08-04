type StepCardProps = {
  number: string;
  title: string;
  description: string;
};

export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="relative flex flex-col items-center text-center md:items-start md:text-left">
      <span className="text-4xl font-bold text-primary">{number}</span>
      <h3 className="mt-3 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}
