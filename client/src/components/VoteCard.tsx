import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { SPRING } from "./motion";

/* ──────────────────────────────────────────────────────────
   VoteCard — BLIND voting: NO counts visible until Reveal.
   Participant sees only their own "Back it / Backed" state.
   Behind admin toggle — vote visibility is controlled by operator.
   ────────────────────────────────────────────────────────── */

export interface VoteCardProps {
  ideaId: string;
  ideaText: string;
  team: string;
  author: string;
  /** Whether the current user has backed this idea */
  backed?: boolean;
  /** Whether votes are visible (Reveal phase) */
  revealed?: boolean;
  /** Total vote count — only shown when revealed */
  voteCount?: number;
  /** Called when user toggles their vote */
  onToggle?: () => void;
  /** Whether voting is disabled (not in Vote phase) */
  disabled?: boolean;
  className?: string;
}

export function VoteCard({
  ideaId: _ideaId,
  ideaText,
  team,
  author,
  backed = false,
  revealed = false,
  voteCount,
  onToggle,
  disabled = false,
  className = "",
}: VoteCardProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={SPRING.gentle}
      whileHover={!disabled ? { y: -2 } : undefined}
      className={[
        "relative",
        "glass rounded-[var(--radius-lg)] p-4",
        "shadow-[0_0_0_1px_rgba(252,188,0,0.06),0_4px_12px_rgba(0,0,0,0.30),0_12px_28px_rgba(0,0,0,0.20)]",
        "noise-overlay",
        className,
      ].join(" ")}
      style={{
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div
        className="relative z-10 flex flex-col gap-3"
        style={{
          borderRadius: `calc(var(--radius-lg) - var(--radius-gap))`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="pulp" size="sm">{team}</Badge>
            <span className="font-body text-xs text-cream/40">{author}</span>
          </div>

          {/* BLIND: only show counts when revealed */}
          <AnimatePresence>
            {revealed && voteCount !== undefined && (
              <motion.div
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0 }}
                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={SPRING.bounce}
              >
                <Badge variant="pulp" size="md">
                  {voteCount} {voteCount === 1 ? "vote" : "votes"}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {/* When NOT revealed: show blind indicator */}
          {!revealed && (
            <span className="font-body text-xs text-cream/30 italic">
              Blind
            </span>
          )}
        </div>

        {/* Idea text */}
        <p className="font-body text-sm text-cream/80 leading-relaxed">
          {ideaText}
        </p>

        {/* Vote button — only shows own state, not count */}
        <Button
          variant={backed ? "primary" : "ghost"}
          size="sm"
          onClick={onToggle}
          disabled={disabled}
          className="self-start"
        >
          <motion.span
            key={backed ? "backed" : "back"}
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={SPRING.bounce}
          >
            {backed ? "✓ Backed" : "Back it"}
          </motion.span>
        </Button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────
   VoteToggle — standalone blind vote toggle for operator console
   ────────────────────────────────────────────────────────── */

export interface VoteToggleProps {
  visible: boolean;
  onToggle: (visible: boolean) => void;
  className?: string;
}

export function VoteToggle({ visible, onToggle, className = "" }: VoteToggleProps) {
  return (
    <div
      className={[
        "inline-flex items-center gap-3 p-3",
        "glass rounded-[var(--radius-md)]",
        "shadow-[0_2px_6px_rgba(0,0,0,0.20),0_6px_16px_rgba(0,0,0,0.10)]",
        className,
      ].join(" ")}
    >
      <span className="font-accent text-sm font-semibold text-cream/70">
        Vote Visibility
      </span>
      <button
        onClick={() => onToggle(!visible)}
        className={[
          "relative w-12 h-6 rounded-[var(--radius-pill)] no-select",
          "transition-all",
          visible
            ? "bg-pulp-gradient"
            : "bg-ink/60 border border-cream/10",
        ].join(" ")}
        style={{
          transitionTimingFunction: "var(--ease-bounce)",
          transitionDuration: "var(--duration-base)",
        }}
        role="switch"
        aria-checked={visible}
        aria-label="Toggle vote visibility"
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-cream shadow-md"
          animate={{ left: visible ? 26 : 2 }}
          transition={SPRING.bounce}
        />
      </button>
      <Badge variant={visible ? "pulp" : "ink"} size="sm">
        {visible ? "Revealed" : "Blind"}
      </Badge>
    </div>
  );
}
