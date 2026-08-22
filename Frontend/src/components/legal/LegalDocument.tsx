import Link from "next/link";
import type { LegalDocument as LegalDoc } from "@/lib/legal";
import { getLegalData, LEGAL_LINKS } from "@/lib/legal";

type LegalDocumentProps = {
  document: LegalDoc;
};

export function LegalDocument({ document }: LegalDocumentProps) {
  const legal = getLegalData();

  return (
    <article className="relative py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Legal
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text md:text-4xl">
          {document.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
          {document.description}
        </p>
        <p className="mt-3 text-xs text-[var(--text-faint)]">
          {legal.entity.legalName} · Last updated {legal.lastUpdated}
        </p>

        <nav
          aria-label="Legal documents"
          className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-b border-white/8 pb-6 text-sm"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.href === `/${document.slug}`
                  ? "font-medium text-accent"
                  : "text-muted transition-colors hover:text-text"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 space-y-10">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-lg font-semibold tracking-tight text-text">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-muted md:text-[0.95rem]"
                  >
                    {p}
                  </p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted md:text-[0.95rem]">
                  {section.bullets.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <aside className="mt-14 rounded-xl border border-white/8 bg-[var(--surface-1)] p-6 text-sm text-muted">
          <p className="font-medium text-text">Questions or grievances</p>
          <p className="mt-2 leading-relaxed">
            Privacy:{" "}
            <a
              href={`mailto:${legal.contacts.privacy}`}
              className="text-accent hover:text-text"
            >
              {legal.contacts.privacy}
            </a>
            <br />
            Grievance Officer:{" "}
            <a
              href={`mailto:${legal.contacts.grievance}`}
              className="text-accent hover:text-text"
            >
              {legal.contacts.grievance}
            </a>
          </p>
          <p className="mt-4 text-xs leading-relaxed text-[var(--text-faint)]">
            This document is provided for transparency and compliance purposes.
            It does not constitute legal advice. Consider independent legal review
            for your specific circumstances.
          </p>
        </aside>
      </div>
    </article>
  );
}
