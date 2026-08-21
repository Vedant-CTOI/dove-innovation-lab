import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { DURATION, EASE_BOUNCE } from "./motion";

/* ──────────────────────────────────────────────────────────
   Timer — animated countdown digits with spring/overshoot,
   branded gradient, layered shadows, nested radii.
   Motion posture: shake → bounce → burst (digits bounce on tick)
   ────────────────────────────────────────────────────────── */

export interface TimerProps {
  /** ISO timestamp for when the timer ends */
  endsAt: string | null;
  /** Called when timer reaches zero */
  onExpire?: () => void;
  /** Compact variant for inline display */
  compact?: boolean;
  className?: string;
}

function formatTime(ms: number): { mm: string; ss: string; isLow: boolean } {
  if (ms <= 0) return { mm: "00", ss: "00", isLow: false };
  const totalSec = Math.ceil(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return { mm, ss, isLow: totalSec <= 10 };
}

export function Timer({ endsAt, onExpire, compact = false, className = "" }: TimerProps) {
  const prefersReduced = useReducedMotion();
  const [remaining, setRemaining] = useState<number>(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const tick = useCallback(() => {
    if (!endsAt) return;
    const diff = new Date(endsAt).getTime() - Date.now();
    setRemaining(diff);
    if (diff <= 0 && onExpireRef.current) {
      onExpireRef.current();
    }
  }, [endsAt]);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [tick]);

  const { mm, ss, isLow } = formatTime(remaining);

  const digitClass = compact
    ? "text-2xl font-display font-bold w-[2ch] text-center"
    : "text-4xl md:text-5xl font-display font-bold w-[2ch] text-center";

  const containerClass = compact
    ? "inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-sm)]"
    : "inline-flex items-center gap-2 px-6 py-4 rounded-[var(--radius-lg)]";

  return (
    <div
      className={[
        containerClass,
        isLow
          ? "bg-berry-red text-white shadow-[0_2px_6px_rgba(196,0,0,0.30),0_8px_24px_rgba(196,0,0,0.20),0_16px_48px_rgba(196,0,0,0.10)]"
          : "bg-juice-gradient text-ink shadow-[0_1px_2px_rgba(196,106,0,0.20),0_4px_10px_rgba(240,136,16,0.25),0_8px_20px_rgba(220,136,0,0.15)]",
        "noise-overlay no-select",
        className,
      ].join(" ")}
      role="timer"
      aria-label={`${mm} minutes ${ss} seconds remaining`}
    >
      <div className="relative z-10 flex items-center gap-1" style={{ borderRadius: "calc(var(--radius-sm) - var(--radius-gap))" }}>
        <DigitPair value={mm} className={digitClass} animate={!prefersReduced} />
        <motion.span
          className="text-3xl md:text-4xl font-display font-bold opacity-60"
          animate={prefersReduced ? undefined : { opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          :
        </motion.span>
        <DigitPair value={ss} className={digitClass} animate={!prefersReduced} pulse={isLow} />
      </div>
    </div>
  );
}

function DigitPair({
  value,
  className,
  animate = true,
  pulse = false,
}: {
  value: string;
  className: string;
  animate?: boolean;
  pulse?: boolean;
}) {
  return (
    <div className="relative inline-flex">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={value}
          initial={animate ? { y: -20, opacity: 0, scale: 0.8 } : { opacity: 0 }}
          animate={
            animate
              ? { y: 0, opacity: 1, scale: pulse ? [1, 1.15, 1] : 1 }
              : { opacity: 1 }
          }
          exit={animate ? { y: 20, opacity: 0, scale: 0.8 } : { opacity: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE_BOUNCE }}
          className={className}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
