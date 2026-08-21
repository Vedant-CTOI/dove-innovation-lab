/* ═══════════════════════════════════════════════════════════
   api.ts — REST client wrapper
   fetch wrapper for all REST endpoints from
   contracts/workshop-features.md. Typed responses.
   ═══════════════════════════════════════════════════════════ */

import { ApiError } from "./query";
import { getModeratorToken } from "./constants";
import type {
  HealthResponse,
  IdeasResponse,
  ResultsResponse,
  TickerResponse,
  SubmitIdeaResponse,
  VoteResponse,
  StatusResponse,
  CoachResponse,
  RoomState,
  WorkshopStatus,
  CoachPersona,
} from "./types";

/* ── Base URL ──
   In dev, Vite proxies /api to localhost:3001.
   In production, same-origin. */
const BASE_URL = "";

/* ── Fetch helper with error handling ── */
async function request<T>(
  method: string,
  path: string,
  opts?: {
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  },
): Promise<T> {
  const { body, headers = {}, signal } = opts || {};

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Attach moderator token if available
  const modToken = getModeratorToken();
  if (modToken) {
    finalHeaders["Authorization"] = `Bearer ${modToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  // Try to parse JSON, fall back to text
  let data: unknown = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as Record<string, unknown>).message)
        : `Request failed: ${res.status} ${res.statusText}`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

/* ── REST endpoints (from contracts/workshop-features.md) ── */

/* GET /api/health → { ok: true, uptime } */
export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>("GET", "/api/health", { signal });
}

/* GET /api/ideas?code=XXX → { ideas: Idea[] } */
export function getIdeas(code: string, signal?: AbortSignal): Promise<IdeasResponse> {
  return request<IdeasResponse>("GET", `/api/ideas?code=${encodeURIComponent(code)}`, { signal });
}

/* POST /api/idea → { ok, idea } (body: code, text, team, flavour, author) */
export function submitIdea(payload: {
  code: string;
  text: string;
  team: string;
  flavour: string;
  author: string;
}): Promise<SubmitIdeaResponse> {
  return request<SubmitIdeaResponse>("POST", "/api/idea", { body: payload });
}

/* PUT /api/idea/:id → { ok, idea } (author-only, Ideate phase only) */
export function editIdea(
  id: string,
  payload: { code: string; text: string; flavour: string; authorId: string },
): Promise<SubmitIdeaResponse> {
  return request<SubmitIdeaResponse>("PUT", `/api/idea/${encodeURIComponent(id)}`, {
    body: payload,
  });
}

/* POST /api/vote → { ok, ideaId, totalVotes } (body: code, ideaId, visitorId, action) */
export function castVote(payload: {
  code: string;
  ideaId: string;
  visitorId: string;
  action: "add" | "remove";
}): Promise<VoteResponse> {
  return request<VoteResponse>("POST", "/api/vote", { body: payload });
}

/* GET /api/results?code=XXX → { results: ResultItem[] } (Reveal phase only) */
export function getResults(code: string, signal?: AbortSignal): Promise<ResultsResponse> {
  return request<ResultsResponse>("GET", `/api/results?code=${encodeURIComponent(code)}`, {
    signal,
  });
}

/* POST /api/status → { ok, status } (moderator token) */
export function setStatus(payload: {
  code: string;
  status: WorkshopStatus;
}): Promise<StatusResponse> {
  return request<StatusResponse>("POST", "/api/status", { body: payload });
}

/* POST /api/moderator/reset → reset workshop state (moderator token) */
export function resetWorkshop(code: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("POST", "/api/moderator/reset", {
    body: { code },
  });
}

/* GET /api/moderator/state → full room state (moderator token) */
export function getRoomState(code: string, signal?: AbortSignal): Promise<RoomState> {
  return request<RoomState>("GET", `/api/moderator/state?code=${encodeURIComponent(code)}`, {
    signal,
  });
}

/* POST /api/coach → { ok, reply } (body: code, ideaId, persona) */
export function requestCoach(payload: {
  code: string;
  ideaId: string;
  persona: CoachPersona;
}): Promise<CoachResponse> {
  return request<CoachResponse>("POST", "/api/coach", { body: payload });
}

/* GET /api/ticker?code=XXX → { ticker: TickerEntry[] } */
export function getTicker(code: string, signal?: AbortSignal): Promise<TickerResponse> {
  return request<TickerResponse>("GET", `/api/ticker?code=${encodeURIComponent(code)}`, {
    signal,
  });
}

/* POST /api/moderator/export-ppt — generate branded deck (moderator token) */
export function exportPpt(code: string): Promise<{ ok: boolean; url?: string }> {
  return request<{ ok: boolean; url?: string }>(
    "POST",
    "/api/moderator/export-ppt",
    { body: { code } },
  );
}
