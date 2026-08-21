// server/src/socket.ts — Socket.IO server wiring for the Minute Maid workshop.
//
// Implements every client→server event (with ack callbacks) and every
// room-scoped server→client broadcast described in
// contracts/workshop-features.md. Moderator-only events require the bearer
// token carried in the handshake. All broadcasts go to `room:{code}` only —
// default deny, nothing to all clients.

import type { Server, Socket } from "socket.io";
import type { RoomStore } from "./store.js";
import type { Room, Idea, WorkshopStatus, CoachMessage } from "./types.js";
import { verifyModerator } from "./auth.js";
import { requestCoach } from "./coach.js";

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

/** Max characters accepted in any single string field of a socket payload. */
const MAX_PAYLOAD_CHARS = 4000;
/** Max events per socket per second before we start dropping. */
const RATE_LIMIT_PER_SEC = 10;
/** Max concurrent in-flight (unacked) events per socket. */
const MAX_INFLIGHT = 5;

// ---------------------------------------------------------------------------
// Types — mirror contracts/workshop-features.md payloads
// ---------------------------------------------------------------------------

export interface JoinRoomPayload {
  code: string;
  name?: string;
  team?: string;
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
export interface StartTimerPayload {
  code: string;
}
export interface StopTimerPayload {
  code: string;
}
export interface ToggleVoteVisibilityPayload {
  code: string;
  visible: boolean;
}
export interface RequestCoachPayload {
  code: string;
  ideaId: string;
  persona: string;
}
export interface PushTickerPayload {
  code: string;
  badge: string;
  badgeColor: string;
  text: string;
}

type Ack = (response: Record<string, unknown>) => void;

// ---------------------------------------------------------------------------
// Per-socket rate limiter (token bucket, 1 event / 100ms burst up to cap)
// ---------------------------------------------------------------------------

interface RateState {
  tokens: number;
  lastRefill: number;
  inflight: number;
}

function makeLimiter(): RateState {
  return { tokens: RATE_LIMIT_PER_SEC, lastRefill: Date.now(), inflight: 0 };
}

function allowEvent(state: RateState): boolean {
  const now = Date.now();
  const elapsed = (now - state.lastRefill) / 1000;
  state.tokens = Math.min(
    RATE_LIMIT_PER_SEC,
    state.tokens + elapsed * RATE_LIMIT_PER_SEC,
  );
  state.lastRefill = now;
  if (state.tokens < 1) return false;
  state.tokens -= 1;
  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise a room code to the lowercase key the store uses. */
function normCode(code: unknown): string {
  return String(code ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 32);
}

/** Reject payloads whose string fields exceed the size cap. */
function payloadTooBig(payload: Record<string, unknown>): boolean {
  for (const key of Object.keys(payload)) {
    const v = payload[key];
    if (typeof v === "string" && v.length > MAX_PAYLOAD_CHARS) return true;
  }
  return false;
}

function roomChannel(code: string): string {
  return `room:${code}`;
}

/** Generate a visitor/author ID when the client doesn't supply one. */
function generateVisitorId(socket: Socket): string {
  return `sock-${socket.id}`;
}

// Defensive access to timer methods that may not exist on the store yet.
interface TimerStore {
  setTimer?: (code: string, duration: number) => unknown;
  startTimer?: (code: string) => unknown;
  stopTimer?: (code: string) => unknown;
}
function timerStore(store: RoomStore): TimerStore {
  return store as unknown as TimerStore;
}

// ---------------------------------------------------------------------------
// Broadcasts (room-scoped only)
// ---------------------------------------------------------------------------

function broadcastIdeaAdded(io: Server, code: string, idea: Idea): void {
  io.to(roomChannel(code)).emit("idea_added", {
    id: idea.id,
    text: idea.text,
    team: idea.team,
    flavour: idea.flavour,
    author: idea.author,
    createdAt: idea.createdAt,
  });
}

function broadcastIdeaUpdated(io: Server, code: string, idea: Idea): void {
  io.to(roomChannel(code)).emit("idea_updated", {
    id: idea.id,
    text: idea.text,
    flavour: idea.flavour,
  });
}

function broadcastVoteAdded(io: Server, code: string, ideaId: string, totalVotes: number): void {
  io.to(roomChannel(code)).emit("vote_added", {
    ideaId,
    totalVotes,
  });
}

function broadcastStatusChanged(
  io: Server,
  code: string,
  status: WorkshopStatus,
  prevStatus: WorkshopStatus,
): void {
  io.to(roomChannel(code)).emit("workshop_status_changed", {
    status,
    prevStatus,
  });
}

function broadcastTicker(
  io: Server,
  code: string,
  item: { badge: string; badgeColor: string; text: string },
): void {
  io.to(roomChannel(code)).emit("ticker", {
    badge: item.badge,
    badgeColor: item.badgeColor,
    text: item.text,
  });
}

function broadcastTimerStarted(
  io: Server,
  code: string,
  duration: number,
  endsAt: number,
): void {
  io.to(roomChannel(code)).emit("timer_started", { duration, endsAt });
}

function broadcastTimerStopped(io: Server, code: string): void {
  io.to(roomChannel(code)).emit("timer_stopped", {});
}

function broadcastVoteVisibility(
  io: Server,
  code: string,
  visible: boolean,
): void {
  io.to(roomChannel(code)).emit("vote_visibility_changed", { visible });
}

function broadcastCoachReply(
  io: Server,
  code: string,
  ideaId: string,
  persona: string,
  text: string,
): void {
  io.to(roomChannel(code)).emit("coach_reply", { ideaId, persona, text });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

/**
 * Wire every socket event onto the given Socket.IO server.
 *
 * @param io    the Socket.IO server (sharing the same http.Server as Express)
 * @param store the in-memory RoomStore
 */
export function setupSocket(io: Server, store: RoomStore): void {
  // Authentication is optional-but-respected in the handshake. A socket may
  // carry a moderator bearer token via `auth.token` or `Authorization` header;
  // we stash the resolved role on the socket for moderator-only events.
  io.use((socket: Socket, next) => {
    const auth = (socket.handshake.auth ?? {}) as { token?: string };
    const header = socket.handshake.headers["authorization"] ?? "";
    const token = auth.token ?? header.toString().replace(/^Bearer\s+/i, "");
    (socket.data as Record<string, unknown>).isModerator = Boolean(
      token && verifyModerator(token),
    );
    next();
  });

  io.on("connection", (socket: Socket) => {
    const limiter = makeLimiter();

    // Track which room this socket joined so we can leave on disconnect.
    let joinedCode: string | null = null;

    // ---- join_room -------------------------------------------------------
    socket.on(
      "join_room",
      (raw: JoinRoomPayload, ack?: Ack) => {
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });
        if (payloadTooBig(raw as unknown as Record<string, unknown>))
          return ack?.({ ok: false, error: "payload_too_large" });

        let room: Room;
        try {
          room = store.getOrCreate(code);
        } catch {
          return ack?.({ ok: false, error: "room_unavailable" });
        }

        socket.join(roomChannel(code));
        joinedCode = code;
        ack?.({ ok: true, room });
      },
    );

    // ---- add_idea --------------------------------------------------------
    socket.on(
      "add_idea",
      (raw: AddIdeaPayload, ack?: Ack) => {
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });
        if (payloadTooBig(raw as unknown as Record<string, unknown>))
          return ack?.({ ok: false, error: "payload_too_large" });
        const text = String(raw?.text ?? "").trim();
        if (!text) return ack?.({ ok: false, error: "text_required" });

        let idea: Idea;
        try {
          // Store requires authorId; generate one from the socket if the
          // client didn't supply one (the contract payload omits it).
          idea = store.addIdea(code, {
            text,
            team: String(raw?.team ?? ""),
            flavour: String(raw?.flavour ?? ""),
            author: String(raw?.author ?? ""),
            authorId: generateVisitorId(socket),
          });
        } catch {
          return ack?.({ ok: false, error: "add_failed" });
        }
        broadcastIdeaAdded(io, code, idea);
        ack?.({ ok: true, idea });
      },
    );

    // ---- edit_idea (blocked unless status === Ideate) -------------------
    socket.on(
      "edit_idea",
      (raw: EditIdeaPayload, ack?: Ack) => {
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });
        if (payloadTooBig(raw as unknown as Record<string, unknown>))
          return ack?.({ ok: false, error: "payload_too_large" });

        let room: Room;
        try {
          room = store.getOrCreate(code);
        } catch {
          return ack?.({ ok: false, error: "room_unavailable" });
        }
        // Status machine: edit blocked when status != Ideate.
        if (room.status !== "Ideate")
          return ack?.({ ok: false, error: "403", status: room.status });

        const ideaId = String(raw?.ideaId ?? "");
        if (!ideaId) return ack?.({ ok: false, error: "ideaId_required" });
        const authorId = String(raw?.authorId ?? "");
        if (!authorId) return ack?.({ ok: false, error: "authorId_required" });

        const idea = store.editIdea(code, ideaId, {
          text: String(raw?.text ?? "").trim(),
          flavour: String(raw?.flavour ?? ""),
          authorId,
        });
        if (!idea) return ack?.({ ok: false, error: "403", reason: "author_only" });
        broadcastIdeaUpdated(io, code, idea);
        ack?.({ ok: true, idea });
      },
    );

    // ---- add_vote (blocked unless voteVisible) -------------------------
    socket.on(
      "add_vote",
      (raw: AddVotePayload, ack?: Ack) => {
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });

        let room: Room;
        try {
          room = store.getOrCreate(code);
        } catch {
          return ack?.({ ok: false, error: "room_unavailable" });
        }
        if (!room.voteVisible)
          return ack?.({ ok: false, error: "403", reason: "vote_not_visible" });

        const ideaId = String(raw?.ideaId ?? "");
        const visitorId = String(raw?.visitorId ?? "");
        if (!ideaId || !visitorId)
          return ack?.({ ok: false, error: "ideaId_and_visitorId_required" });

        let totalVotes: number;
        try {
          totalVotes = store.addVote(code, ideaId, visitorId);
        } catch {
          return ack?.({ ok: false, error: "vote_failed" });
        }
        if (totalVotes < 0)
          return ack?.({ ok: false, error: "vote_rejected" });
        broadcastVoteAdded(io, code, ideaId, totalVotes);
        ack?.({ ok: true, totalVotes });
      },
    );

    // ---- remove_vote ----------------------------------------------------
    socket.on(
      "remove_vote",
      (raw: RemoveVotePayload, ack?: Ack) => {
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });
        const ideaId = String(raw?.ideaId ?? "");
        const visitorId = String(raw?.visitorId ?? "");
        if (!ideaId || !visitorId)
          return ack?.({ ok: false, error: "ideaId_and_visitorId_required" });

        let removed: boolean;
        try {
          removed = store.removeVote(code, ideaId, visitorId);
        } catch {
          return ack?.({ ok: false, error: "remove_failed" });
        }
        ack?.({ ok: true, removed });
      },
    );

    // ---- set_status (moderator only) ------------------------------------
    socket.on(
      "set_status",
      (raw: SetStatusPayload, ack?: Ack) => {
        if (!socket.data?.isModerator)
          return ack?.({ ok: false, error: "403", reason: "moderator_only" });
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });

        const next = raw?.status as WorkshopStatus | undefined;
        const allowed: WorkshopStatus[] = [
          "Ideate",
          "Presentation",
          "Vote",
          "Reveal",
          "Completed",
        ];
        if (!next || !allowed.includes(next))
          return ack?.({ ok: false, error: "invalid_status" });

        let room: Room;
        let prev: WorkshopStatus;
        try {
          prev = store.getOrCreate(code).status;
        } catch {
          return ack?.({ ok: false, error: "room_unavailable" });
        }
        try {
          const result = store.setStatus(code, next);
          if (!result) return ack?.({ ok: false, error: "invalid_transition" });
          room = result;
        } catch {
          return ack?.({ ok: false, error: "status_failed" });
        }
        broadcastStatusChanged(io, code, room.status, prev);
        ack?.({ ok: true, room });
      },
    );

    // ---- set_timer (moderator only) ------------------------------------
    socket.on(
      "set_timer",
      (raw: SetTimerPayload, ack?: Ack) => {
        if (!socket.data?.isModerator)
          return ack?.({ ok: false, error: "403", reason: "moderator_only" });
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });
        const duration = Number(raw?.duration);
        if (!Number.isFinite(duration) || duration <= 0)
          return ack?.({ ok: false, error: "invalid_duration" });

        try {
          timerStore(store).setTimer?.(code, duration);
        } catch {
          return ack?.({ ok: false, error: "timer_failed" });
        }
        ack?.({ ok: true });
      },
    );

    // ---- start_timer (moderator only) ----------------------------------
    socket.on(
      "start_timer",
      (raw: StartTimerPayload, ack?: Ack) => {
        if (!socket.data?.isModerator)
          return ack?.({ ok: false, error: "403", reason: "moderator_only" });
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });

        // Compute endsAt from the room's current timer duration, or fall back
        // to a sensible default if the store doesn't expose timer state.
        const duration = 60_000; // default 60s; store may override
        const endsAt = Date.now() + duration;
        try {
          const res = timerStore(store).startTimer?.(code);
          // If startTimer returns an endsAt or { endsAt, duration }, use it.
          if (res && typeof res === "object") {
            const obj = res as { endsAt?: number; duration?: number };
            broadcastTimerStarted(
              io,
              code,
              obj.duration ?? duration,
              obj.endsAt ?? endsAt,
            );
            return ack?.({ ok: true, endsAt: obj.endsAt ?? endsAt });
          }
        } catch {
          return ack?.({ ok: false, error: "timer_failed" });
        }
        broadcastTimerStarted(io, code, duration, endsAt);
        ack?.({ ok: true, endsAt });
      },
    );

    // ---- stop_timer (moderator only) -----------------------------------
    socket.on(
      "stop_timer",
      (raw: StopTimerPayload, ack?: Ack) => {
        if (!socket.data?.isModerator)
          return ack?.({ ok: false, error: "403", reason: "moderator_only" });
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });

        try {
          timerStore(store).stopTimer?.(code);
        } catch {
          return ack?.({ ok: false, error: "timer_failed" });
        }
        broadcastTimerStopped(io, code);
        ack?.({ ok: true });
      },
    );

    // ---- toggle_vote_visibility (moderator only) ----------------------
    socket.on(
      "toggle_vote_visibility",
      (raw: ToggleVoteVisibilityPayload, ack?: Ack) => {
        if (!socket.data?.isModerator)
          return ack?.({ ok: false, error: "403", reason: "moderator_only" });
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });
        const visible = Boolean(raw?.visible);

        let result: boolean;
        try {
          result = store.toggleVoteVisibility(code, visible);
        } catch {
          return ack?.({ ok: false, error: "visibility_failed" });
        }
        broadcastVoteVisibility(io, code, result);
        ack?.({ ok: true, visible: result });
      },
    );

    // ---- request_coach --------------------------------------------------
    socket.on(
      "request_coach",
      (raw: RequestCoachPayload, ack?: Ack) => {
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });
        if (payloadTooBig(raw as unknown as Record<string, unknown>))
          return ack?.({ ok: false, error: "payload_too_large" });
        const ideaId = String(raw?.ideaId ?? "");
        const persona = String(raw?.persona ?? "").trim();
        if (!ideaId || !persona)
          return ack?.({ ok: false, error: "ideaId_and_persona_required" });

        let room: Room;
        try {
          room = store.getOrCreate(code);
        } catch {
          return ack?.({ ok: false, error: "room_unavailable" });
        }
        const idea = room.ideas.find((i) => i.id === ideaId);
        if (!idea) return ack?.({ ok: false, error: "idea_not_found" });

        // In-flight cap to prevent coach floods.
        limiter.inflight += 1;
        if (limiter.inflight > MAX_INFLIGHT) {
          limiter.inflight -= 1;
          return ack?.({ ok: false, error: "too_many_inflight" });
        }

        const history: CoachMessage[] = store.getCoachHistory(code, ideaId);
        // Cast persona to the coach module's union type — validated at runtime.
        requestCoach(persona as "Provocateur" | "Sharpener" | "BrandLens", idea.text, history)
          .then((text: string) => {
            store.addCoachMessage(code, {
              ideaId,
              persona: persona as "Provocateur" | "Sharpener" | "Brand Lens",
              role: "model",
              text,
            });
            broadcastCoachReply(io, code, ideaId, persona, text);
            ack?.({ ok: true, reply: text });
          })
          .catch((e: unknown) => {
            const message = e instanceof Error ? e.message : "coach_error";
            ack?.({ ok: false, error: message });
          })
          .finally(() => {
            limiter.inflight -= 1;
          });
      },
    );

    // ---- push_ticker (moderator only) ----------------------------------
    socket.on(
      "push_ticker",
      (raw: PushTickerPayload, ack?: Ack) => {
        if (!socket.data?.isModerator)
          return ack?.({ ok: false, error: "403", reason: "moderator_only" });
        if (!allowEvent(limiter)) return ack?.({ ok: false, error: "rate_limited" });
        const code = normCode(raw?.code);
        if (!code) return ack?.({ ok: false, error: "code_required" });
        if (payloadTooBig(raw as unknown as Record<string, unknown>))
          return ack?.({ ok: false, error: "payload_too_large" });
        const text = String(raw?.text ?? "").trim();
        if (!text) return ack?.({ ok: false, error: "text_required" });

        const badge = String(raw?.badge ?? "").trim();
        const badgeColor = String(raw?.badgeColor ?? "").trim();
        try {
          store.addTickerItem(code, { badge, badgeColor, text });
        } catch {
          return ack?.({ ok: false, error: "ticker_failed" });
        }
        broadcastTicker(io, code, { badge, badgeColor, text });
        ack?.({ ok: true });
      },
    );

    // ---- disconnect -----------------------------------------------------
    socket.on("disconnect", () => {
      if (joinedCode) socket.leave(roomChannel(joinedCode));
    });
  });
}

export default setupSocket;
