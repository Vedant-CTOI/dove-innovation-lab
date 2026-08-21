/* ═══════════════════════════════════════════════════════════
   index.ts — Iris component primitives barrel export
   All Minute Maid Pulpy Orange workshop UI primitives,
   canvas particle system, and motion helpers.
   ═══════════════════════════════════════════════════════════ */

/* ── Core primitives ── */
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

export { Card } from "./Card";
export type { CardProps } from "./Card";

export { Badge } from "./Badge";
export type { BadgeProps } from "./Badge";

export { Input } from "./Input";
export type { InputProps } from "./Input";

/* ── Feature components ── */
export { Timer } from "./Timer";
export type { TimerProps } from "./Timer";

export { Ticker, TickerEntrance } from "./Ticker";
export type { TickerItem, TickerProps } from "./Ticker";

export { QRCard } from "./QRCard";
export type { QRCardProps } from "./QRCard";

export { IdeaCard, IdeaSubmitForm } from "./IdeaCard";
export type { Idea, IdeaCardProps, IdeaSubmitFormProps } from "./IdeaCard";

export { CoachPanel } from "./CoachPanel";
export type {
  CoachPanelProps,
  CoachPersona,
  CoachMessage,
} from "./CoachPanel";

export { VoteCard, VoteToggle } from "./VoteCard";
export type { VoteCardProps, VoteToggleProps } from "./VoteCard";

export { RevealCard } from "./RevealCard";
export type { RevealCardProps, RevealItem } from "./RevealCard";

/* ── State components ── */
export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export {
  Skeleton,
  SkeletonIdeaCard,
  SkeletonQRCard,
  SkeletonTimer,
  SkeletonGrid,
} from "./Skeleton";
export type { SkeletonProps } from "./Skeleton";

/* ── Surface components ── */
export { GlassCard, GlassCardLightOverrides } from "./GlassCard";
export type { GlassCardProps } from "./GlassCard";

export { NoiseOverlay, NoiseTexture } from "./NoiseOverlay";
export type { NoiseOverlayProps } from "./NoiseOverlay";

/* ── Pulp burst (the ownable asset) ── */
export { PulpBurst } from "./PulpBurst";
export type { PulpBurstHandle, PulpBurstProps } from "./PulpBurst";

/* ── Canvas particle system ── */
export { ParticleField } from "./canvas/ParticleField";
export type { ParticleFieldProps } from "./canvas/ParticleField";

/* ── Motion helpers ── */
export {
  EASE_BOUNCE,
  EASE_JUICE,
  EASE_SPRING_IN,
  DURATION,
  SPRING,
  useMotionTransition,
  useBounceHover,
  useStaggerContainer,
  useStaggerItem,
} from "./motion";
