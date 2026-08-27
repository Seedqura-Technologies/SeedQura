"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Props = {
  /** Desktop / default source */
  src: string;
  /** Lighter source for narrow viewports */
  srcMobile?: string;
  poster?: string;
  className?: string;
  style?: CSSProperties;
  /** Soft ken-burns while playing */
  drift?: boolean;
  /** Play only when this fraction is visible */
  threshold?: number;
  "aria-label"?: string;
};

/**
 * Muted autoplay loop that starts only when on-screen —
 * avoids decode jank offscreen and keeps the page smooth.
 */
export function SmoothLoopVideo({
  src,
  srcMobile,
  poster,
  className = "",
  style,
  drift = false,
  threshold = 0.35,
  "aria-label": ariaLabel,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting && entry.intersectionRatio >= threshold);
      },
      { threshold: [0, threshold, 0.6, 1], rootMargin: "8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active && ready) {
      el.playbackRate = 1;
      const p = el.play();
      if (p) p.catch(() => {});
    } else {
      el.pause();
    }
  }, [active, ready]);

  return (
    <video
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: ready ? style?.opacity ?? 1 : 0,
        transform:
          drift && active
            ? "scale(1.045)"
            : style?.transform ?? "scale(1.01)",
        transition:
          "opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 8s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      onLoadedData={() => setReady(true)}
      onCanPlay={() => setReady(true)}
    >
      {srcMobile ? (
        <source src={srcMobile} type="video/mp4" media="(max-width: 768px)" />
      ) : null}
      <source src={src} type="video/mp4" />
    </video>
  );
}
