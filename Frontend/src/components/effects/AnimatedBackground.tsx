"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
};

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 18 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let mx = 0;
    let my = 0;
    let frame = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      const count = Math.min(100, Math.floor((width * height) / 14000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 2.2 + 0.4,
        hue: Math.random() > 0.5 ? 142 : 199,
      }));
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      mouseX.set(mx);
      mouseY.set(my);
    };

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Subtle data stream rays
      if (frame % 2 === 0) {
        for (let r = 0; r < 3; r++) {
          const angle = (frame * 0.002 + r * 2.1) % (Math.PI * 2);
          ctx.beginPath();
          ctx.moveTo(width / 2, height / 2);
          ctx.lineTo(width / 2 + Math.cos(angle) * width, height / 2 + Math.sin(angle) * height);
          const grad = ctx.createLinearGradient(width / 2, height / 2, width, height);
          grad.addColorStop(0, "rgba(34,197,94,0.06)");
          grad.addColorStop(1, "transparent");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          p.vx -= (dx / dist) * 0.025;
          p.vy -= (dy / dist) * 0.025;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.vx *= 0.985;
        p.vy *= 0.985;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 62%, 0.55)`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(34, 197, 94, ${0.18 * (1 - d / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#050816]">
        <div className="animate-aurora absolute -left-1/4 top-0 h-[65vh] w-[65vw] rounded-full bg-green/25 blur-[130px]" />
        <div className="animate-aurora absolute -right-1/4 top-1/4 h-[55vh] w-[55vw] rounded-full bg-blue/18 blur-[110px] [animation-delay:-4s]" />
        <div className="animate-aurora absolute bottom-0 left-1/4 h-[45vh] w-[45vw] rounded-full bg-cyan/12 blur-[100px] [animation-delay:-8s]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(37,99,235,0.08) 0%, transparent 50%)",
          }}
        />
      </div>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 -z-10 opacity-45"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none fixed -z-10 h-72 w-72 rounded-full bg-green/12 blur-[90px]"
        style={{ x: smoothX, y: smoothY, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="pointer-events-none fixed -z-10 h-40 w-40 rounded-full bg-blue/10 blur-[60px]"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-30%",
          translateY: "-30%",
        }}
      />
    </>
  );
}
