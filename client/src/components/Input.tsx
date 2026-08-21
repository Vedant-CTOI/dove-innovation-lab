import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { DURATION, EASE_BOUNCE } from "./motion";

/* ──────────────────────────────────────────────────────────
   Input — branded text field, focus-visible in both themes,
   nested radii, layered shadow on focus, accent font for labels
   ────────────────────────────────────────────────────────── */

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-6 py-3.5 text-lg",
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      size = "md",
      className = "",
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId = id || rest.name || "input";

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-accent font-medium text-sm text-orange-dark theme-dark:text-pulp-light"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-orange-dark/60 theme-dark:text-pulp-gold/60 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full font-body bg-white/80 theme-dark:bg-ink/60 text-ink theme-dark:text-cream",
              "border-2 rounded-[var(--radius-md)] outline-none transition-all",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              SIZES[size],
              error
                ? "border-berry-red focus:border-berry-red"
                : "border-orange-dark/20 focus:border-pulpy-orange",
              "focus:shadow-[0_0_0_3px_rgba(252,188,0,0.25),0_2px_8px_rgba(240,136,16,0.15),0_4px_16px_rgba(240,136,16,0.08)]",
              "placeholder:text-ink/30 theme-dark:placeholder:text-cream/30",
              className,
            ].join(" ")}
            style={{
              borderRadius: `calc(var(--radius-md) - var(--radius-gap))`,
              transitionTimingFunction: "var(--ease-bounce)",
              transitionDuration: "var(--duration-fast)",
            }}
            data-iris-duration={DURATION.fast}
            data-iris-ease={EASE_BOUNCE.join(",")}
            {...rest}
          />
          {rightIcon && (
            <span className="absolute right-3 flex items-center text-orange-dark/60 theme-dark:text-pulp-gold/60">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-xs text-berry-red font-body">{error}</p>
        ) : hint ? (
          <p className="text-xs text-ink/50 theme-dark:text-cream/40 font-body">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
