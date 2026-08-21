// server/src/rest.ts — Express REST API routes for the Minute Maid workshop.
//
// Every endpoint is validated with zod at the boundary (reject early, never
// echo raw input). Moderator operator endpoints require the bearer token
// from MODERATOR_KEY. The results endpoint returns 403 until the room has
// reached the Reveal phase. See contracts/workshop-features.md for the table.

import type { Express, Request, Response } from "express";
import { z } from "zod";
import type { RoomStore } from "./store.js";
import type { Room, Idea, WorkshopStatus, CoachMessage } from "./types.js";
import { verifyModerator } from "./auth.js";
import { requestCoach } from "./coach.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_VALUES = [
  "Ideate",
  "Presentation",
  "Vote",
  "Reveal",
  "Completed",
] as const;

function normCode(code: unknown): string {
  return String(code ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 32);
}

/** Read the bearer token from the Authorization header (or ?token= fallback). */
function bearerToken(req: Request): string {
  const header = req.get("authorization") ?? req.get("Authorization") ?? "";
  const fromHeader = header.replace(/^Bearer\s+/i, "").trim();
  if (fromHeader) return fromHeader;
  const q = (req.query as Record<string, string | undefined>)?.token;
  return q ? String(q) : "";
}

/** Reject with 401 unless the request carries a valid moderator token. */
function requireModerator(
  store: RoomStore,
  req: Request,
  res: Response,
): boolean {
  const token = bearerToken(req);
  if (!token || !verifyModerator(token)) {
    res.status(401).json({ ok: false, error: "moderator_required" });
    return false;
  }
  return true;
}

