"use client";

import { useEffect, useRef, useCallback } from "react";

const CHARSET = " .:-=+*#%@";
const CHARS = CHARSET.split("");

type AsciiTextureHeroProps = {
  className?: string;
};

export function AsciiTextureHero({ className = "" }: AsciiTextureHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const gridRef = useRef<number[][]>([]);
  const reducedMotionRef = useRef(false);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grid = gridRef.current;
    if (grid.length === 0) return;

    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const fontSize = Math.max(6, Math.floor(width / cols));
    ctx.font = `${fontSize}px "Courier New", Courier, monospace`;
    ctx.textBaseline = "top";

    const scanProgress = reducedMotionRef.current
      ? 1
      : Math.min(1, (time % 4000) / 2000);

    for (let y = 0; y < rows; y++) {
      const rowReveal = reducedMotionRef.current ? 1 : Math.min(1, scanProgress * rows - y);
      if (rowReveal <= 0) continue;

      for (let x = 0; x < cols; x++) {
        let brightness = grid[y][x];

        if (!reducedMotionRef.current) {
          const wave =
            Math.sin(time * 0.002 + x * 0.15 + y * 0.08) * 0.08 +
            Math.sin(time * 0.0015 + y * 0.12) * 0.05;
          brightness = Math.max(0, Math.min(1, brightness + wave));

          if (Math.random() < 0.002) {
            brightness = Math.random();
          }
        }

        const charIndex = Math.floor(brightness * (CHARS.length - 1));
        const char = CHARS[charIndex];
        const alpha = reducedMotionRef.current ? 0.55 : 0.35 + brightness * 0.45;

        ctx.fillStyle = `rgba(28, 23, 20, ${alpha * rowReveal})`;
        ctx.fillText(char, x * fontSize, y * fontSize * 1.15);
      }
    }

    if (!reducedMotionRef.current) {
      frameRef.current = requestAnimationFrame(render);
    }
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.src = "/hero-texture.png";
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const offscreen = document.createElement("canvas");
      const rect = canvas.getBoundingClientRect();
      const cols = Math.min(140, Math.floor(rect.width / 7));
      const rows = Math.min(50, Math.floor(rect.height / 10));

      offscreen.width = cols;
      offscreen.height = rows;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0, cols, rows);
      const imageData = offCtx.getImageData(0, 0, cols, rows);
      const grid: number[][] = [];

      for (let y = 0; y < rows; y++) {
        const row: number[] = [];
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          row.push(1 - luminance);
        }
        grid.push(row);
      }

      gridRef.current = grid;

      if (reducedMotionRef.current) {
        render(0);
      } else {
        frameRef.current = requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      if (gridRef.current.length > 0) {
        if (!reducedMotionRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = requestAnimationFrame(render);
        } else {
          render(0);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [render]);

  return (
    <section
      className={`relative flex min-h-[50vh] items-end overflow-hidden pt-28 pb-16 ${className}`}
    >
      <div className="glass-accent absolute inset-0 mx-4 mt-24 rounded-3xl sm:mx-6 lg:mx-auto lg:max-w-6xl" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <canvas
          ref={canvasRef}
          className="h-[40vh] min-h-[280px] w-full rounded-2xl"
          aria-hidden
        />
        <div className="mt-10 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
            Research
          </p>
          <h1 className="mt-4 text-3xl font-medium leading-[1.15] tracking-tight text-text md:text-5xl">
            Evidence over promises
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Publications, datasets, and pilots — documented work that compounds
            into deployable systems.
          </p>
        </div>
      </div>
    </section>
  );
}
