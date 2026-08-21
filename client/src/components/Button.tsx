import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useBounceHover, DURATION, EASE_BOUNCE } from "./motion";

/* ──────────────────────────────────────────────────────────
   Button — brand gradient fill, spring/overshoot motion,
   layered shadows (≥3 stops), nested radii, :focus-visible
   ────────────────────────────────────────────────────────── */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-juice-gradient text-ink shadow-[0_1px_2px_rgba(196,106,0,0.20),0_4px_10px_rgba(240,136,16,0.25),0_8px_20px_rgba(220,136,0,0.15)] hover:shadow-[0_0_20px_rgba(252,188,0,0.30),0_0_40px_rgba(240,136,16,0.20),0_4px_12px_rgba(220,136,0,0.20)]",
  secondary:
    "bg-label-sky text-white border-2 border-sky-deep/30 shadow-[0_2px_6px_rgba(0,92,184,0.20),0_6px_16px_rgba(0,148,220,0.15),0_12px_32px_rgba(0,92,184,0.08)] hover:border-sky-deep/50",
  ghost:
    "bg-transparent text-orange-dark border-2 border-orange-dark/20 hover:border-orange-dark/40 hover:bg-orange-dark/5",
  danger:
    "bg-berry-red text-white shadow-[0_2px_6px_rgba(196,0,0,0.25),0_6px_16px_rgba(196,0,0,0.15),0_12px_32px_rgba(196,0,0,0.08)]",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-[var(--radius-sm)]",
  md: "px-5 py-2.5 text-base rounded-[var(--radius-md)]",
  lg: "px-8 py-4 text-lg rounded-[var(--radius-lg)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...rest
    },
    ref,
  ) => {
    const variants = useBounceHover();

    return (
      <motion.button
        ref={ref}
        variants={variants}
        initial="rest"
        whileHover={disabled ? undefined : "hover"}
        whileTap={disabled ? undefined : "tap"}
        transition={{ duration: DURATION.fast, ease: EASE_BOUNCE }}
        disabled={disabled}
        className={[
          "relative inline-flex items-center justify-center gap-2 font-display font-semibold no-select",
          "transition-[box-shadow,border-color]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANTS[variant],
          SIZES[size],
          className,
        ].join(" ")}
        style={{
          transitionTimingFunction: "var(--ease-bounce)",
          transitionDuration: "var(--duration-fast)",
        }}
        {...rest}
      >
        {leftIcon && <span className="flex items-center">{leftIcon}</span>}
        {children && <span className="flex items-center">{children}</span>}
        {rightIcon && <span className="flex items-center">{rightIcon}</span>}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
