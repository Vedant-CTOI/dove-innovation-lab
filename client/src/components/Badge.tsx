import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { SPRING } from "./motion";

/* ──────────────────────────────────────────────────────────
   Badge — playful accent font, brand gradient fills,
   spring entrance, layered shadows (≥3 stops)
   ────────────────────────────────────────────────────────── */

export interface BadgeProps extends Omit<HTMLMotionProps<"span">, "children"> {
  variant?: "pulp" | "sky" | "berry" | "leaf" | "ink";
  size?: "sm" | "md";
  pulse?: boolean;
  children?: ReactNode;
}

const VARIANTS = {
  pulp: "bg-pulp-gradient text-ink",
  sky: "bg-label-sky text-white",
  berry: "bg-berry-red text-white",
  leaf: "bg-leaf-green text-white",
  ink: "bg-ink text-pulp-gold border border-pulp-gold/20",
} as const;

const SIZES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
} as const;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = "pulp", size = "md", pulse = false, className = "", children, ...rest },
    ref,
  ) => {
    return (
      <motion.span
        ref={ref}
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={SPRING.bounce}
        className={[
          "inline-flex items-center gap-1 font-accent font-semibold no-select",
          "rounded-[var(--radius-pill)] shadow-[0_1px_3px_rgba(0,0,0,0.15),0_3px_8px_rgba(0,0,0,0.08),0_6px_16px_rgba(0,0,0,0.04)]",
          VARIANTS[variant],
          SIZES[size],
          className,
        ].join(" ")}
        style={{
          transitionTimingFunction: "var(--ease-bounce)",
        }}
        {...rest}
      >
        {pulse && (
          <motion.span
            className="inline-block w-1.5 h-1.5 rounded-full bg-current"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        {children}
      </motion.span>
    );
  },
);

Badge.displayName = "Badge";
