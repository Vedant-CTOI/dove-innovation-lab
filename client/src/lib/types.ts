/* ═══════════════════════════════════════════════════════════
   types.ts — Shared types matching contracts/workshop-features.md
   The status machine, socket payloads, and REST shapes are
   the source of truth — never deviate from these.
   ═══════════════════════════════════════════════════════════ */

/* ── Status machine: Ideate → Presentation → Vote → Reveal → Completed */
export type WorkshopStatus =
  | "Ideate"
  | "Presentation"
  | "Vote"
  | "Reveal"
  | "Completed";

export const STATUS_ORDER: WorkshopStatus[] = [
  "Ideate",
  "Presentation",
  "Vote",
  "Reveal",
  "Completed",
];

export function nextStatus(status: WorkshopStatus): WorkshopStatus | null {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx < 0 || idx >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1]!;
}

export function prevStatus(status: WorkshopStatus): WorkshopStatus | null {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx <= 0) return null;
  return STATUS_ORDER[idx - 1]!;
}

export function statusIndex(status: WorkshopStatus): number {
  return STATUS_ORDER.indexOf(status);
}

/* ── Idea (matches IdeaCard.Idea + REST shapes) */
export interface Idea {
  id: string;
  text: string;
  team: string;
  flavour: string;
  author: string;
  createdAt: string;
  votes?: number;
}

/* ── Ticker item (matches Ticker.TickerItem) */
export interface TickerEntry {
  id: string;
  badge: string;
  badgeColor?: "pulp" | "sky" | "berry" | "leaf" | "ink";
  text: string;
}

/* ── Timer state */
export interface TimerState {
  duration: number; // seconds
  endsAt: string | null; // ISO timestamp
  running: boolean;
}

/* ── Coach persona + message */
export type CoachPersona = "provocateur" | "sharpener" | "brand-lens";

export interface CoachMessage {
  persona: CoachPersona;
  text: string;
  timestamp: string;
}

/* ── Reveal results item (matches RevealCard.RevealItem) */
export interface ResultItem {
  id: string;
  text: string;
  team: string;
  author: string;
  votes: number;
  rank: number;
}

/* ── Room state (from GET /api/moderator/state) */
export interface RoomState {
  code: string;
  status: WorkshopStatus;
  ideas: Idea[];
  voteVisible: boolean;
  timer: TimerState;
  ticker: TickerEntry[];
}

/* ── Socket event payloads (server → client) */
export interface IdeaAddedPayload {
  id: string;
  text: string;
  team: string;
  flavour: string;
  author: string;
  createdAt: string;
}

export interface IdeaUpdatedPayload {
  id: string;
  text: string;
  flavour: string;
}

export interface VoteAddedPayload {
  ideaId: string;
  totalVotes: number;
}

export interface WorkshopStatusChangedPayload {
  status: WorkshopStatus;
  prevStatus: WorkshopStatus;
}

export interface TickerPayload {
  badge: string;
  badgeColor?: "pulp" | "sky" | "berry" | "leaf" | "ink";
  text: string;
}

export interface TimerStartedPayload {
  duration: number;
  endsAt: string;
}

export interface TimerStoppedPayload {
  // empty per contract
}

export interface VoteVisibilityChangedPayload {
  visible: boolean;
}

export interface CoachReplyPayload {
  ideaId: string;
  persona: CoachPersona;
  text: string;
}

/* ── Socket event payloads (client → server) */
export interface JoinRoomPayload {
  code: string;
  name: string;
  team: string;
}

export interface AddIdeaPayload {
  code: string;
  text: string;
  team: string;
  flavour: string;
  author: string;
}

export interface EditIdeaPayload {
  code: string;
  ideaId: string;
  text: string;
  flavour: string;
  authorId: string;
}

export interface AddVotePayload {
  code: string;
  ideaId: string;
  visitorId: string;
}

export interface RemoveVotePayload {
  code: string;
  ideaId: string;
  visitorId: string;
}

export interface SetStatusPayload {
  code: string;
  status: WorkshopStatus;
}

export interface SetTimerPayload {
  code: string;
  duration: number;
}

export interface ToggleVoteVisibilityPayload {
  code: string;
  visible: boolean;
}

export interface RequestCoachPayload {
  code: string;
  ideaId: string;
  persona: CoachPersona;
}

export interface PushTickerPayload {
  code: string;
  badge: string;
  badgeColor?: "pulp" | "sky" | "berry" | "leaf" | "ink";
  text: string;
}

/* ── Ack shapes */
export interface JoinRoomAck {
  ok: boolean;
  room: string;
}

export interface IdeaAck {
  ok: boolean;
  idea: Idea;
}

export interface VoteAck {
  ok: boolean;
  idea: Idea;
  totalVotes: number;
}

export interface OkAck {
  ok: boolean;
}

export interface TimerAck {
  ok: boolean;
  endsAt: string;
}

export interface CoachAck {
  ok: boolean;
  reply: { persona: CoachPersona; text: string };
}

/* ── REST response shapes */
export interface HealthResponse {
  ok: boolean;
  uptime: number;
}

export interface IdeasResponse {
  ideas: Idea[];
}

export interface ResultsResponse {
  results: ResultItem[];
}

export interface TickerResponse {
  items: TickerEntry[];
}

export interface SubmitIdeaResponse {
  ok: boolean;
  idea: Idea;
}

export interface VoteResponse {
  ok: boolean;
  ideaId: string;
  totalVotes: number;
}

export interface StatusResponse {
  ok: boolean;
  status: WorkshopStatus;
}

export interface CoachResponse {
  ok: boolean;
  reply: { persona: CoachPersona; text: string };
}

/* ── Socket connection state */
export type ConnectionState =
  | "connected"
  | "disconnected"
  | "connecting"
  | "reconnecting";
