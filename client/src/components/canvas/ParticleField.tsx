import { useEffect, useRef, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import {
  initParticles,
  updateParticle,
  drawParticle,
  spawnSpark,
  type Particle,
} from "./particles";

/* ──────────────────────────────────────────────────────────
   ParticleField — Canvas particle system: the brand's heartbeat.
   Pulp droplets + glow orbs + leaf motes + amber sparks.
   Brand-coded shapes, not generic circles.

   Usage:
   <ParticleField className="absolute inset-0" />
   — renders behind content as a fixed full-viewport canvas.
   ────────────────────────────────────────────────────────── */

export interface ParticleFieldProps {
  /** Additional class names for positioning */
  className?: string;
  /** Particle density multiplier (default 1.0) */
  density?: number;
  /** Whether to allow spark bursts on pointer interaction */
  interactive?: boolean;
}

export function ParticleField({
  className = "",
  density = 1.0,
  interactive = true,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced = useReducedMotion();
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    // Clear with slight trail effect for depth
    ctx.fillStyle = "rgba(10, 15, 20, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update + draw all particles
    for (const p of particlesRef.current) {
      updateParticle(p, canvas.width, canvas.height, dt);
      drawParticle(ctx, p);

      // Respawn dead sparks
      if (p.kind === "spark" && p.sparkLife !== undefined && p.sparkLife <= 0) {
        p.x = Math.random() * canvas.width;
        p.y = Math.random() * canvas.height;
        p.vx = (Math.random() - 0.5) * 0.8;
        p.vy = (Math.random() - 0.5) * 0.8;
        p.sparkLife = 1.0;
        p.opacity = 0.8;
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    // Re-init particles on resize
    const scaledDensity = Math.floor(40 * density);
    const w = window.innerWidth;
    const h = window.innerHeight;
    particlesRef.current = initParticles(w, h).slice(0, Math.floor(scaledDensity));
    // If we need more, add them
    while (particlesRef.current.length < scaledDensity) {
      const kinds = ["droplet", "orb", "leaf", "spark"] as const;
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      particlesRef.current.push(
        initParticles(w, h).find((p) => p.kind === kind) ||
          particlesRef.current[0],
      );
    }
  }, [density]);

  useEffect(() => {
    if (prefersReduced) {
      // Static render — just draw once, no animation
      resize();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particlesRef.current) {
          drawParticle(ctx, p);
        }
      }
      return;
    }

    resize();
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    // Pointer interaction — spawn sparks
    const handlePointer = (e: PointerEvent) => {
      if (!interactive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Spawn 3-5 sparks on pointer move (throttled)
      if (Math.random() < 0.3) {
        particlesRef.current.push(spawnSpark(x, y));
        // Cap total particles
        if (particlesRef.current.length > 200) {
          particlesRef.current = particlesRef.current.slice(-200);
        }
      }
    };

    if (interactive) {
      window.addEventListener("pointermove", handlePointer);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointer);
    };
  }, [prefersReduced, resize, draw, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={["pointer-events-none fixed inset-0 z-0", className].join(" ")}
      aria-hidden="true"
    />
  );
}
