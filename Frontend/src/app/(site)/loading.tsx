/**
 * Next.js streaming loading UI.
 * Shown instantly while the page shell hydrates — prevents blank screens.
 * Matches the dark surface so there's zero color flash.
 */
export default function Loading() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        background: "#080808",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Single pulsing dot — minimal, on-brand */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#22D3A5",
          animation: "sq-pulse 1.2s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes sq-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%       { opacity: 1;    transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
