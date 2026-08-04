export function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary md:text-sm">
      {children}
    </p>
  );
}
