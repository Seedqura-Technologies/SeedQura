"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * LearningsHeroVisual
 *
 * Interactive canvas for the Learnings hero (right column).
 * Inspired by Research AsciiTextureHero + 21st.dev synapse networks:
 * drifting knowledge nodes, synaptic links, cursor-fired pulses,
 * and a faint ASCII “signal” underlay — sage/teal Seedqura palette.
 */

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  energy: number;
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

const GLYPHS = "·∙∘○●◇◆□■▲△+".split("");

export function LearningsHeroVisual({ className = "" }: LearningsHeroVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const nodesRef = useRef<Node[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5, inside: false });
  const reducedRef = useRef(false);
  const lastPulseRef = useRef(0);

  const initNodes = useCallback((w: number, h: number, count: number) => {
    const nodes: Node[] = [];
    const cx = w * 0.5;
    const cy = h * 0.5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const radius = Math.min(w, h) * (0.18 + Math.random() * 0.32);
      nodes.push({
        x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        r: 2.2 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2,
        energy: 0,
      });
    }
    // Hub node near center
    nodes.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      r: 5.5,
      phase: 0,
      energy: 0.4,
    });
    nodesRef.current = nodes;
  }, []);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    if (W < 2 || H < 2) {
      frameRef.current = requestAnimationFrame(render);
      return;
    }

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const t = time * 0.001;
    const nodes = nodesRef.current;
    if (!nodes.length) {
      const count = W < 400 ? 28 : 42;
      initNodes(W, H, count);
    }

    const mx = mouseRef.current.x * W;
    const my = mouseRef.current.y * H;
    const mouseActive = mouseRef.current.inside;
    const connectionRadius = Math.min(W, H) * 0.36;
    const reduced = reducedRef.current;

    // Soft vignette plate — ambient only, no hard box
    const plate = ctx.createRadialGradient(
      W * 0.5,
      H * 0.48,
      Math.min(W, H) * 0.05,
      W * 0.5,
      H * 0.5,
      Math.max(W, H) * 0.72
    );
    plate.addColorStop(0, "rgba(13, 25, 20, 0.22)");
    plate.addColorStop(0.45, "rgba(7, 17, 13, 0.06)");
    plate.addColorStop(1, "rgba(7, 17, 13, 0)");
    ctx.fillStyle = plate;
    ctx.fillRect(0, 0, W, H);

    // Faint ASCII underlay — “knowledge grain”
    if (!reduced) {
      const fz = Math.max(8, Math.floor(W / 55));
      const lh = fz * 1.35;
      const cols = Math.floor(W / fz);
      const rows = Math.floor(H / lh);
      ctx.font = `${fz}px "Courier New", Courier, monospace`;
      ctx.textBaseline = "top";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = x / cols - 0.5;
          const ny = y / rows - 0.5;
          const dist = Math.sqrt(nx * nx + ny * ny);
          if (dist > 0.48) continue;
          const wave = 0.5 + 0.5 * Math.sin(t * 0.9 + x * 0.35 + y * 0.28);
          const b = (1 - dist * 1.6) * wave * 0.22;
          if (b < 0.04) continue;
          const gi = Math.floor((wave * 0.7 + dist) * (GLYPHS.length - 1)) % GLYPHS.length;
          ctx.fillStyle = `rgba(34, 211, 165, ${b * 0.35})`;
          ctx.fillText(GLYPHS[gi], x * fz, y * lh);
        }
      }
    }

    // Update nodes — freer drift, soft bounds (no hard box feel)
    const pad = 8;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const isHub = i === nodes.length - 1;

      if (!isHub && !reduced) {
        n.x += n.vx;
        n.y += n.vy;
        // Soft bounce near edges instead of hard walls
        if (n.x < pad) n.vx += 0.08;
        if (n.x > W - pad) n.vx -= 0.08;
        if (n.y < pad) n.vy += 0.08;
        if (n.y > H - pad) n.vy -= 0.08;
        n.x = Math.max(-20, Math.min(W + 20, n.x));
        n.y = Math.max(-20, Math.min(H + 20, n.y));
        n.vx += (W * 0.5 - n.x) * 0.000025;
        n.vy += (H * 0.5 - n.y) * 0.000025;
        n.vx *= 0.997;
        n.vy *= 0.997;
      } else if (isHub) {
        n.x = W * 0.5 + Math.sin(t * 0.4) * 8;
        n.y = H * 0.48 + Math.cos(t * 0.35) * 7;
      }

      n.phase += 0.025;
      n.energy *= 0.93;

      if (mouseActive) {
        const dx = n.x - mx;
        const dy = n.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        const influence = 140;
        if (d < influence) {
          const strength = 1 - d / influence;
          n.energy = Math.min(1, n.energy + strength * 0.28);
          if (!isHub && d > 1) {
            // Attract slightly then push — lively interaction
            const pull = strength * 0.07;
            n.vx += (-dx / d) * pull * 0.55 + (dx / d) * pull * 0.35;
            n.vy += (-dy / d) * pull * 0.55 + (dy / d) * pull * 0.35;
          }
        }
      }

      if (!reduced && Math.random() < 0.006) {
        n.energy = Math.min(1, n.energy + 0.7);
      }
    }

    // Spawn pulses from high-energy nodes
    if (!reduced && time - lastPulseRef.current > 90) {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].energy < 0.55) continue;
        let nearest = -1;
        let nearestD = connectionRadius;
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < nearestD) {
            nearestD = d;
            nearest = j;
          }
        }
        if (nearest >= 0 && pulsesRef.current.length < 28) {
          pulsesRef.current.push({
            from: i,
            to: nearest,
            t: 0,
            speed: 0.018 + Math.random() * 0.02,
          });
          lastPulseRef.current = time;
        }
      }
    }

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > connectionRadius) continue;

        const proximity = 1 - d / connectionRadius;
        const boost = Math.max(a.energy, b.energy) * 0.55;
        const alpha = 0.06 + proximity * 0.22 + boost * 0.35;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(34, 211, 165, ${alpha})`;
        ctx.lineWidth = 0.8 + boost * 1.2;
        ctx.stroke();
      }
    }

    // Draw traveling pulses
    const nextPulses: Pulse[] = [];
    for (const p of pulsesRef.current) {
      p.t += p.speed;
      if (p.t >= 1) {
        nodes[p.to].energy = Math.min(1, nodes[p.to].energy + 0.65);
        continue;
      }
      const a = nodes[p.from];
      const b = nodes[p.to];
      if (!a || !b) continue;
      const x = a.x + (b.x - a.x) * p.t;
      const y = a.y + (b.y - a.y) * p.t;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
      glow.addColorStop(0, "rgba(167, 243, 208, 0.95)");
      glow.addColorStop(0.35, "rgba(34, 211, 165, 0.55)");
      glow.addColorStop(1, "rgba(34, 211, 165, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(236, 253, 245, 0.95)";
      ctx.fill();

      nextPulses.push(p);
    }
    pulsesRef.current = nextPulses;

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const isHub = i === nodes.length - 1;
      const pulse = 0.7 + 0.3 * Math.sin(n.phase + t * 2);
      const size = n.r * (isHub ? 1 + 0.12 * Math.sin(t * 1.6) : pulse);
      const e = n.energy;

      // Outer glow
      const glowR = size * (3.5 + e * 4);
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
      g.addColorStop(0, `rgba(34, 211, 165, ${0.18 + e * 0.35})`);
      g.addColorStop(1, "rgba(34, 211, 165, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
      ctx.fillStyle = isHub
        ? `rgba(167, 243, 208, ${0.75 + e * 0.25})`
        : `rgba(34, 211, 165, ${0.45 + e * 0.5})`;
      ctx.fill();

      if (isHub) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, size * 1.85, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 211, 165, ${0.35 + e * 0.3})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // Label — light, no frame
    ctx.font = `10px "Courier New", Courier, monospace`;
    ctx.fillStyle = "rgba(34, 211, 165, 0.28)";
    ctx.textBaseline = "top";
    ctx.fillText("LEARNINGS · MOVE TO EXCITE", 8, 8);

    // Horizontal scanline (research-page kinship)
    if (!reduced) {
      const scanY = ((t * 0.22) % 1) * H;
      const hg = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
      hg.addColorStop(0, "rgba(34, 211, 165, 0)");
      hg.addColorStop(0.5, "rgba(34, 211, 165, 0.05)");
      hg.addColorStop(1, "rgba(34, 211, 165, 0)");
      ctx.fillStyle = hg;
      ctx.fillRect(0, scanY - 10, W, 20);
    }

    frameRef.current = requestAnimationFrame(render);
  }, [initNodes]);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const inside = x >= -0.05 && x <= 1.05 && y >= -0.05 && y <= 1.05;
      mouseRef.current = { x, y, inside };
    };
    const onLeave = () => {
      mouseRef.current.inside = false;
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      // Burst energy near cursor on press / tap
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      for (const n of nodesRef.current) {
        const dx = n.x - mx;
        const dy = n.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 160) {
          n.energy = 1;
        }
      }
    };

    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    frameRef.current = requestAnimationFrame(render);

    const onResize = () => {
      nodesRef.current = [];
      pulsesRef.current = [];
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(render);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, [render]);

  return (
    <div
      className={`relative aspect-[5/4] w-full max-w-xl sm:aspect-square ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        aria-label="Interactive neural pathways"
        role="img"
      />
    </div>
  );
}
