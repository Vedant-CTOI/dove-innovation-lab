// Shared types for the Minute Maid workshop platform.
// Governed by contracts/workshop-features.md.

/** Workshop status machine: Ideate → Presentation → Vote → Reveal → Completed */
export type WorkshopStatus =
  | "Ideate"
  | "Presentation"
  | "Vote"
  | "Reveal"
  | "Completed";

/** Ordered status machine — used for validation of forward transitions. */
export const STATUS_ORDER: WorkshopStatus[] = [
  "Ideate",
  "Presentation",
  "Vote",
  "Reveal",
  "Completed",
];

/** Coach personas — PROVOCATION OVER EVALUATION, never score or rank. */
export type CoachPersona = "Provocateur" | "Sharpener" | "Brand Lens";

/** A single idea submitted by a participant. */
export interface Idea {
  id: string;
  text: string;
  team: string;
  flavour: string;
  author: string;
  authorId: string;
  createdAt: number;
  updatedAt: number;
}

/** A vote keyed by visitorId → ideaId set. */
export interface Vote {
  ideaId: string;
  visitorId: string;
  createdAt: number;
}

/** Ticker / activity feed item broadcast to the big screen. */
export interface TickerItem {
  id: string;
  badge: string;
  badgeColor: string;
  text: string;
  createdAt: number;
}

/** A coach message in the per-idea conversation history. */
export interface CoachMessage {
  id: string;
  ideaId: string;
  persona: CoachPersona;
  role: "user" | "model";
  text: string;
  createdAt: number;
}

/** A room (workshop session) keyed by lowercase code. */
export interface Room {
  code: string;
  status: WorkshopStatus;
  /** Whether vote counts are visible to participants. Blind by default. */
  voteVisible: boolean;
  ideas: Idea[];
  /** votes[visitorId] = Set<ideaId> */
  votes: Map<string, Set<string>>;
  ticker: TickerItem[];
  /** coachHistory[ideaId] = CoachMessage[] (multi-turn per idea) */
  coachHistory: Map<string, CoachMessage[]>;
  createdAt: number;
}
