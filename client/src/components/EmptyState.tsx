import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { SPRING } from "./motion";

/* ──────────────────────────────────────────────────────────
   EmptyState — designed illustration + CTA, NOT grey text.
   Uses branded SVG illustration (empty-orchard.svg) and
   a primary action button. Orange slice visual = brand-coded.
   ────────────────────────────────────────────────────────── */

export interface EmptyStateProps {
  /** Illustration image path (defaults to empty-orchard.svg) */
  illustration?: string;
  /** Title text */
  title: string;
  /** Subtitle/description */
  description?: string;
  /** CTA button text */
  ctaLabel?: string;
  /** CTA button onClick */
  onCta?: () => void;
  /** Custom children instead of CTA button */
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  illustration = "/img/empty-orchard.svg",
  title,
  description,
  ctaLabel,
  onCta,
  children,
  className = "",
}: EmptyStateProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={SPRING.gentle}
      className={[
        "flex flex-col items-center justify-center gap-6",
        "p-8 text-center",
        "glass rounded-[var(--radius-xl)] noise-overlay",
        "shadow-[0_4px_12px_rgba(0,0,0,0.20),0_12px_28px_rgba(0,0,0,0.15),0_24px_56px_rgba(0,0,0,0.10)]",
        className,
      ].join(" ")}
      style={{
        borderRadius: "var(--radius-xl)",
      }}
    >
      {/* Illustration with nested radius container */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-lg)] p-4"
        style={{
          borderRadius: `calc(var(--radius-xl) - var(--radius-gap))`,
        }}
      >
        <motion.img
          src={illustration}
          alt=""
          className="w-32 h-24 object-contain"
          animate={prefersReduced ? undefined : { y: [0, -6, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-xl font-bold text-cream/90">
          {title}
        </h3>
        {description && (
          <p className="font-body text-sm text-cream/50 max-w-xs">
            {description}
          </p>
        )}
      </div>

      {/* CTA */}
      {children || (ctaLabel && onCta && (
        <Button variant="primary" size="md" onClick={onCta}>
          {ctaLabel}
        </Button>
      ))}
    </motion.div>
  );
}