/** Standard zod-error response — never echoes the raw input. */
function validationError(res: Response, _e: z.ZodError): Response {
  return res.status(400).json({ ok: false, error: "invalid_payload" });
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const CreateIdeaSchema = z.object({
  code: z.string().min(1).max(32),
  text: z.string().min(1).max(4000),
  team: z.string().max(64),
  flavour: z.string().max(64),
  author: z.string().min(1).max(120),
  authorId: z.string().max(120).optional(),
});

const EditIdeaSchema = z.object({
  code: z.string().min(1).max(32),
  text: z.string().min(1).max(4000),
  flavour: z.string().max(64),
  authorId: z.string().min(1).max(120),
});

const VoteSchema = z.object({
  code: z.string().min(1).max(32),
  ideaId: z.string().min(1).max(120),
  visitorId: z.string().min(1).max(120),
  action: z.enum(["add", "remove"]).optional(),
});

const SetStatusSchema = z.object({
  code: z.string().min(1).max(32),
  status: z.enum(STATUS_VALUES),
});

const CoachSchema = z.object({
  code: z.string().min(1).max(32),
  ideaId: z.string().min(1).max(120),
  persona: z.string().min(1).max(64),
});

const ResetSchema = z.object({
  code: z.string().min(1).max(32),
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

/**
 * Register every REST route from the contract onto the given Express app.
 *
 * @param app   the Express application
 * @param store the in-memory RoomStore
 */
export function setupRest(app: Express, store: RoomStore): void {
  // ---- GET /api/health ------------------------------------------------
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, uptime: process.uptime() });
  });

  // ---- GET /api/ideas?code=XXX ---------------------------------------
  app.get("/api/ideas", (req: Request, res: Response) => {
    const code = normCode(req.query.code);
    if (!code) return res.status(400).json({ ok: false, error: "code_required" });
    let room: Room;
    try {
      room = store.getOrCreate(code);
    } catch {
      return res.status(500).json({ ok: false, error: "room_unavailable" });
    }
    res.status(200).json({ ok: true, ideas: room.ideas });
  });

  // ---- POST /api/idea ------------------------------------------------
  app.post("/api/idea", (req: Request, res: Response) => {
    const parsed = CreateIdeaSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const { code, text, team, flavour, author, authorId } = parsed.data;
    let idea: Idea;
    try {
      store.getOrCreate(code);
      idea = store.addIdea(code, {
        text: text.trim(),
        team,
        flavour,
        author,
        // Store requires authorId; generate a fallback if the client omitted it.
        authorId: authorId ?? `rest-${Date.now().toString(36)}`,
      });
    } catch {
      return res.status(500).json({ ok: false, error: "add_failed" });
    }
    res.status(201).json({ ok: true, idea });
  });

  // ---- PUT /api/idea/:id (author-only, Ideate phase only) ------------
  app.put("/api/idea/:id", (req: Request, res: Response) => {
    const parsed = EditIdeaSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const ideaId = String(req.params.id ?? "");
    if (!ideaId) return res.status(400).json({ ok: false, error: "id_required" });
    const { code, text, flavour, authorId } = parsed.data;

    let room: Room;
    try {
      room = store.getOrCreate(code);
    } catch {
      return res.status(500).json({ ok: false, error: "room_unavailable" });
    }

    // Ideate phase only.
    if (room.status !== "Ideate")
      return res.status(403).json({ ok: false, error: "not_ideate_phase" });

    // Author-only: the existing idea's authorId must match.
    const existing = room.ideas.find((i) => i.id === ideaId);
    if (!existing)
      return res.status(404).json({ ok: false, error: "idea_not_found" });
    if (existing.authorId !== authorId)
      return res.status(403).json({ ok: false, error: "author_only" });

    const idea = store.editIdea(code, ideaId, {
      text: text.trim(),
      flavour,
      authorId,
    });
    if (!idea)
      return res.status(500).json({ ok: false, error: "edit_failed" });
    res.status(200).json({ ok: true, idea });
  });

  // ---- POST /api/vote (block if !voteVisible) ------------------------
  app.post("/api/vote", (req: Request, res: Response) => {
    const parsed = VoteSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const { code, ideaId, visitorId, action } = parsed.data;
    let room: Room;
    try {
      room = store.getOrCreate(code);
    } catch {
      return res.status(500).json({ ok: false, error: "room_unavailable" });
    }

    if (action === "remove") {
      let removed: boolean;
      try {
        removed = store.removeVote(code, ideaId, visitorId);
      } catch {
        return res.status(500).json({ ok: false, error: "remove_failed" });
      }
      return res.status(200).json({ ok: true, removed });
    }

    // add (default)
    if (!room.voteVisible)
      return res.status(403).json({ ok: false, error: "vote_not_visible" });

    let totalVotes: number;
    try {
      totalVotes = store.addVote(code, ideaId, visitorId);
    } catch {
      return res.status(500).json({ ok: false, error: "vote_failed" });
    }
    if (totalVotes < 0)
      return res.status(403).json({ ok: false, error: "vote_rejected" });
    res.status(200).json({
      ok: true,
      totalVotes,
    });
  });

  // ---- GET /api/results?code=XXX (Reveal phase only) ------------------
  app.get("/api/results", (req: Request, res: Response) => {
    const code = normCode(req.query.code);
    if (!code) return res.status(400).json({ ok: false, error: "code_required" });
    let room: Room;
    try {
      room = store.getOrCreate(code);
    } catch {
      return res.status(500).json({ ok: false, error: "room_unavailable" });
    }
    if (room.status !== "Reveal")
      return res.status(403).json({ ok: false, error: "not_reveal_phase" });

    let results: { idea: Idea; votes: number }[] | null;
    try {
      results = store.getResults(code);
    } catch {
      return res.status(500).json({ ok: false, error: "results_failed" });
    }
    if (!results)
      return res.status(403).json({ ok: false, error: "not_reveal_phase" });
    res.status(200).json({ ok: true, results });
  });

  // ---- POST /api/status (moderator token required) -------------------
  app.post("/api/status", (req: Request, res: Response) => {
    if (!requireModerator(store, req, res)) return;
    const parsed = SetStatusSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const { code, status } = parsed.data;
    let room: Room | null;
    try {
      store.getOrCreate(code);
      room = store.setStatus(code, status as WorkshopStatus);
    } catch {
      return res.status(500).json({ ok: false, error: "status_failed" });
    }
    if (!room)
      return res.status(400).json({ ok: false, error: "invalid_transition" });
    res.status(200).json({ ok: true, room });
  });

  // ---- POST /api/moderator/reset (moderator token) ------------------
  app.post("/api/moderator/reset", (req: Request, res: Response) => {
    if (!requireModerator(store, req, res)) return;
    const parsed = ResetSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      // Allow code from query string as fallback.
      const code = normCode(req.query.code);
      if (!code) return res.status(400).json({ ok: false, error: "code_required" });
      try {
        store.reset(code);
      } catch {
        return res.status(500).json({ ok: false, error: "reset_failed" });
      }
      return res.status(200).json({ ok: true });
    }

    const code = parsed.data.code;
    let room: Room;
    try {
      room = store.reset(code);
    } catch {
      return res.status(500).json({ ok: false, error: "reset_failed" });
    }
    res.status(200).json({ ok: true, room });
  });

  // ---- GET /api/moderator/state (moderator token) -------------------
  app.get("/api/moderator/state", (req: Request, res: Response) => {
    if (!requireModerator(store, req, res)) return;
    const code = normCode(req.query.code);
    if (!code) return res.status(400).json({ ok: false, error: "code_required" });
    let room: Room;
    try {
      room = store.getOrCreate(code);
    } catch {
      return res.status(500).json({ ok: false, error: "room_unavailable" });
    }
    res.status(200).json({ ok: true, room });
  });

  // ---- POST /api/coach (zod validate) -------------------------------
  app.post("/api/coach", (req: Request, res: Response) => {
    const parsed = CoachSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error);

    const { code, ideaId, persona } = parsed.data;
    let room: Room;
    try {
      room = store.getOrCreate(code);
    } catch {
      return res.status(500).json({ ok: false, error: "room_unavailable" });
    }
    const idea = room.ideas.find((i) => i.id === ideaId);
    if (!idea) return res.status(404).json({ ok: false, error: "idea_not_found" });

    const history: CoachMessage[] = store.getCoachHistory(code, ideaId);

    requestCoach(
      persona as "Provocateur" | "Sharpener" | "BrandLens",
      idea.text,
      history,
    )
      .then((text: string) => {
        store.addCoachMessage(code, {
          ideaId,
          persona: persona as "Provocateur" | "Sharpener" | "Brand Lens",
          role: "model",
          text,
        });
        res.status(200).json({ ok: true, reply: text });
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : "coach_error";
        res.status(502).json({ ok: false, error: message });
      });
  });

  // ---- GET /api/ticker?code=XXX --------------------------------------
  app.get("/api/ticker", (req: Request, res: Response) => {
    const code = normCode(req.query.code);
    if (!code) return res.status(400).json({ ok: false, error: "code_required" });
    let room: Room;
    try {
      room = store.getOrCreate(code);
    } catch {
      return res.status(500).json({ ok: false, error: "room_unavailable" });
    }
    res.status(200).json({ ok: true, ticker: room.ticker ?? [] });
  });
}

export default setupRest;
