"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { SmoothLoopVideo } from "@/components/media/SmoothLoopVideo";

const systems = [
  {
    id: "neurovision",
    index: "01",
    name: "NeuroVision",
    title: "When the aneurysm sits in a space the mind can’t hold",
    body: "Surgeons still plan from flat slices. NeuroVision reconstructs cerebral vasculature in 3D for pre-op comprehension, overlays AR for surgery and training, and uses ML to help surface what matters — for clinicians and for students learning the anatomy.",
    cta: "Discuss a pilot",
    align: "left" as const,
    background: null as null | {
      src: string;
      srcMobile: string;
      poster: string;
    },
  },
  {
    id: "sampoorna",
    index: "02",
    name: "Sampoorna",
    title: "Women’s health is one life — not five apps",
    body: "Period trackers, PCOS tools, habit apps, and breast-health pathways live in silos. Sampoorna is the combined companion: continuity across cycles, habits, and clinical pathways — built with dignity, not wellness clichés.",
    cta: "Talk about Sampoorna",
    align: "right" as const,
    background: {
      src: "/sampoorna.mp4",
      srcMobile: "/sampoorna-720.mp4",
      poster: "/sampoorna-poster.jpg",
    },
  },
];

export function Domains() {
  return (
    <section
      id="domains"
      className="relative border-t border-white/6"
      style={{ background: "var(--surface-0)" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        aria-hidden
        style={{
          background: "linear-gradient(to bottom, #000 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-8 sm:px-6 md:pt-36 lg:px-8">
        <ScrollReveal>
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--text-muted)" }}
          >
            Systems
          </p>
          <h2
            className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.08] tracking-[-0.03em] md:text-5xl"
            style={{ color: "var(--text)" }}
          >
            Two products. One lab.
          </h2>
          <p
            className="mt-5 max-w-lg text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Cerebral vasculature for the clinic — and continuous care for her
            everyday health.
          </p>
        </ScrollReveal>
      </div>

      <div className="relative">
        {systems.map((s, i) => {
          const right = s.align === "right";
          return (
            <ScrollReveal key={s.id} delay={i * 0.06}>
              <article
                id={s.id === "neurovision" ? "system-neurovision" : s.id}
                className="relative border-t border-white/6 overflow-hidden"
              >
                {s.background ? (
                  <div className="pointer-events-none absolute inset-0" aria-hidden>
                    <SmoothLoopVideo
                      src={s.background.src}
                      srcMobile={s.background.srcMobile}
                      poster={s.background.poster}
                      drift
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{
                        // Quiet atmosphere only — text stays the hero
                        filter: "brightness(0.28) contrast(1.05) saturate(0.75)",
                        opacity: 1,
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        // Text sits on the right — keep that side darker for contrast
                        background: `
                          linear-gradient(to right, rgba(8,8,8,0.35) 0%, rgba(8,8,8,0.72) 48%, rgba(8,8,8,0.94) 100%),
                          linear-gradient(to top, #080808 0%, transparent 40%),
                          linear-gradient(to bottom, #080808 0%, transparent 28%)
                        `,
                      }}
                    />
                  </div>
                ) : null}

                <div
                  className={`relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8 ${
                    right ? "md:flex md:justify-end" : ""
                  }`}
                >
                  <div className={`max-w-xl ${right ? "md:text-right" : ""}`}>
                    <SystemCopy s={s} right={right} />
                  </div>
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}

function SystemCopy({
  s,
  right,
}: {
  s: (typeof systems)[number];
  right: boolean;
}) {
  return (
    <>
      <div
        className={`flex items-baseline gap-4 ${
          right ? "md:flex-row-reverse" : ""
        }`}
      >
        <span
          className="font-mono text-xs tabular-nums"
          style={{ color: "var(--accent)" }}
        >
          {s.index}
        </span>
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--text-muted)" }}
        >
          {s.name}
        </p>
      </div>

      <h3
        className="mt-6 text-2xl font-semibold leading-[1.15] tracking-tight md:text-4xl"
        style={{ color: "var(--text)" }}
      >
        {s.title}
      </h3>

      <p
        className={`mt-6 text-base leading-relaxed md:text-lg ${
          right ? "md:ml-auto" : ""
        }`}
        style={{ color: "var(--text-muted)" }}
      >
        {s.body}
      </p>

      <a
        href="#contact"
        className={`group mt-10 inline-flex items-center gap-2 text-sm font-medium transition-colors ${
          right ? "md:flex-row-reverse" : ""
        }`}
        style={{ color: "var(--accent)" }}
      >
        <span>{s.cta}</span>
        <span
          className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden
        >
          →
        </span>
      </a>
    </>
  );
}
