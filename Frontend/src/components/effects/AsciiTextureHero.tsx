"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * AsciiTextureHero
 *
 * Two live ASCII panels rendered on a single canvas:
 *   LEFT  — Crop field: satellite grid of crop rows that "grow" in waves,
 *            with a drone sweep line passing over them.
 *   RIGHT — Medical waveform: ECG / EEG signal rendered as a scrolling
 *            ASCII chart, column by column.
 *
 * The dividing line between them is a faint vertical rule.
 * Mouse hover creates a radial ripple across both panels.
 */

// Character sets — from empty → dense
const FIELD_CHARS  = " ·,;iIlL▒█".split(""); // crops: sparse → dense green
const SIGNAL_CHARS = " ─╌┄┈━━═╡╞┼".split(""); // waveform lines

type AsciiTextureHeroProps = { className?: string };

// ── ECG signal generator ─────────────────────────────────────────────────────
function ecgSample(t: number): number {
  // Synthetic ECG: baseline + P-wave + QRS complex + T-wave
  const phase = t % (Math.PI * 2);
  const p     = 0.15 * Math.exp(-Math.pow((phase - 0.8) * 3, 2));
  const q     = -0.10 * Math.exp(-Math.pow((phase - 1.4) * 12, 2));
  const r     = 0.95 * Math.exp(-Math.pow((phase - 1.55) * 18, 2));
  const s     = -0.25 * Math.exp(-Math.pow((phase - 1.68) * 15, 2));
  const tWave = 0.22 * Math.exp(-Math.pow((phase - 2.2) * 3.5, 2));
  return (p + q + r + s + tWave) * 0.5 + 0.5; // normalise 0→1
}

