"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * LearningsHeroVisual
 *
 * Always-full neural field for the Learnings hero.
 * Each node has a home position and springs back — never collapses
 * into a single glow. Cursor excites nodes and fires pulses.
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

const GLYPHS = "·∙∘○●◇◆□■▲△+".split("");

export function LearningsHeroVisual({ className = "" }: LearningsHeroVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const nodesRef = useRef<Node[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5, inside: false });
  const reducedRef = useRef(false);
  const lastPulseRef = useRef(0);
  const lastAmbientRef = useRef(0);

  const initNodes = useCallback((w: number, h: number, count: number) => {
    const nodes: Node[] = [];
    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxR = Math.min(w, h) * 0.42;

    // Spread across rings so the field stays large
    for (let i = 0; i < count; i++) {
      const ring = 0.35 + (i % 4) * 0.18 + Math.random() * 0.08;
      const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.15;
      const radius = maxR * ring;
      const hx = cx + Math.cos(angle) * radius;
      const hy = cy + Math.sin(angle) * radius * 0.92;
      nodes.push({
        x: hx,
        y: hy,
        homeX: hx,
        homeY: hy,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 2.4 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        energy: 0.15 + Math.random() * 0.2,
        orbit: Math.random() * Math.PI * 2,
        orbitSpeed: 0.35 + Math.random() * 0.55,
      });
    }

    // Soft hub — visible but not dominant
    nodes.push({
      x: cx,
      y: cy,
      homeX: cx,
      homeY: cy,
      vx: 0,
      vy: 0,
      r: 4.2,
      phase: 0,
      energy: 0.35,
      orbit: 0,
      orbitSpeed: 0.2,
    });

    nodesRef.current = nodes;
  }, []);

  const render = useCallback(
    (time: number) => {
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
        initNodes(W, H, W < 400 ? 34 : 48);
      }

      const mx = mouseRef.current.x * W;
      const my = mouseRef.current.y * H;
      const mouseActive = mouseRef.current.inside;
      const connectionRadius = Math.min(W, H) * 0.34;
      const reduced = reducedRef.current;

      // Soft ambient wash — no hard box
      const plate = ctx.createRadialGradient(
        W * 0.5,
        H * 0.48,
        Math.min(W, H) * 0.08,
        W * 0.5,
        H * 0.5,
        Math.max(W, H) * 0.7
      );
      plate.addColorStop(0, "rgba(13, 25, 20, 0.18)");
      plate.addColorStop(0.5, "rgba(7, 17, 13, 0.05)");
      plate.addColorStop(1, "rgba(7, 17, 13, 0)");
      ctx.fillStyle = plate;
      ctx.fillRect(0, 0, W, H);

      // ASCII grain across most of the field (kept large)
      if (!reduced) {
        const fz = Math.max(8, Math.floor(W / 52));
        const lh = fz * 1.35;
        const cols = Math.floor(W / fz);
        const rows = Math.floor(H / lh);
        ctx.font = `${fz}px "Courier New", Courier, monospace`;
        ctx.textBaseline = "top";
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const nx = x / cols - 0.5;
            const ny = y / rows - 0.5;
            const dist = Math.sqrt(nx * nx * 1.1 + ny * ny);
            if (dist > 0.55) continue;
            const wave = 0.5 + 0.5 * Math.sin(t * 0.85 + x * 0.32 + y * 0.26);
            const b = (1 - dist * 1.35) * wave * 0.2;
            if (b < 0.035) continue;
            const gi =
              Math.floor((wave * 0.7 + dist) * (GLYPHS.length - 1)) %
              GLYPHS.length;
            ctx.fillStyle = `rgba(34, 211, 165, ${b * 0.32})`;
            ctx.fillText(GLYPHS[gi], x * fz, y * lh);
          }
        }
      }

      // Physics — spring to home + light orbit = always spread out
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHub = i === nodes.length - 1;

        n.orbit += n.orbitSpeed * 0.016;
        n.phase += 0.03;

        // Breathing home target (keeps motion without collapse)
        const breatheX = Math.cos(n.orbit) * (isHub ? 10 : 14);
        const breatheY = Math.sin(n.orbit * 0.9) * (isHub ? 8 : 12);
        const targetX = n.homeX + breatheX;
        const targetY = n.homeY + breatheY;

        if (!reduced) {
          n.vx += (targetX - n.x) * 0.045;
          n.vy += (targetY - n.y) * 0.045;
          n.vx *= 0.86;
          n.vy *= 0.86;
          n.x += n.vx;
          n.y += n.vy;
        } else {
          n.x = targetX;
          n.y = targetY;
        }

        // Ambient baseline energy — never go dark/collapsed
        n.energy = Math.max(0.12, n.energy * 0.96);

        if (mouseActive) {
          const dx = n.x - mx;
          const dy = n.y - my;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const influence = Math.min(W, H) * 0.38;
          if (d < influence) {
            const strength = 1 - d / influence;
            n.energy = Math.min(1, n.energy + strength * 0.35);
            // Mild push away from cursor — excite, don't suck in
            if (!isHub) {
              n.vx += (dx / d) * strength * 0.9;
              n.vy += (dy / d) * strength * 0.9;
            }
          }
        }
      }

      // Ambient pulses so the web always feels alive
      if (!reduced && time - lastAmbientRef.current > 420) {
        lastAmbientRef.current = time;
        const a = Math.floor(Math.random() * (nodes.length - 1));
        let b = Math.floor(Math.random() * (nodes.length - 1));
        if (b === a) b = (a + 1) % (nodes.length - 1);
        const dx = nodes[a].x - nodes[b].x;
        const dy = nodes[a].y - nodes[b].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < connectionRadius * 1.35 && pulsesRef.current.length < 24) {
          nodes[a].energy = Math.min(1, nodes[a].energy + 0.45);
          pulsesRef.current.push({
            from: a,
            to: b,
            t: 0,
            speed: 0.016 + Math.random() * 0.018,
          });
        }
      }

      // Cursor / energy pulses
      if (!reduced && time - lastPulseRef.current > 70) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].energy < 0.5) continue;
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
          if (nearest >= 0 && pulsesRef.current.length < 32) {
            pulsesRef.current.push({
              from: i,
              to: nearest,
              t: 0,
              speed: 0.02 + Math.random() * 0.022,
            });
            lastPulseRef.current = time;
          }
        }
      }

      // Connections — always a visible mesh
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > connectionRadius) continue;

          const proximity = 1 - d / connectionRadius;
          const boost = Math.max(a.energy, b.energy) * 0.5;
          const alpha = 0.1 + proximity * 0.28 + boost * 0.32;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(34, 211, 165, ${alpha})`;
          ctx.lineWidth = 0.85 + boost;
          ctx.stroke();
        }
      }

      // Traveling pulses
      const nextPulses: Pulse[] = [];
      for (const p of pulsesRef.current) {
        p.t += p.speed;
        if (p.t >= 1) {
          if (nodes[p.to]) {
            nodes[p.to].energy = Math.min(1, nodes[p.to].energy + 0.55);
          }
          continue;
        }
        const a = nodes[p.from];
        const b = nodes[p.to];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;

        const glow = ctx.createRadialGradient(x, y, 0, x, y, 9);
        glow.addColorStop(0, "rgba(167, 243, 208, 0.9)");
        glow.addColorStop(0.4, "rgba(34, 211, 165, 0.45)");
        glow.addColorStop(1, "rgba(34, 211, 165, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(236, 253, 245, 0.95)";
        ctx.fill();

        nextPulses.push(p);
      }
      pulsesRef.current = nextPulses;

      // Nodes — capped glow so nothing becomes a lone blob
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHub = i === nodes.length - 1;
        const pulse = 0.78 + 0.22 * Math.sin(n.phase + t * 2.1);
        const size = n.r * (isHub ? 1 + 0.1 * Math.sin(t * 1.5) : pulse);
        const e = n.energy;

        const glowR = Math.min(size * (2.8 + e * 2.4), isHub ? 22 : 18);
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
        g.addColorStop(0, `rgba(34, 211, 165, ${0.22 + e * 0.28})`);
        g.addColorStop(1, "rgba(34, 211, 165, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
        ctx.fillStyle = isHub
          ? `rgba(167, 243, 208, ${0.7 + e * 0.2})`
          : `rgba(34, 211, 165, ${0.5 + e * 0.4})`;
        ctx.fill();

        if (isHub) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, size * 1.7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 165, ${0.3 + e * 0.25})`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }

      ctx.font = `10px "Courier New", Courier, monospace`;
      ctx.fillStyle = "rgba(34, 211, 165, 0.28)";
      ctx.textBaseline = "top";
      ctx.fillText("LEARNINGS · MOVE TO EXCITE", 8, 8);

      if (!reduced) {
        const scanY = ((t * 0.2) % 1) * H;
        const hg = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
        hg.addColorStop(0, "rgba(34, 211, 165, 0)");
        hg.addColorStop(0.5, "rgba(34, 211, 165, 0.045)");
        hg.addColorStop(1, "rgba(34, 211, 165, 0)");
        ctx.fillStyle = hg;
        ctx.fillRect(0, scanY - 10, W, 20);
      }

      frameRef.current = requestAnimationFrame(render);
    },
    [initNodes]
  );

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const inside = x >= -0.08 && x <= 1.08 && y >= -0.08 && y <= 1.08;
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
        const dx = n.x - mx;
        const dy = n.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 200) {
          n.energy = 1;
          // Spawn a few pulses from this node
          if (pulsesRef.current.length < 30) {
            let nearest = -1;
            let nearestD = 9999;
            for (let j = 0; j < nodes.length; j++) {
              if (i === j) continue;
              const d2 = Math.hypot(n.x - nodes[j].x, n.y - nodes[j].y);
              if (d2 < nearestD) {
                nearestD = d2;
                nearest = j;
              }
            }
            if (nearest >= 0) {
              pulsesRef.current.push({
                from: i,
                to: nearest,
                t: 0,
                speed: 0.028,
              });
            }
          }
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
    <div className={`relative aspect-[5/4] w-full max-w-xl sm:aspect-square ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        aria-label="Interactive neural pathways"
        role="img"
      />
    </div>
  );
}
