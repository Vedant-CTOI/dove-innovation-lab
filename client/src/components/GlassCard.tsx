import { forwardRef, type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { DURATION, EASE_BOUNCE } from "./motion";

/* ──────────────────────────────────────────────────────────
   GlassCard — glass morphism on cards over canvas backdrop.
   Frosted glass with brand-tinted blur, subtle border glow,
   layered shadows (≥3 stops), noise overlay for depth.
   ────────────────────────────────────────────────────────── */

export interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  /** Frosted opacity level */
  opacity?: "subtle" | "standard" | "strong";
  /** Border glow intensity */
  glow?: boolean;
  /** Interactive hover lift */
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  children?: ReactNode;
}

const OPACITY = {
  subtle: { dark: "rgba(10, 15, 20, 0.40)", light: "rgba(255, 255, 255, 0.30)" },
  standard: { dark: "rgba(10, 15, 20, 0.60)", light: "rgba(255, 255, 255, 0.55)" },
  strong: { dark: "rgba(10, 15, 20, 0.80)", light: "rgba(255, 255, 255, 0.75)" },
} as const;

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
} as const;

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      opacity = "standard",
      glow = true,
      interactive = false,
      padding = "md",
      className = "",
      children,
      ...rest
    },
    ref,
  ) {
    const prefersReduced = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DURATION.base, ease: EASE_BOUNCE }}
        whileHover={
          interactive
            ? {
                y: -4,
                scale: 1.01,
                transition: { duration: DURATION.fast, ease: EASE_BOUNCE },
              }
            : undefined
        }
        className={[
          "relative overflow-hidden noise-overlay",
          PADDING[padding],
          className,
        ].join(" ")}
        style={{
          borderRadius: "var(--radius-lg)",
          background: OPACITY[opacity].dark,
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          border: glow ? "1px solid rgba(252, 188, 0, 0.12)" : "none",
          boxShadow: [
            "0 0 0 1px rgba(252, 188, 0, 0.04)",
            "0 4px 12px rgba(0, 0, 0, 0.30)",
            "0 16px 32px rgba(0, 0, 0, 0.40)",
            "0 32px 64px rgba(0, 0, 0, 0.20)",
          ].join(", "),
          transitionTimingFunction: "var(--ease-bounce)",
        }}
        {...rest}
      >
        {/* Inner content with nested radius */}
        <div
          className="relative z-10"
          style={{
            borderRadius: `calc(var(--radius-lg) - var(--radius-gap))`,
          }}
        >
          {children}
        </div>
      </motion.div>
    );
  },
);

/** Light theme override — applied when parent has .theme-light or [data-theme="light"] */
export function GlassCardLightOverrides() {
  return (
    <style>{`
      .theme-light .glass,
      [data-theme="light"] .glass {
        background: rgba(255, 255, 255, 0.55) !important;
        backdrop-filter: blur(12px) saturate(1.2) !important;
        -webkit-backdrop-filter: blur(12px) saturate(1.2) !important;
        border-color: rgba(255, 224, 138, 0.40) !important;
      }
    `}</style>
  );
}
