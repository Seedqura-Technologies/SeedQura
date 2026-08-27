"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Sticky chapter reel — one viewport, three chapters.
 * Entrance starts black so the hero → reel handoff doesn't flash product UI.
 */

type Chapter = {
  id: string;
  index: string;
  name: string;
  line: string;
  src: string;
  rate: number;
};

const chapters: Chapter[] = [
  {
    id: "3d",
    index: "01",
    name: "NeuroVision",
    line: "Pre-op — comprehend the aneurysm space",
    src: "/neurovision-3d.mp4",
    rate: 1.15,
  },
  {
    id: "ar",
    index: "02",
    name: "NeuroVision",
    line: "AR — overlay for surgery and training",
    src: "/neurovision-ar.mp4",
    rate: 1.2,
  },
  {
    id: "sampoorna",
    index: "03",
    name: "Sampoorna",
    line: "Women’s health — one companion, not five apps",
    src: "/sampoorna-reel.mp4",
    rate: 1.35,
  },
];

export function NeuroVision() {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [locked, setLocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return;

      // Sticky is "locked" only once the stage pins to the top
      const isLocked = rect.top <= 1 && rect.bottom > window.innerHeight * 0.5;
      setLocked(isLocked);

      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const t = scrolled / total;
      setProgress(t);

      const next = Math.min(
        chapters.length - 1,
        Math.floor(t * chapters.length + 0.001)
      );

      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active && locked) {
        v.playbackRate = chapters[i].rate;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [active, locked]);

  const chapter = chapters[active];
  // While peeking under the hero, keep the stage nearly black
  const veilOpacity = locked ? 0 : 0.92;
  const contentOpacity = locked ? 1 : 0;

  return (
    <section id="neurovision" className="relative" aria-label="Systems in motion">
      {/* Black bridge so hero never meets bright video mid-frame */}
      <div
        className="relative z-10 h-16 md:h-24"
        style={{ background: "var(--surface-0)" }}
        aria-hidden
      />

      <div
        ref={trackRef}
        className="relative"
        style={{ height: `${chapters.length * 100}vh` }}
      >
        <div
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={{ background: "#080808" }}
        >
          {chapters.map((c, i) => (
            <video
              key={c.id}
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={c.src}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: i === active ? 1 : 0,
                transform: i === active && locked ? "scale(1.04)" : "scale(1.01)",
                filter: "brightness(0.55) contrast(1.06) saturate(0.92)",
                transition:
                  "opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1), transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              loop
              muted
              playsInline
              preload={i === 0 ? "auto" : "metadata"}
              aria-hidden
            />
          ))}

          {/* Continuous vignette — matches hero black */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                linear-gradient(to bottom, #080808 0%, transparent 28%),
                linear-gradient(to top, #080808 0%, rgba(8,8,8,0.55) 28%, transparent 55%),
                radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, rgba(8,8,8,0.45) 100%)
              `,
            }}
          />

          {/* Entrance veil — black until sticky locks */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: "#080808",
              opacity: veilOpacity,
              transition: "opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            aria-hidden
          />

          {/* UI — fades in with lock */}
          <div
            className="absolute inset-0 z-20 flex flex-col justify-between px-5 pt-6 pb-10 sm:px-8 md:px-10 md:pt-8 md:pb-14"
            style={{
              opacity: contentOpacity,
              transition: "opacity 0.45s ease",
            }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-medium uppercase tracking-[0.22em]"
                style={{ color: "rgba(237,237,234,0.4)" }}
              >
                Systems
              </p>
              <nav className="flex items-center gap-5" aria-label="Chapters">
                {chapters.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      const track = trackRef.current;
                      if (!track) return;
                      const total = track.offsetHeight - window.innerHeight;
                      const target =
                        track.getBoundingClientRect().top +
                        window.scrollY +
                        (i / chapters.length) * total +
                        8;
                      window.scrollTo({ top: target, behavior: "smooth" });
                    }}
                    className="font-mono text-[11px] tabular-nums transition-colors duration-300"
                    style={{
                      color:
                        i === active
                          ? "var(--accent)"
                          : "rgba(237,237,234,0.28)",
                    }}
                    aria-current={i === active ? "true" : undefined}
                  >
                    {c.index}
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <div
                key={chapter.id}
                className="max-w-xl"
                style={{
                  animation: locked
                    ? "nv-line-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both"
                    : undefined,
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "var(--accent)" }}
                >
                  {chapter.name}
                </p>
                <p
                  className="mt-3 text-xl font-semibold leading-snug tracking-[-0.02em] sm:text-2xl md:text-3xl"
                  style={{ color: "var(--text)" }}
                >
                  {chapter.line}
                </p>
              </div>

              <div className="mt-8 flex gap-1.5" aria-hidden>
                {chapters.map((c, i) => (
                  <div
                    key={c.id}
                    className="h-px flex-1 rounded-full transition-colors duration-500"
                    style={{
                      background:
                        i === active
                          ? "var(--accent)"
                          : i < active
                            ? "rgba(34,211,165,0.35)"
                            : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>

              {/* Overall scroll progress (subtle) */}
              <div
                className="mt-3 h-px w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
                aria-hidden
              >
                <div
                  className="h-full origin-left rounded-full"
                  style={{
                    width: "100%",
                    transform: `scaleX(${progress})`,
                    background: "rgba(34,211,165,0.45)",
                    transition: "transform 0.08s linear",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit into pillars — stay black */}
      <div
        className="h-16 md:h-24"
        style={{ background: "var(--surface-0)" }}
        aria-hidden
      />

      <style>{`
        @keyframes nv-line-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes nv-line-in {
            from, to { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </section>
  );
}
