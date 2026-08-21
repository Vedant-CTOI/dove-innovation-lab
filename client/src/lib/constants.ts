/* ═══════════════════════════════════════════════════════════
   constants.ts — Workshop constants
   Teams, flavours, and workshop metadata for the
   Minute Maid Pulpy Orange "Around the Orchard" workshop.
   ═══════════════════════════════════════════════════════════ */

/* ── Workshop metadata */
export const WORKSHOP_TITLE = "Around the Orchard";
export const BRAND_TAGLINE = "Filled With Life at 50";
export const BRAND_NAME = "Minute Maid Pulpy Orange";

/* ── Teams (participant picks one before entering the workshop) */
export const TEAMS = [
  { id: "classic", label: "Classic", flavour: "classic" },
  { id: "tropical", label: "Tropical", flavour: "tropical" },
  { id: "mixed", label: "Mixed", flavour: "mixed" },
  { id: "berry", label: "Berry", flavour: "berry" },
] as const;

export type TeamId = (typeof TEAMS)[number]["id"];

/* ── Flavours (maps to IdeaCard FLAVOUR_COLORS) */
export const FLAVOURS = ["classic", "tropical", "mixed", "berry"] as const;
export type Flavour = (typeof FLAVOURS)[number];

/* ── Status labels for display */
export const STATUS_LABELS: Record<string, string> = {
  Ideate: "Ideate",
  Presentation: "Presentation",
  Vote: "Vote",
  Reveal: "Reveal",
  Completed: "Completed",
};

export const STATUS_DESCRIPTIONS: Record<string, string> = {
  Ideate: "Submit and refine ideas — the pulp is flowing!",
  Presentation: "Review the ideas on the big screen",
  Vote: "Back your favourite ideas — blind voting",
  Reveal: "The results are in — shake with joy!",
  Completed: "Workshop complete — thank you for playing",
};

/* ── Ticker badge presets per event type */
export const TICKER_BADGES = {
  idea: { badge: "IDEA", badgeColor: "pulp" as const },
  vote: { badge: "VOTE", badgeColor: "sky" as const },
  status: { badge: "PHASE", badgeColor: "berry" as const },
  coach: { badge: "COACH", badgeColor: "leaf" as const },
  timer: { badge: "TIMER", badgeColor: "ink" as const },
  system: { badge: "SYS", badgeColor: "ink" as const },
};

/* ── Query keys (centralized for invalidation consistency) */
export const queryKeys = {
  ideas: (code: string) => ["ideas", code] as const,
  results: (code: string) => ["results", code] as const,
  ticker: (code: string) => ["ticker", code] as const,
  roomState: (code: string) => ["room-state", code] as const,
  health: () => ["health"] as const,
};

/* ── Visitor ID — generated once, persisted in localStorage */
export function getVisitorId(): string {
  const KEY = "mm-visitor-id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

/* ── Moderator token storage */
const MODERATOR_KEY_STORAGE = "mm-moderator-key";

export function getModeratorToken(): string | null {
  return localStorage.getItem(MODERATOR_KEY_STORAGE);
}

export function setModeratorToken(token: string): void {
  localStorage.setItem(MODERATOR_KEY_STORAGE, token);
}

export function clearModeratorToken(): void {
  localStorage.removeItem(MODERATOR_KEY_STORAGE);
}
