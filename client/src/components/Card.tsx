import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { DURATION, EASE_BOUNCE } from "./motion";

/* ──────────────────────────────────────────────────────────
   Card — glass morphism over canvas backdrop, nested radii,
   layered shadows (≥3 stops), noise overlay on dark surfaces
   ────────────────────────────────────────────────────────── */

export interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  variant?: "glass" | "solid" | "branded";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  children?: ReactNode;
}

const VARIANTS = {
  glass:
    "glass shadow-[0_0_0_1px_rgba(252,188,0,0.06),0_4px_12px_rgba(0,0,0,0.40),0_16px_32px_rgba(0,0,0,0.50),0_32px_64px_rgba(0,0,0,0.30)] rounded-[var(--radius-lg)] noise-overlay",
  solid:
    "bg-cream shadow-[0_1px_2px_rgba(196,106,0,0.08),0_4px_8px_rgba(240,136,16,0.10),0_12px_24px_rgba(196,106,0,0.06),0_24px_48px_rgba(16,24,32,0.04)] rounded-[var(--radius-lg)]",
  branded:
    "bg-juice-gradient shadow-[0_1px_2px_rgba(196,106,0,0.20),0_4px_10px_rgba(240,136,16,0.25),0_8px_20px_rgba(220,136,0,0.15)] rounded-[var(--radius-lg)] noise-overlay",
} as const;

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = "glass", padding = "md", interactive = false, className = "", children, ...rest },
    ref,
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
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
          "relative overflow-hidden",
          VARIANTS[variant],
          PADDING[padding],
          className,
        ].join(" ")}
        style={{
          transitionTimingFunction: "var(--ease-bounce)",
        }}
        {...rest}
      >
        {/* Inner content gets nested radius (parent - gap) */}
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

Card.displayName = "Card";
