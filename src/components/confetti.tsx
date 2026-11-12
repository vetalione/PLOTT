"use client";

import * as React from "react";

export type ConfettiHandle = { fire: (opts?: { count?: number; power?: number }) => void };

const COLORS = ["#16c26b", "#b8e62e", "#ee4a92", "#f5a524", "#141414", "#7ad63f"];

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  round: boolean;
  life: number;
  ttl: number;
};

/**
 * A burst of soft confetti from the centre of its box. The canvas covers its positioned parent,
 * ignores the pointer and only runs a frame loop while pieces are in the air.
 */
export const Confetti = React.forwardRef<ConfettiHandle, { className?: string }>(function Confetti(
  { className },
  ref,
) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pieces = React.useRef<Piece[]>([]);
  const frame = React.useRef<number | null>(null);

  const tick = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.current = pieces.current.filter((p) => p.life < p.ttl);
    for (const p of pieces.current) {
      p.life += 1;
      p.vx *= 0.965;
      p.vy = p.vy * 0.965 + 0.22;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const fade = Math.min(1, (p.ttl - p.life) / 22);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.roundRect(-p.size / 2, -p.size / 4, p.size, p.size / 2, p.size / 4);
        ctx.fill();
      }
      ctx.restore();
    }

    if (pieces.current.length > 0) {
      frame.current = requestAnimationFrame(tick);
    } else {
      frame.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  React.useImperativeHandle(
    ref,
    () => ({
      fire({ count = 90, power = 1 } = {}) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (4 + Math.random() * 9) * power;
          pieces.current.push({
            x: cx + Math.cos(angle) * 30,
            y: cy + Math.sin(angle) * 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3 * power,
            size: 5 + Math.random() * 8,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.4,
            color: COLORS[(Math.random() * COLORS.length) | 0],
            round: Math.random() < 0.45,
            life: 0,
            ttl: 70 + Math.random() * 50,
          });
        }
        if (frame.current === null) frame.current = requestAnimationFrame(tick);
      },
    }),
    [tick],
  );

  React.useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className ?? "pointer-events-none absolute inset-0 z-10 h-full w-full"}
    />
  );
});
