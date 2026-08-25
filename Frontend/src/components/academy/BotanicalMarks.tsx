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
