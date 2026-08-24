/** Subtle botanical / organic SVG accents for Academy — low opacity decorative only. */

type MarkProps = {
  className?: string;
  opacity?: number;
};

export function LeafSilhouette({ className = "", opacity = 0.12 }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 160"
      fill="none"
      aria-hidden
      style={{ opacity }}
    >
      <path
        d="M60 8C60 8 18 48 18 92c0 28 18 48 42 52 24-4 42-24 42-52C102 48 60 8 60 8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M60 20v112M60 52c-14 10-22 26-24 42M60 52c14 10 22 26 24 42M60 84c-10 8-16 18-18 28M60 84c10 8 16 18 18 28"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function BranchAccent({ className = "", opacity = 0.1 }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 80"
      fill="none"
      aria-hidden
      style={{ opacity }}
    >
      <path
        d="M8 52c36-28 72-36 108-28 20 4 36 14 52 28"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M72 36c8-14 18-22 30-26M108 40c10-12 22-18 36-20M140 52c8-10 16-14 26-16"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="102" cy="24" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="144" cy="28" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function PetalMark({ className = "", opacity = 0.1 }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      style={{ opacity }}
    >
      <g fill="currentColor">
        <path d="M32 10c7 9 8 20 0 30-8-10-7-21 0-30Z" fillOpacity="0.35" />
        <path
          d="M32 10c7 9 8 20 0 30-8-10-7-21 0-30Z"
          fillOpacity="0.22"
          transform="rotate(72 32 32)"
        />
        <path
          d="M32 10c7 9 8 20 0 30-8-10-7-21 0-30Z"
          fillOpacity="0.18"
          transform="rotate(144 32 32)"
        />
        <circle cx="32" cy="32" r="2.8" fillOpacity="0.5" />
      </g>
    </svg>
  );
}

/** Hero composition: AI network geometry + botanical silhouettes */
export function AcademyHeroVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-square w-full max-w-lg ${className}`} aria-hidden>
      <div className="academy-hero-orb academy-hero-orb-a" />
      <div className="academy-hero-orb academy-hero-orb-b" />

      <LeafSilhouette className="academy-float absolute -left-2 top-6 h-36 w-28 text-[var(--academy-sage)] md:h-44 md:w-32" opacity={0.18} />
      <LeafSilhouette className="academy-float-delayed absolute -right-1 bottom-10 h-28 w-20 rotate-180 text-[var(--academy-sage)]" opacity={0.12} />
      <BranchAccent className="absolute bottom-16 left-8 w-44 text-[var(--academy-muted)]" opacity={0.14} />

      <svg className="relative z-10 h-full w-full" viewBox="0 0 400 400" fill="none">
        {/* Soft organic ring */}
        <ellipse
          cx="200"
          cy="200"
          rx="128"
          ry="132"
          stroke="var(--academy-sage)"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
        <ellipse
          cx="200"
          cy="200"
          rx="96"
          ry="100"
          stroke="var(--academy-sage)"
          strokeOpacity="0.14"
          strokeWidth="1"
          strokeDasharray="4 8"
        />

        {/* Network nodes */}
        {[
          [200, 78],
          [286, 130],
          [302, 220],
          [248, 298],
          [152, 298],
          [98, 220],
          [114, 130],
          [200, 200],
          [240, 176],
          [168, 176],
          [200, 248],
        ].map(([x, y], i) => (
          <circle
            key={`${x}-${y}-${i}`}
            cx={x}
            cy={y}
            r={i === 7 ? 5 : 3.2}
            fill="var(--academy-sage)"
            fillOpacity={i === 7 ? 0.55 : 0.35}
          />
        ))}

        {/* Connections */}
        <g stroke="var(--academy-sage)" strokeOpacity="0.28" strokeWidth="1">
          <path d="M200 78L286 130L302 220L248 298L152 298L98 220L114 130Z" />
          <path d="M200 78L200 200L248 298" />
          <path d="M114 130L200 200L302 220" />
          <path d="M168 176L200 200L240 176L200 248Z" />
        </g>

        {/* Tiny leaf near hub */}
        <path
          d="M214 188c8 6 10 14 2 22-8-4-12-12-2-22Z"
          fill="var(--academy-soft)"
          fillOpacity="0.35"
        />
      </svg>

      <div className="academy-particles pointer-events-none absolute inset-0" />
    </div>
  );
}
