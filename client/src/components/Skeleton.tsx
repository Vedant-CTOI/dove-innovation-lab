import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/* ──────────────────────────────────────────────────────────
   Skeleton — branded loading state matching final layout
   dimensions. Pulp droplets falling animation (not grey bars).
   ────────────────────────────────────────────────────────── */

export interface SkeletonProps {
  /** Width — match final element width */
  width?: string | number;
  /** Height — match final element height */
  height?: string | number;
  /** Border radius */
  radius?: "sm" | "md" | "lg" | "pill" | string;
  /** Number of skeleton lines (for text) */
  lines?: number;
  className?: string;
}

const RADII = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  pill: "var(--radius-pill)",
} as const;

export function Skeleton({
  width = "100%",
  height = 20,
  radius = "md",
  lines = 1,
  className = "",
}: SkeletonProps) {
  const prefersReduced = useReducedMotion();
  const rad = RADII[radius as keyof typeof RADII] || radius;

  if (lines > 1) {
    return (
      <div className={["flex flex-col gap-2", className].join(" ")}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === lines - 1 ? "60%" : "100%"}
            height={height}
            radius={rad}
            animate={!prefersReduced}
          />
        ))}
      </div>
    );
  }

  return (
    <SkeletonLine
      width={width}
      height={height}
      radius={rad}
      animate={!prefersReduced}
      className={className}
    />
  );
}

function SkeletonLine({
  width,
  height,
  radius,
  animate = true,
  className = "",
}: {
  width: string | number;
  height: string | number;
  radius: string;
  animate?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={[
        "relative overflow-hidden",
        "bg-ink/30 theme-light:bg-cream/40",
        className,
      ].join(" ")}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: radius,
      }}
    >
      {/* Pulp droplet shimmer — falling orange gradient */}
      {animate && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(252, 188, 0, 0.15) 50%, transparent 100%)",
          }}
          animate={{ y: ["-100%", "100%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}

/* ── Pre-composed skeleton layouts matching final dimensions ── */

export function SkeletonIdeaCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "glass rounded-[var(--radius-lg)] p-4 noise-overlay",
        "shadow-[0_4px_12px_rgba(0,0,0,0.20),0_12px_28px_rgba(0,0,0,0.10)]",
        className,
      ].join(" ")}
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="flex flex-col gap-3" style={{ borderRadius: `calc(var(--radius-lg) - var(--radius-gap))` }}>
        <Skeleton width={120} height={20} radius="pill" />
        <Skeleton width="100%" height={40} radius="md" lines={2} />
        <Skeleton width={80} height={32} radius="sm" />
      </div>
    </div>
  );
}

export function SkeletonQRCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "glass rounded-[var(--radius-xl)] p-6 noise-overlay",
        "shadow-[0_8px_24px_rgba(0,0,0,0.40)]",
        className,
      ].join(" ")}
      style={{ borderRadius: "var(--radius-xl)" }}
    >
      <div className="flex flex-col items-center gap-4" style={{ borderRadius: `calc(var(--radius-xl) - var(--radius-gap))` }}>
        <Skeleton width={200} height={24} radius="sm" />
        <Skeleton width={200} height={200} radius="lg" />
        <Skeleton width={120} height={40} radius="md" />
      </div>
    </div>
  );
}

export function SkeletonTimer({ className = "" }: { className?: string }) {
  return (
    <Skeleton
      width={120}
      height={56}
      radius="lg"
      className={className}
    />
  );
}

export function SkeletonGrid({
  count = 6,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <div className={["grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className].join(" ")}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <SkeletonIdeaCard />
        </motion.div>
      ))}
    </div>
  );
}

export type { ReactNode };