export function AsciiTextureHero({ className = "" }: AsciiTextureHeroProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const frameRef     = useRef<number>(0);
  const mouseRef     = useRef({ x: 0.5, y: 0.5, inside: false });
  const ecgBufRef    = useRef<number[]>([]);     // scrolling ECG column buffer
  const reducedRef   = useRef(false);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const t  = time * 0.001;
    const fz = Math.max(7, Math.floor(W / 120));   // font size
    const lh = fz * 1.22;
    const cols = Math.floor(W / fz);
    const rows = Math.floor(H / lh);
    const half = Math.floor(cols / 2);

    ctx.font = `${fz}px "Courier New", Courier, monospace`;
    ctx.textBaseline = "top";

    const mx = mouseRef.current.x * cols;
    const my = mouseRef.current.y * rows;
    const mouseActive = mouseRef.current.inside;

    // ── LEFT PANEL: crop field ──────────────────────────────────────────────
    // Drone sweep: a vertical "scan" line moves left→right slowly
    const sweepCol = (t * 8) % half;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < half; x++) {
        // Row bands: simulate alternating crop rows (different density)
        const rowBand = Math.floor(y / 3) % 2;
        const baseBrightness = rowBand === 0 ? 0.55 : 0.25;

        // Growth wave — rows "fill in" from bottom with a travelling sine
        const grow = 0.5 + 0.5 * Math.sin(t * 1.2 - y * 0.22 + x * 0.05);

        // Drone sweep brightens a band of columns around sweepCol
        const sweepDist = Math.abs(x - sweepCol);
        const sweep = sweepDist < 4 ? (1 - sweepDist / 4) * 0.5 : 0;

        // Mouse ripple
        let ripple = 0;
        if (mouseActive) {
          const dx = x - mx; const dy = (y - my) * 1.5;
          const d = Math.sqrt(dx * dx + dy * dy);
          ripple = Math.sin(d * 0.6 - t * 6) * Math.exp(-d * 0.09) * 0.28;
        }

        let b = Math.max(0, Math.min(1, baseBrightness * grow + sweep + ripple));
        if (!reducedRef.current && Math.random() < 0.003) b = Math.random() * 0.6;

        const ci = Math.floor(b * (FIELD_CHARS.length - 1));
        const char = FIELD_CHARS[ci];

        // Color: deep green → bright accent
        const alpha = 0.45 + b * 0.50;
        const r = Math.round(8   + b * (34  - 8));
        const g = Math.round(48  + b * (211 - 48));
        const bv= Math.round(32  + b * (165 - 32));
        ctx.fillStyle = `rgba(${r},${g},${bv},${alpha})`;
        ctx.fillText(char, x * fz, y * lh);
      }
    }

    // Drone sweep highlight line (bright vertical smear)
    if (!reducedRef.current) {
      const sg = ctx.createLinearGradient(sweepCol * fz - 8, 0, sweepCol * fz + 8, 0);
      sg.addColorStop(0,   "rgba(34,211,165,0)");
      sg.addColorStop(0.5, "rgba(34,211,165,0.07)");
      sg.addColorStop(1,   "rgba(34,211,165,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(sweepCol * fz - 8, 0, 16, H);
    }

    // ── DIVIDER ──────────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(34,211,165,0.12)";
    ctx.fillRect(half * fz, 0, 1, H);

    // Label: LEFT
    ctx.font = `${fz - 1}px "Courier New", Courier, monospace`;
    ctx.fillStyle = "rgba(34,211,165,0.30)";
    ctx.fillText("AGRICULTURE · FIELD SCAN", fz, fz * 0.8);

    // ── RIGHT PANEL: medical ECG ─────────────────────────────────────────────
    ctx.font = `${fz}px "Courier New", Courier, monospace`;

    // Advance the ECG buffer — one new sample per frame
    const newSample = ecgSample(t * 3.5);
    const buf = ecgBufRef.current;
    buf.push(newSample);
    if (buf.length > half) buf.shift();

    const panelW = cols - half;

    for (let x = 0; x < panelW; x++) {
      const bufIdx = buf.length - panelW + x;
      if (bufIdx < 0) continue;
      const signal = buf[bufIdx] ?? 0.5;

      // Map signal value → row
      const signalRow = Math.round((1 - signal) * (rows - 1));

      for (let y = 0; y < rows; y++) {
        const distFromSignal = Math.abs(y - signalRow);

        // Core trace line ± 1 row, with fading shoulders
        let b = 0;
        if (distFromSignal === 0) {
          b = 0.95;
        } else if (distFromSignal === 1) {
          b = 0.38 + signal * 0.20;
        } else if (distFromSignal === 2) {
          b = 0.10;
        }

        // Afterglow: brighter for recent columns
        const recency = (x / panelW);
        b *= 0.4 + recency * 0.6;

        // Mouse ripple on right panel
        if (mouseActive) {
          const dx = (x + half) - mx; const dy = (y - my) * 1.5;
          const d = Math.sqrt(dx * dx + dy * dy);
          b += Math.sin(d * 0.6 - t * 6) * Math.exp(-d * 0.09) * 0.20;
          b = Math.max(0, Math.min(1, b));
        }

        if (b < 0.05) continue;

        // Waveform color: core → accent green, shoulders → teal
        const alpha = b * 0.95;
        const r  = Math.round(8   + b * (34  - 8));
        const g  = Math.round(80  + b * (211 - 80));
        const bv = Math.round(60  + b * (165 - 60));
        ctx.fillStyle = `rgba(${r},${g},${bv},${alpha})`;

        const ci = Math.min(SIGNAL_CHARS.length - 1, Math.floor(b * SIGNAL_CHARS.length));
        ctx.fillText(SIGNAL_CHARS[ci], (half + x) * fz, y * lh);
      }
    }

    // Label: RIGHT
    ctx.font = `${fz - 1}px "Courier New", Courier, monospace`;
    ctx.fillStyle = "rgba(34,211,165,0.30)";
    ctx.fillText("HEALTHCARE · ECG MONITOR", (half + 1) * fz, fz * 0.8);

    // Horizontal scanline sweep across full canvas
    if (!reducedRef.current) {
      const scanY = ((t * 0.18) % 1) * H;
      const hg = ctx.createLinearGradient(0, scanY - 8, 0, scanY + 8);
      hg.addColorStop(0,   "rgba(34,211,165,0)");
      hg.addColorStop(0.5, "rgba(34,211,165,0.04)");
      hg.addColorStop(1,   "rgba(34,211,165,0)");
      ctx.fillStyle = hg;
      ctx.fillRect(0, scanY - 8, W, 16);
    }

    frameRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
        inside:
          e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top  && e.clientY <= r.bottom,
      };
    };
    const onLeave = () => { mouseRef.current.inside = false; };

    window.addEventListener("mousemove", onMove, { passive: true });
    canvas.addEventListener("mouseleave", onLeave);

    frameRef.current = requestAnimationFrame(render);

    const onResize = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(render);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [render]);

  return (
    <section
      className={`relative flex min-h-[50vh] items-end overflow-hidden pt-28 pb-16 ${className}`}
      style={{ background: "var(--surface-0)" }}
    >
      <div
        className="absolute inset-0 mx-4 mt-24 rounded-3xl sm:mx-6 lg:mx-auto lg:max-w-6xl"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <canvas
          ref={canvasRef}
          className="h-[42vh] min-h-[300px] w-full cursor-crosshair rounded-2xl"
          aria-hidden
        />
        <div className="mt-10 max-w-2xl">
          <span className="eyebrow-pill">
            <span className="h-1 w-1 rounded-full" style={{ background: "var(--accent)" }} />
            Research
          </span>
          <h1
            className="mt-5 text-3xl font-semibold leading-[1.12] tracking-[-0.03em] md:text-5xl"
            style={{ color: "var(--text)" }}
          >
            Evidence over promises
          </h1>
          <p className="mt-6 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
            NeuroVision and Sampoorna — systems you can see, built for medicine.
          </p>
        </div>
      </div>
    </section>
  );
}
