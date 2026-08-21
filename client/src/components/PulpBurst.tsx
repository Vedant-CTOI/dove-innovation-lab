import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useReducedMotion } from "framer-motion";
import { DURATION } from "./motion";

/* ──────────────────────────────────────────────────────────
   PulpBurst — the ownable Minute Maid asset.
   Radial burst of tapered golden-yellow pulp shards exploding
   from behind focal elements. Used on idea submission, correct
   answers, radial rays as loading state.
   ────────────────────────────────────────────────────────── */

export interface PulpBurstHandle {
  /** Trigger the pulp burst animation */
  trigger: () => void;
}

export interface PulpBurstProps {
  /** Whether the burst is continuously active (loading state) */
  active?: boolean;
  /** Number of particles in the burst */
  count?: number;
  className?: string;
}

interface Shard {
  angle: number;
  distance: number;
  length: number;
  width: number;
  color: string;
  speed: number;
  delay: number;
}

const PULP_COLORS = [
  "#FCBC00",
  "#F08810",
  "#FFE08A",
  "#DC8800",
  "#F8A820",
];

export const PulpBurst = forwardRef<PulpBurstHandle, PulpBurstProps>(
  function PulpBurst({ active = false, count = 16, className = "" }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const prefersReduced = useReducedMotion();
    const shardsRef = useRef<Shard[]>([]);
    const rafRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const activeRef = useRef(active);
    activeRef.current = active;

    // Generate shard configuration
    const generateShards = (n: number): Shard[] => {
      return Array.from({ length: n }, (_, i) => ({
        angle: (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.3,
        distance: 60 + Math.random() * 80,
        length: 20 + Math.random() * 30,
        width: 4 + Math.random() * 6,
        color: PULP_COLORS[i % PULP_COLORS.length],
        speed: 0.8 + Math.random() * 0.4,
        delay: Math.random() * 0.1,
      }));
    };

    // Draw a single tapered pulp shard
    const drawShard = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      shard: Shard,
      progress: number,
    ) => {
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const dist = shard.distance * eased * shard.speed;
      const x = cx + Math.cos(shard.angle) * dist;
      const y = cy + Math.sin(shard.angle) * dist;
      const opacity = Math.max(0, 1 - progress);
      const len = shard.length * (1 - progress * 0.3);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(shard.angle + Math.PI / 2);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = shard.color;
      ctx.shadowColor = shard.color;
      ctx.shadowBlur = 8;

      // Tapered shard shape
      ctx.beginPath();
      ctx.moveTo(0, -len / 2);
      ctx.lineTo(shard.width / 2, len / 2);
      ctx.lineTo(-shard.width / 2, len / 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const animate = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const duration = DURATION.burst;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw central glow
      if (progress < 0.5) {
        const glowRadius = 30 + progress * 40;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        glow.addColorStop(0, `rgba(252, 188, 0, ${0.3 * (1 - progress * 2)})`);
        glow.addColorStop(1, "rgba(252, 188, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw shards
      for (const shard of shardsRef.current) {
        const shardProgress = Math.max(0, Math.min(1, (progress - shard.delay) / (1 - shard.delay)));
        drawShard(ctx, cx, cy, shard, shardProgress);
      }

      if (activeRef.current) {
        // Continuous mode — restart loop
        if (progress >= 1) {
          startTimeRef.current = timestamp;
          shardsRef.current = generateShards(count);
        }
        rafRef.current = requestAnimationFrame(animate);
      } else if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    useImperativeHandle(ref, () => ({
      trigger: () => {
        if (prefersReduced) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        shardsRef.current = generateShards(count);
        startTimeRef.current = performance.now();
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(animate);
      },
    }));

    // Auto-start in continuous mode
    useEffect(() => {
      if (active && !prefersReduced) {
        shardsRef.current = generateShards(count);
        startTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(animate);
      }
      return () => cancelAnimationFrame(rafRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, prefersReduced, count]);

    return (
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className={["absolute inset-0 pointer-events-none", className].join(" ")}
        style={{ width: "100%", height: "100%" }}
        aria-hidden="true"
      />
    );
  },
);
