import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";
import { SPRING, DURATION, EASE_BOUNCE } from "./motion";

/* ──────────────────────────────────────────────────────────
   CoachPanel — collapsed by default (per visual-benchmark).
   3 personas (Provocateur, Sharpener, Brand Lens).
   Multi-turn conversation. PROVOCATION OVER EVALUATION.
   ────────────────────────────────────────────────────────── */

export type CoachPersona = "provocateur" | "sharpener" | "brand-lens";

export interface CoachMessage {
  persona: CoachPersona;
  text: string;
  timestamp: string;
}

export interface CoachPanelProps {
  /** Messages from all personas, chronological */
  messages: CoachMessage[];
  /** Called when user requests a coach reply */
  onRequest: (persona: CoachPersona) => void;
  /** Whether a coach is currently thinking */
  loading?: boolean;
  /** Idea text being coached (shown in header) */
  ideaText?: string;
  className?: string;
}

const PERSONAS: Record<
  CoachPersona,
  { name: string; variant: "pulp" | "sky" | "berry" | "leaf" | "ink"; tagline: string; emoji: string }
> = {
  provocateur: {
    name: "The Provocateur",
    variant: "berry",
    tagline: "Challenges assumptions",
    emoji: "⚡",
  },
  sharpener: {
    name: "The Sharpener",
    variant: "sky",
    tagline: "Refines & clarifies",
    emoji: "✦",
  },
  "brand-lens": {
    name: "The Brand Lens",
    variant: "leaf",
    tagline: "Grounds in brand equity",
    emoji: "◆",
  },
};

export function CoachPanel({
  messages,
  onRequest,
  loading = false,
  ideaText,
  className = "",
}: CoachPanelProps) {
  const prefersReduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [activePersona, setActivePersona] = useState<CoachPersona | null>(null);

  const handleRequest = (persona: CoachPersona) => {
    setActivePersona(persona);
    onRequest(persona);
  };

  return (
    <Card variant="glass" padding="none" className={className}>
      {/* Collapse header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative z-10 w-full flex items-center justify-between gap-3 p-4"
        style={{
          borderRadius: `calc(var(--radius-lg) - var(--radius-gap))`,
        }}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <Badge variant="ink" size="sm" pulse={loading}>
            {loading ? "Thinking" : "Coaches"}
          </Badge>
          <span className="font-display font-semibold text-sm text-cream/80">
            Enhance
          </span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: DURATION.fast, ease: EASE_BOUNCE }}
          className="text-pulp-gold/60"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 7l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={prefersReduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_BOUNCE }}
            className="overflow-hidden"
          >
            <div
              className="relative z-10 flex flex-col gap-3 p-4"
              style={{
                borderRadius: `calc(var(--radius-lg) - var(--radius-gap))`,
              }}
            >
              {/* Idea text */}
              {ideaText && (
                <div className="p-3 bg-ink/40 rounded-[var(--radius-sm)]">
                  <p className="font-body text-xs text-cream/40 uppercase tracking-wider mb-1">
                    Coaching
                  </p>
                  <p className="font-body text-sm text-cream/80">{ideaText}</p>
                </div>
              )}

              {/* Persona buttons */}
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PERSONAS) as CoachPersona[]).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={activePersona === p ? "primary" : "ghost"}
                    onClick={() => handleRequest(p)}
                    disabled={loading}
                  >
                    <span>{PERSONAS[p].emoji}</span>
                    <span>{PERSONAS[p].name}</span>
                  </Button>
                ))}
              </div>

              {/* Messages */}
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {messages.map((msg, i) => {
                  const persona = PERSONAS[msg.persona];
                  return (
                    <motion.div
                      key={i}
                      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.95 }}
                      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
                      transition={SPRING.gentle}
                      className="flex flex-col gap-1 p-3 bg-ink/30 rounded-[var(--radius-sm)]"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={persona.variant} size="sm">
                          {persona.emoji} {persona.name}
                        </Badge>
                      </div>
                      <p className="font-body text-sm text-cream/80 leading-relaxed">
                        {msg.text}
                      </p>
                    </motion.div>
                  );
                })}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="p-3 text-center font-body text-sm text-cream/40"
                  >
                    {activePersona ? PERSONAS[activePersona].name : "Coach"} is provoking...
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
