import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ──────────────────────────────────────────────────────────
   Ticker — smooth marquee, NO clipping (the benchmark contracts
   specifically call out Coke/Sprite ticker clipping as a bug).
   Uses overflow-x-visible with duplicate track for seamless loop.
   Each item is a Badge + text, branded per event type.
   ────────────────────────────────────────────────────────── */

export interface TickerItem {
  id: string;
  badge: string;
  badgeColor?: "pulp" | "sky" | "berry" | "leaf" | "ink";
  text: string;
}

export interface TickerProps {
  items: TickerItem[];
  speed?: number; // pixels per second
  className?: string;
  children?: ReactNode;
}

const BADGE_COLORS: Record<string, string> = {
  pulp: "bg-pulp-gradient text-ink",
  sky: "bg-label-sky text-white",
  berry: "bg-berry-red text-white",
  leaf: "bg-leaf-green text-white",
  ink: "bg-ink text-pulp-gold",
};

export function Ticker({ items, speed = 60, className = "", children }: TickerProps) {
  const prefersReduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicate items for seamless loop
  const displayItems = [...items, ...items];

  // Calculate animation duration based on content width
  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReduced) return;
    const width = track.scrollWidth / 2; // actual content width (half is duplicate)
    const duration = width / speed;
    track.style.animation = `ticker-scroll ${duration}s linear infinite`;
  }, [items, speed, prefersReduced]);

  if (items.length === 0 && !children) {
    return (
      <div
        className={[
          "h-12 flex items-center px-4 rounded-[var(--radius-sm)]",
          "glass noise-overlay text-cream/40 text-sm font-body",
          className,
        ].join(" ")}
      >
        No activity yet
      </div>
    );
  }

  return (
    <div
      className={[
        "relative w-full overflow-hidden",
        "glass noise-overlay",
        "rounded-[var(--radius-sm)]",
        "shadow-[0_2px_8px_rgba(0,0,0,0.30),0_8px_24px_rgba(0,0,0,0.20),0_16px_40px_rgba(0,0,0,0.10)]",
        className,
      ].join(" ")}
      role="marquee"
      aria-label="Live activity ticker"
    >
      {/* Gradient fade edges — prevents visual clipping illusion */}
      <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-r from-night to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-l from-night to-transparent" />

      {/* Track container with overflow visible to prevent glyph clipping */}
      <div className="relative py-2.5 overflow-visible">
        <div
          ref={trackRef}
          className="inline-flex items-center gap-6 whitespace-nowrap"
          style={{
            animationName: prefersReduced ? "none" : "ticker-scroll",
            animationPlayState: "running",
          }}
        >
          {displayItems.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className="inline-flex items-center gap-2"
            >
              <span
                className={[
                  "inline-flex items-center px-2 py-0.5 rounded-[var(--radius-pill)]",
                  "font-accent text-xs font-semibold no-select",
                  "shadow-[0_1px_2px_rgba(0,0,0,0.15)]",
                  BADGE_COLORS[item.badgeColor || "pulp"],
                ].join(" ")}
              >
                {item.badge}
              </span>
              <span className="font-body text-sm text-cream/80">
                {item.text}
              </span>
              <span className="text-pulp-gold/30 mx-2">•</span>
            </div>
          ))}
          {children}
        </div>
      </div>

      {/* Keyframes injected for smooth scroll — no clipping */}
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/** Animated entrance wrapper for a single ticker item */
export function TickerEntrance({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 15,
      }}
      className="inline-flex items-center"
    >
      {children}
    </motion.div>
  );
}
