import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { SPRING } from "./motion";

/* ──────────────────────────────────────────────────────────
   RevealCard — ranked results with branded animation.
   Confetti in brand colors. Radial pulp-burst behind winner.
   ────────────────────────────────────────────────────────── */

export interface RevealItem {
  id: string;
  text: string;
  team: string;
  author: string;
  votes: number;
  rank: number;
}

export interface RevealCardProps {
  item: RevealItem;
  /** Stagger delay for ranked entrance */
  delay?: number;
  className?: string;
}

const RANK_STYLES: Record<number, { badge: "pulp" | "sky" | "berry" | "leaf" | "ink"; emoji: string; glow: boolean }> = {
  1: { badge: "pulp", emoji: "🥇", glow: true },
  2: { badge: "sky", emoji: "🥈", glow: false },
  3: { badge: "berry", emoji: "🥉", glow: false },
};

export function RevealCard({ item, delay = 0, className = "" }: RevealCardProps) {
  const prefersReduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Branded confetti for top 3
  useEffect(() => {
    if (prefersReduced || item.rank > 3) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 200;

    const colors = ["#FCBC00", "#F08810", "#FFE08A", "#DC8800", "#008040"];
    const confetti = Array.from({ length: item.rank === 1 ? 40 : 20 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.5 ? "rect" : "tri",
    }));

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const c of confetti) {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.1; // gravity
        c.rotation += c.rotSpeed;

        if (c.y < canvas.height + 20) alive = true;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, 1 - elapsed / 3);

        if (c.shape === "rect") {
          ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.4);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -c.size / 2);
          ctx.lineTo(c.size / 2, c.size / 2);
          ctx.lineTo(-c.size / 2, c.size / 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      if (alive && elapsed < 3) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [item.rank, delay, prefersReduced]);

  const rankStyle = RANK_STYLES[item.rank] || { badge: "ink" as const, emoji: `${item.rank}`, glow: false };
  const isWinner = item.rank === 1;

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.8, rotate: -3 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={{
        ...SPRING.overshoot,
        delay,
      }}
      className="relative"
    >
      {/* Pulp glow behind winner */}
      {isWinner && !prefersReduced && (
        <motion.div
          className="absolute -inset-4 bg-pulp-gradient opacity-20 blur-2xl rounded-[var(--radius-2xl)]"
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none z-20"
        style={{ width: 400, height: 200 }}
        aria-hidden="true"
      />

      <Card
        variant={isWinner ? "branded" : "glass"}
        padding="md"
        className={className}
      >
        <div
          className="relative z-10 flex items-start gap-4"
          style={{
            borderRadius: `calc(var(--radius-lg) - var(--radius-gap))`,
          }}
        >
          {/* Rank badge */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <motion.div
              initial={prefersReduced ? undefined : { scale: 0, rotate: -180 }}
              animate={prefersReduced ? undefined : { scale: 1, rotate: 0 }}
              transition={{ ...SPRING.bounce, delay: delay + 0.2 }}
              className="text-3xl"
            >
              {rankStyle.emoji}
            </motion.div>
            <Badge variant={rankStyle.badge} size="sm">
              #{item.rank}
            </Badge>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="pulp" size="sm">{item.team}</Badge>
              <span className="font-body text-xs text-ink/40">
                {item.author}
              </span>
            </div>
            <p className={[
              "font-body text-sm leading-relaxed",
              isWinner ? "text-ink/90" : "text-cream/80",
            ].join(" ")}>
              {item.text}
            </p>
          </div>

          {/* Vote count — big, animated */}
          <div className="shrink-0 text-right">
            <motion.div
              initial={prefersReduced ? undefined : { scale: 0 }}
              animate={prefersReduced ? undefined : { scale: 1 }}
              transition={{ ...SPRING.bounce, delay: delay + 0.4 }}
            >
              <p className={[
                "font-accent text-3xl font-bold",
                isWinner ? "text-ink" : "text-pulp-gold",
              ].join(" ")}>
                {item.votes}
              </p>
              <p className={[
                "font-body text-xs",
                isWinner ? "text-ink/50" : "text-cream/40",
              ].join(" ")}>
                {item.votes === 1 ? "vote" : "votes"}
              </p>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
