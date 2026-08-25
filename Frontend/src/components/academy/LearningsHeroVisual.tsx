"use client";

import { useEffect, useRef } from "react";

/**
 * LearningsHeroVisual — always-on interactive neural field.
 * Explicit size + ResizeObserver so the canvas never mounts empty.
 */

type Node = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  energy: number;
  orbit: number;
  orbitSpeed: number;
};

type Pulse = {
  from: number;
  to: number;
  t: number;
  speed: number;
};

type LearningsHeroVisualProps = {
  className?: string;
};

const GLYPHS = ["·", "∙", "∘", "○", "●", "◇", "◆", "□", "■", "▲", "+"];

function seedNodes(w: number, h: number, count: number): Node[] {
  const nodes: Node[] = [];
  const cx = w * 0.5;
  const cy = h * 0.5;
  const maxR = Math.min(w, h) * 0.44;

  for (let i = 0; i < count; i++) {
    const ring = 0.32 + (i % 5) * 0.14 + Math.random() * 0.06;
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.12;
    const radius = maxR * ring;
    const hx = cx + Math.cos(angle) * radius;
    const hy = cy + Math.sin(angle) * radius * 0.9;
    nodes.push({
      x: hx,
      y: hy,
      homeX: hx,
      homeY: hy,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 2.8 + Math.random() * 2.4,
      phase: Math.random() * Math.PI * 2,
      energy: 0.35 + Math.random() * 0.25,
      orbit: Math.random() * Math.PI * 2,
      orbitSpeed: 0.4 + Math.random() * 0.6,
    });
  }

  nodes.push({
    x: cx,
    y: cy,
    homeX: cx,
    homeY: cy,
    vx: 0,
    vy: 0,
    r: 5,
    phase: 0,
    energy: 0.55,
    orbit: 0,
    orbitSpeed: 0.25,
  });

  return nodes;
}

