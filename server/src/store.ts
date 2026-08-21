// In-memory RoomStore — the authoritative server state.
// Rooms are keyed by lowercase code.  getOrCreate() on write paths so fresh
// room codes accept their first idea without a separate creation step.
//
// Status machine rules enforced here:
//   - editIdea rejected when status != Ideate
//   - addVote rejected until voteVisible == true (operator toggles blind-vote off)
//   - getResults rejected unless status == Reveal

import type {
  CoachMessage,
  CoachPersona,
  Idea,
  Room,
  TickerItem,
  WorkshopStatus,
} from "./types.js";
import { STATUS_ORDER } from "./types.js";

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

export class RoomStore {
  private rooms = new Map<string, Room>();

  /** Get a room by code, creating it lazily if it doesn't exist. */
  getOrCreate(code: string): Room {
    const key = code.toLowerCase();
    let room = this.rooms.get(key);
    if (!room) {
      room = {
        code: key,
        status: "Ideate",
        voteVisible: false,
        ideas: [],
        votes: new Map(),
        ticker: [],
        coachHistory: new Map(),
        createdAt: Date.now(),
      };
      this.rooms.set(key, room);
    }
    return room;
  }

  /** Return a room if it exists, otherwise null. */
  get(code: string): Room | null {
    return this.rooms.get(code.toLowerCase()) ?? null;
  }

  // ── Ideas ──────────────────────────────────────────────────────────

  addIdea(
    code: string,
    data: { text: string; team: string; flavour: string; author: string; authorId: string },
  ): Idea {
    const room = this.getOrCreate(code);
    const now = Date.now();
    const idea: Idea = {
      id: generateId(),
      text: data.text,
      team: data.team,
      flavour: data.flavour,
      author: data.author,
      authorId: data.authorId,
      createdAt: now,
      updatedAt: now,
    };
    room.ideas.push(idea);
    return idea;
  }

  /**
   * Edit an existing idea.  Only allowed while the room is in the Ideate
   * phase and the caller is the original author.
   * Returns the updated idea, or `null` if the edit was rejected.
   */
  editIdea(
    code: string,
    ideaId: string,
    data: { text: string; flavour: string; authorId: string },
  ): Idea | null {
    const room = this.getOrCreate(code);
    if (room.status !== "Ideate") return null;

    const idea = room.ideas.find((i) => i.id === ideaId);
    if (!idea || idea.authorId !== data.authorId) return null;

    idea.text = data.text;
    idea.flavour = data.flavour;
    idea.updatedAt = Date.now();
    return idea;
  }

  // ── Voting ────────────────────────────────────────────────────────

  /**
   * Add a vote.  Voting is blocked until the operator toggles blind-vote
   * visibility on (`voteVisible == true`).
   * Returns the updated total vote count for the idea, or -1 if rejected.
   */
  addVote(code: string, ideaId: string, visitorId: string): number {
    const room = this.getOrCreate(code);
    if (!room.voteVisible) return -1;

    // Verify the idea exists.
    const idea = room.ideas.find((i) => i.id === ideaId);
    if (!idea) return -1;

    let visitorVotes = room.votes.get(visitorId);
    if (!visitorVotes) {
      visitorVotes = new Set();
      room.votes.set(visitorId, visitorVotes);
    }

    // Deduplicate — one vote per visitor per idea.
    if (visitorVotes.has(ideaId)) return this.totalVotes(room, ideaId);

    visitorVotes.add(ideaId);
    return this.totalVotes(room, ideaId);
  }

  /**
   * Remove a vote.  Still subject to voteVisible so the operator can
   * close voting.  Returns true if a vote was removed.
   */
  removeVote(code: string, ideaId: string, visitorId: string): boolean {
    const room = this.getOrCreate(code);
    if (!room.voteVisible) return false;

    const visitorVotes = room.votes.get(visitorId);
    if (!visitorVotes || !visitorVotes.has(ideaId)) return false;

    visitorVotes.delete(ideaId);
    return true;
  }

  /** Total votes for a single idea. */
  private totalVotes(room: Room, ideaId: string): number {
    let count = 0;
    for (const set of room.votes.values()) {
      if (set.has(ideaId)) count++;
    }
    return count;
  }

  // ── Status machine ─────────────────────────────────────────────────

  /**
   * Set the room status.  Validates that the transition is forward in the
   * STATUS_ORDER sequence (or the same status — a no-op idempotent set).
   * Returns the updated room, or null if the transition is invalid.
   */
  setStatus(code: string, status: WorkshopStatus): Room | null {
    const room = this.getOrCreate(code);
    const currentIdx = STATUS_ORDER.indexOf(room.status);
    const newIdx = STATUS_ORDER.indexOf(status);
    if (newIdx < currentIdx) return null; // no backwards transitions

    room.status = status;
    return room;
  }

  /** Toggle vote visibility. Returns the new visibility state. */
  toggleVoteVisibility(code: string, visible?: boolean): boolean {
    const room = this.getOrCreate(code);
    room.voteVisible = visible ?? !room.voteVisible;
    return room.voteVisible;
  }

  // ── Results (Reveal only) ──────────────────────────────────────────

  /**
   * Ranked results — only available when status == Reveal.
   * Returns ideas sorted by vote count descending, or null if not in Reveal.
   */
  getResults(code: string): { idea: Idea; votes: number }[] | null {
    const room = this.getOrCreate(code);
    if (room.status !== "Reveal") return null;

    return room.ideas
      .map((idea) => ({ idea, votes: this.totalVotes(room, idea.id) }))
      .sort((a, b) => b.votes - a.votes);
  }

  // ── Ticker ─────────────────────────────────────────────────────────

  addTickerItem(
    code: string,
    data: { badge: string; badgeColor: string; text: string },
  ): TickerItem {
    const room = this.getOrCreate(code);
    const item: TickerItem = {
      id: generateId(),
      badge: data.badge,
      badgeColor: data.badgeColor,
      text: data.text,
      createdAt: Date.now(),
    };
    room.ticker.push(item);
    return item;
  }

  getTicker(code: string): TickerItem[] {
    return this.getOrCreate(code).ticker;
  }

  // ── Coach history ──────────────────────────────────────────────────

  getCoachHistory(code: string, ideaId: string): CoachMessage[] {
    const room = this.getOrCreate(code);
    return room.coachHistory.get(ideaId) ?? [];
  }

  addCoachMessage(
    code: string,
    data: { ideaId: string; persona: CoachPersona; role: "user" | "model"; text: string },
  ): CoachMessage {
    const room = this.getOrCreate(code);
    let history = room.coachHistory.get(data.ideaId);
    if (!history) {
      history = [];
      room.coachHistory.set(data.ideaId, history);
    }
    const msg: CoachMessage = {
      id: generateId(),
      ideaId: data.ideaId,
      persona: data.persona,
      role: data.role,
      text: data.text,
      createdAt: Date.now(),
    };
    history.push(msg);
    return msg;
  }

  // ── Reset ──────────────────────────────────────────────────────────

  /** Reset a room to its initial state (moderator-only). */
  reset(code: string): Room {
    const key = code.toLowerCase();
    const room: Room = {
      code: key,
      status: "Ideate",
      voteVisible: false,
      ideas: [],
      votes: new Map(),
      ticker: [],
      coachHistory: new Map(),
      createdAt: Date.now(),
    };
    this.rooms.set(key, room);
    return room;
  }
}
