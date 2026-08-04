"use client";

const research = [
  {
    year: "2025",
    title: "Crop disease detection via multispectral computer vision",
    type: "Publication",
  },
  {
    year: "2025",
    title: "Medical imaging AI for tertiary hospital integration",
    type: "Research",
  },
  {
    year: "2024",
    title: "Agricultural remote sensing dataset",
    type: "Dataset",
  },
  {
    year: "2024",
    title: "Clinical pathway NLP for precision medicine",
    type: "Research",
  },
];

export function Research() {
  return (
    <section id="research" className="section-padding pt-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {research.map((item) => (
            <article key={item.title} className="glass-card p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                  {item.type}
                </span>
                <span className="text-sm text-muted">{item.year}</span>
              </div>
              <h3 className="mt-4 text-lg font-medium leading-snug text-text">
                {item.title}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