export function LearningsHeroVisual({ className = "" }: LearningsHeroVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const nodesRef = useRef<Node[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const mouseRef = useRef({ x: -1, y: -1, inside: false });
  const sizeRef = useRef({ w: 0, h: 0 });
  const reducedRef = useRef(false);
  const lastPulseRef = useRef(0);
  const lastAmbientRef = useRef(0);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (w < 40 || h < 40) return false;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const changed = sizeRef.current.w !== w || sizeRef.current.h !== h;
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (changed || nodesRef.current.length === 0) {
        nodesRef.current = seedNodes(w, h, w < 420 ? 36 : 52);
        pulsesRef.current = [];
      }
      return true;
    };

    const draw = (time: number) => {
      if (!syncSize()) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      const { w: W, h: H } = sizeRef.current;
      const t = time * 0.001;
      const nodes = nodesRef.current;
      const reduced = reducedRef.current;
      const connectionRadius = Math.min(W, H) * 0.36;

      ctx.clearRect(0, 0, W, H);

      // Soft ambient glow behind the field
      const wash = ctx.createRadialGradient(
        W * 0.5,
        H * 0.48,
        Math.min(W, H) * 0.05,
        W * 0.5,
        H * 0.5,
        Math.max(W, H) * 0.65
      );
      wash.addColorStop(0, "rgba(34, 211, 165, 0.08)");
      wash.addColorStop(0.55, "rgba(34, 211, 165, 0.02)");
      wash.addColorStop(1, "rgba(7, 17, 13, 0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, W, H);

      // Glyph underlay
      if (!reduced) {
        const fz = Math.max(9, Math.floor(W / 48));
        const lh = fz * 1.35;
        const cols = Math.ceil(W / fz);
        const rows = Math.ceil(H / lh);
        ctx.font = `${fz}px ui-monospace, "Courier New", monospace`;
        ctx.textBaseline = "top";
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const nx = x / cols - 0.5;
            const ny = y / rows - 0.5;
            const dist = Math.sqrt(nx * nx * 1.05 + ny * ny);
            if (dist > 0.58) continue;
            const wave = 0.5 + 0.5 * Math.sin(t * 0.9 + x * 0.3 + y * 0.24);
            const b = (1 - dist * 1.25) * wave * 0.28;
            if (b < 0.04) continue;
            const gi = Math.floor((wave + dist) * 4) % GLYPHS.length;
            ctx.fillStyle = `rgba(34, 211, 165, ${b * 0.45})`;
            ctx.fillText(GLYPHS[gi], x * fz, y * lh);
          }
        }
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mouseActive = mouseRef.current.inside;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHub = i === nodes.length - 1;
        n.orbit += n.orbitSpeed * 0.016;
        n.phase += 0.035;

        const breatheX = Math.cos(n.orbit) * (isHub ? 12 : 16);
        const breatheY = Math.sin(n.orbit * 0.92) * (isHub ? 10 : 14);
        const targetX = n.homeX + breatheX;
        const targetY = n.homeY + breatheY;

        if (!reduced) {
          n.vx += (targetX - n.x) * 0.05;
          n.vy += (targetY - n.y) * 0.05;
          n.vx *= 0.84;
          n.vy *= 0.84;
          n.x += n.vx;
          n.y += n.vy;
        } else {
          n.x = targetX;
          n.y = targetY;
        }

        // Always stay lit enough to see the full web
        n.energy = Math.max(0.28, n.energy * 0.97);

        if (mouseActive) {
          const dx = n.x - mx;
          const dy = n.y - my;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const influence = Math.min(W, H) * 0.42;
          if (d < influence) {
            const strength = 1 - d / influence;
            n.energy = Math.min(1, n.energy + strength * 0.4);
            if (!isHub) {
              n.vx += (dx / d) * strength * 1.1;
              n.vy += (dy / d) * strength * 1.1;
            }
          }
        }
      }

      // Ambient traffic
      if (!reduced && time - lastAmbientRef.current > 380) {
        lastAmbientRef.current = time;
        const a = Math.floor(Math.random() * (nodes.length - 1));
        let b = Math.floor(Math.random() * (nodes.length - 1));
        if (b === a) b = (a + 3) % (nodes.length - 1);
        const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
        if (d < connectionRadius * 1.4 && pulsesRef.current.length < 28) {
          nodes[a].energy = Math.min(1, nodes[a].energy + 0.5);
          pulsesRef.current.push({
            from: a,
            to: b,
            t: 0,
            speed: 0.018 + Math.random() * 0.02,
          });
        }
      }

      if (!reduced && time - lastPulseRef.current > 65) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].energy < 0.55) continue;
          let nearest = -1;
          let nearestD = connectionRadius;
          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if (d < nearestD) {
              nearestD = d;
              nearest = j;
            }
          }
          if (nearest >= 0 && pulsesRef.current.length < 36) {
            pulsesRef.current.push({
              from: i,
              to: nearest,
              t: 0,
              speed: 0.022 + Math.random() * 0.02,
            });
            lastPulseRef.current = time;
          }
        }
      }

      // Links — bright enough to read
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > connectionRadius) continue;
          const proximity = 1 - d / connectionRadius;
          const boost = Math.max(a.energy, b.energy);
          const alpha = 0.18 + proximity * 0.35 + boost * 0.28;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(52, 225, 175, ${alpha})`;
          ctx.lineWidth = 1 + boost * 1.1;
          ctx.stroke();
        }
      }

      const nextPulses: Pulse[] = [];
      for (const p of pulsesRef.current) {
        p.t += p.speed;
        if (p.t >= 1) {
          if (nodes[p.to]) nodes[p.to].energy = Math.min(1, nodes[p.to].energy + 0.6);
          continue;
        }
        const a = nodes[p.from];
        const b = nodes[p.to];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, 12);
        glow.addColorStop(0, "rgba(220, 255, 240, 0.95)");
        glow.addColorStop(0.35, "rgba(34, 211, 165, 0.55)");
        glow.addColorStop(1, "rgba(34, 211, 165, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = "#ecfdf5";
        ctx.fill();
        nextPulses.push(p);
      }
      pulsesRef.current = nextPulses;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHub = i === nodes.length - 1;
        const pulse = 0.82 + 0.18 * Math.sin(n.phase + t * 2.2);
        const size = n.r * (isHub ? 1 + 0.12 * Math.sin(t * 1.5) : pulse);
        const e = n.energy;
        const glowR = Math.min(size * (3.2 + e * 2.2), isHub ? 26 : 20);

        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        g.addColorStop(0, `rgba(34, 211, 165, ${0.35 + e * 0.35})`);
        g.addColorStop(1, "rgba(34, 211, 165, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isHub
          ? `rgba(190, 250, 220, ${0.85 + e * 0.15})`
          : `rgba(52, 225, 175, ${0.65 + e * 0.35})`;
        ctx.fill();

        if (isHub) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, size * 1.75, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 165, ${0.45 + e * 0.3})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      if (!reduced) {
        const scanY = ((t * 0.18) % 1) * H;
        const hg = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
        hg.addColorStop(0, "rgba(34, 211, 165, 0)");
        hg.addColorStop(0.5, "rgba(34, 211, 165, 0.06)");
        hg.addColorStop(1, "rgba(34, 211, 165, 0)");
        ctx.fillStyle = hg;
        ctx.fillRect(0, scanY - 12, W, 24);
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x >= -24 && x <= r.width + 24 && y >= -24 && y <= r.height + 24;
      mouseRef.current = { x, y, inside };
    };
    const onLeave = () => {
      mouseRef.current.inside = false;
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const d = Math.hypot(n.x - mx, n.y - my);
        if (d < 220) {
          n.energy = 1;
          let nearest = -1;
          let nearestD = 1e9;
          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const d2 = Math.hypot(n.x - nodes[j].x, n.y - nodes[j].y);
            if (d2 < nearestD) {
              nearestD = d2;
              nearest = j;
            }
          }
          if (nearest >= 0 && pulsesRef.current.length < 40) {
            pulsesRef.current.push({ from: i, to: nearest, t: 0, speed: 0.03 });
          }
        }
      }
    };

    const ro = new ResizeObserver(() => {
      syncSize();
    });
    ro.observe(wrap);

    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown, { passive: true });
    // Also track when pointer is over the wrap (larger hit area)
    wrap.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerleave", onLeave);

    syncSize();
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative h-[min(52vw,28rem)] w-full max-w-xl min-h-[280px] sm:h-[28rem] ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-crosshair"
        aria-label="Interactive neural pathways"
        role="img"
      />
    </div>
  );
}
