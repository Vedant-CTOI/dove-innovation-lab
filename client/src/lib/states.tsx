/* ═══════════════════════════════════════════════════════════
   states.tsx — Shared loading/empty/error/offline state components.
   Every screen uses these for consistent state handling.
   Uses Iris's Skeleton, EmptyState, Button, GlassCard primitives.
   ═══════════════════════════════════════════════════════════ */

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import {
  EmptyState,
  SkeletonGrid,
  SkeletonQRCard,
  SkeletonTimer,
  GlassCard,
  Button,
  Badge,
  Card,
} from "../components";
import { DURATION, EASE_BOUNCE } from "../components/motion";

/* ═══════════════════════════════════════════════════════════
   LoadingState — branded skeleton grid
   ═══════════════════════════════════════════════════════════ */

export function LoadingState({
  variant = "grid",
  label = "Shaking up the pulp…",
  className = "",
}: {
  variant?: "grid" | "qr" | "timer" | "simple";
  label?: string;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  if (variant === "qr") {
    return (
      <div className={["flex justify-center", className].join(" ")}>
        <SkeletonQRCard />
      </div>
    );
  }

  if (variant === "timer") {
    return (
      <div className={["flex justify-center", className].join(" ")}>
        <SkeletonTimer />
      </div>
    );
  }

  if (variant === "simple") {
    return (
      <div
        className={[
          "flex flex-col items-center justify-center gap-3 p-8",
          className,
        ].join(" ")}
      >
        <motion.div
          className="w-8 h-8 rounded-[var(--radius-pill)] bg-juice-gradient"
          animate={prefersReduced ? undefined : { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <p className="font-body text-sm text-cream/50">{label}</p>
      </div>
    );
  }

  return (
    <div className={["flex flex-col gap-4", className].join(" ")}>
      <div className="flex items-center gap-2">
        <motion.div
          className="w-4 h-4 rounded-[var(--radius-pill)] bg-pulp-gradient"
          animate={prefersReduced ? undefined : { scale: [1, 1.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <span className="font-body text-sm text-cream/50">{label}</span>
      </div>
      <SkeletonGrid count={6} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EmptyStateScreen — designed illustration + CTA
   ═══════════════════════════════════════════════════════════ */

export function EmptyStateScreen({
  title,
  description,
  ctaLabel,
  onCta,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-center min-h-[50vh] p-4",
        className,
      ].join(" ")}
    >
      <EmptyState
        title={title}
        description={description}
        ctaLabel={ctaLabel}
        onCta={onCta}
        className="max-w-md"
      >
        {children}
      </EmptyState>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ErrorState — branded, actionable error display
   ═══════════════════════════════════════════════════════════ */

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className = "",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className={[
        "flex items-center justify-center min-h-[40vh] p-4",
        className,
      ].join(" ")}
    >
      <GlassCard padding="lg" className="max-w-md text-center">
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: DURATION.base, ease: EASE_BOUNCE }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <div className="text-4xl" aria-hidden>🍊</div>
          <Badge variant="berry" size="md">Error</Badge>
          <h3 className="font-display text-xl font-bold text-cream/90">
            {title}
          </h3>
          {message && (
            <p className="font-body text-sm text-cream/50 max-w-sm">
              {message}
            </p>
          )}
          {onRetry && (
            <Button variant="primary" size="md" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </motion.div>
      </GlassCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OfflineBanner — sticky reconnecting indicator
   Shows when socket is disconnected/reconnecting.
   ═══════════════════════════════════════════════════════════ */

export function OfflineBanner({
  show,
  message = "Reconnecting…",
}: {
  show: boolean;
  message?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { y: -40, opacity: 0 }}
          animate={prefersReduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { y: -40, opacity: 0 }}
          transition={{ duration: DURATION.base, ease: EASE_BOUNCE }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3"
          role="status"
          aria-live="polite"
        >
          <div
            className={[
              "flex items-center gap-2 px-4 py-2",
              "bg-ink/90 backdrop-blur-md",
              "rounded-[var(--radius-pill)]",
              "border border-pulp-gold/20",
              "shadow-[0_4px_12px_rgba(0,0,0,0.30)]",
            ].join(" ")}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-pulp-gold"
              animate={prefersReduced ? undefined : { opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <span className="font-accent text-sm font-semibold text-cream/80">
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════
   StaleIndicator — shows when query data is stale
   ═══════════════════════════════════════════════════════════ */

export function StaleIndicator({ show }: { show: boolean }) {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={prefersReduced ? { opacity: 0 } : { scale: 0 }}
          animate={prefersReduced ? { opacity: 1 } : { scale: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { scale: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE_BOUNCE }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-pill)] bg-ink/40 text-cream/40 text-xs font-body"
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-pulp-gold/60"
            animate={prefersReduced ? undefined : { opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          Updating
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════
   StatusBadge — workshop status indicator badge
   ═══════════════════════════════════════════════════════════ */

const STATUS_BADGE_VARIANTS: Record<
  string,
  { variant: "pulp" | "sky" | "berry" | "leaf" | "ink"; label: string }
> = {
  Ideate: { variant: "pulp", label: "Ideate" },
  Presentation: { variant: "sky", label: "Presentation" },
  Vote: { variant: "berry", label: "Vote" },
  Reveal: { variant: "leaf", label: "Reveal" },
  Completed: { variant: "ink", label: "Completed" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE_VARIANTS[status] || STATUS_BADGE_VARIANTS.Ideate;
  return (
    <Badge variant={config.variant} size="md" pulse>
      {config.label}
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════
   StatusFlow — numbered phase indicator for operator console
   ═══════════════════════════════════════════════════════════ */

const PHASES = [
  { key: "Ideate", label: "1. Ideate", desc: "Generate ideas" },
  { key: "Presentation", label: "2. Presentation", desc: "Review on big screen" },
  { key: "Vote", label: "3. Vote", desc: "Blind voting" },
  { key: "Reveal", label: "4. Reveal", desc: "Show results" },
  { key: "Completed", label: "5. Completed", desc: "Workshop done" },
];

export function StatusFlow({
  currentStatus,
  onAdvance,
  className = "",
}: {
  currentStatus: string;
  onAdvance?: () => void;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const currentIdx = PHASES.findIndex((p) => p.key === currentStatus);

  return (
    <Card variant="glass" padding="md" className={className}>
      <div
        className="relative z-10 flex flex-col gap-3"
        style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="ink" size="sm">Phase Flow</Badge>
        </div>
        <div className="flex flex-col gap-2">
          {PHASES.map((phase, i) => {
            const isPast = i < currentIdx;
            const isCurrent = i === currentIdx;
            const isFuture = i > currentIdx;

            return (
              <motion.div
                key={phase.key}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -10 }}
                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: DURATION.fast, ease: EASE_BOUNCE }}
                className={[
                  "flex items-center gap-3 p-2 rounded-[var(--radius-sm)]",
                  isCurrent
                    ? "bg-pulp-gradient/20 border border-pulp-gold/30"
                    : isPast
                      ? "opacity-50"
                      : "opacity-30",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex items-center justify-center w-6 h-6 rounded-full shrink-0",
                    "font-accent text-xs font-bold no-select",
                    isCurrent
                      ? "bg-pulp-gradient text-ink"
                      : isPast
                        ? "bg-leaf-green/30 text-cream/60"
                        : "bg-ink/40 text-cream/40",
                  ].join(" ")}
                >
                  {isPast ? "✓" : i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-display text-sm font-semibold text-cream/80">
                    {phase.label}
                  </p>
                  <p className="font-body text-xs text-cream/40">
                    {phase.desc}
                  </p>
                </div>
                {isCurrent && onAdvance && i < PHASES.length - 1 && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={onAdvance}
                    aria-label={`Advance to ${PHASES[i + 1]?.label}`}
                  >
                    Next →
                  </Button>
                )}
                {isFuture && (
                  <span className="font-body text-xs text-cream/20 italic">
                    Locked
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   PageTransition — wrapper for page-level entrance animation
   ═══════════════════════════════════════════════════════════ */

export function PageTransition({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_BOUNCE }}
    >
      {children}
    </motion.div>
  );
}
