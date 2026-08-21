/* ──────────────────────────────────────────────────────────
   motion.ts — Brand motion config for Framer Motion
   Spring/overshoot easing everywhere. Honours prefers-reduced-motion.
   ────────────────────────────────────────────────────────── */

import { useReducedMotion, type Transition } from "framer-motion";
import { useMemo } from "react";

/* ── Easing arrays (Framer Motion accepts cubic-bezier arrays) ── */
/** cubic-bezier(.34, 1.56, .64, 1) — the brand bounce easing */
export const EASE_BOUNCE = [0.34, 1.56, 0.64, 1] as const;
export const EASE_JUICE = [0.22, 1, 0.36, 1] as const;
export const EASE_SPRING_IN = [0.64, -0.56, 0.34, 1.56] as const;

/* ── Duration constants (seconds, for Framer Motion JS engine) ── */
export const DURATION = {
  fast: 0.15,
  base: 0.3,
  slow: 0.5,
  burst: 0.8,
} as const;

/* ── Spring configs ── */
export const SPRING = {
  bounce: { type: "spring" as const, stiffness: 500, damping: 12 },
  gentle: { type: "spring" as const, stiffness: 300, damping: 20 },
  overshoot: { type: "spring" as const, stiffness: 400, damping: 8 },
} as const;

/* ── Reduced-motion-aware transition builder ── */
export function useMotionTransition(
  base: Partial<Transition> = {},
): Transition {
  const prefersReduced = useReducedMotion();
  return useMemo(() => {
    if (prefersReduced) {
      return {
        duration: 0,
        ...base,
      };
    }
    return {
      duration: DURATION.base,
      ease: EASE_BOUNCE,
      ...base,
    };
  }, [prefersReduced, base]);
}

/* ── Variant presets (reduced-motion safe) ── */
export function useBounceHover() {
  const prefersReduced = useReducedMotion();
  return useMemo(
    () => ({
      rest: { scale: 1, opacity: 1 },
      hover: prefersReduced ? { opacity: 0.85 } : { scale: 1.04 },
      tap: prefersReduced ? { opacity: 0.7 } : { scale: 0.96 },
    }),
    [prefersReduced],
  );
}

export function useStaggerContainer(stagger = 0.05) {
  const prefersReduced = useReducedMotion();
  return useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: prefersReduced
        ? { opacity: 1, transition: { duration: 0 } }
        : {
            opacity: 1,
            transition: {
              staggerChildren: stagger,
              delayChildren: 0.1,
            },
          },
    }),
    [prefersReduced, stagger],
  );
}

export function useStaggerItem() {
  const prefersReduced = useReducedMotion();
  return useMemo(
    () => ({
      hidden: prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 },
      visible: prefersReduced
        ? { opacity: 1 }
        : { opacity: 1, y: 0, scale: 1 },
    }),
    [prefersReduced],
  );
}
