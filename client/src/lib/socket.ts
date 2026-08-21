/* ═══════════════════════════════════════════════════════════
   socket.ts — Socket.io-client singleton
   Components subscribe via hooks; components never construct.
   Both websocket and polling transports configured.
   Exports typed socket instance + connection state.
   ═══════════════════════════════════════════════════════════ */

import { io, type Socket } from "socket.io-client";
import type {
  IdeaAddedPayload,
  IdeaUpdatedPayload,
  VoteAddedPayload,
  WorkshopStatusChangedPayload,
  TickerPayload,
  TimerStartedPayload,
  TimerStoppedPayload,
  VoteVisibilityChangedPayload,
  CoachReplyPayload,
  JoinRoomPayload,
  AddIdeaPayload,
  EditIdeaPayload,
  AddVotePayload,
  RemoveVotePayload,
  SetStatusPayload,
  SetTimerPayload,
  ToggleVoteVisibilityPayload,
  RequestCoachPayload,
  PushTickerPayload,
  JoinRoomAck,
  IdeaAck,
  VoteAck,
  OkAck,
  TimerAck,
  CoachAck,
  ConnectionState,
} from "./types";

/* ── Server URL ──
   In dev, Vite proxies /socket.io to localhost:3001.
   In production, same-origin (Express serves client + Socket.IO). */
const SOCKET_URL =
  import.meta.env.DEV && import.meta.env.VITE_SOCKET_URL
    ? import.meta.env.VITE_SOCKET_URL
    : typeof window !== "undefined"
      ? window.location.origin
      : "";

/* ── Socket event names (typed) ── */
export const SERVER_EVENTS = {
  IdeaAdded: "idea_added",
  IdeaUpdated: "idea_updated",
  VoteAdded: "vote_added",
  WorkshopStatusChanged: "workshop_status_changed",
  Ticker: "ticker",
  TimerStarted: "timer_started",
  TimerStopped: "timer_stopped",
  VoteVisibilityChanged: "vote_visibility_changed",
  CoachReply: "coach_reply",
} as const;

export const CLIENT_EVENTS = {
  JoinRoom: "join_room",
  AddIdea: "add_idea",
  EditIdea: "edit_idea",
  AddVote: "add_vote",
  RemoveVote: "remove_vote",
  SetStatus: "set_status",
  SetTimer: "set_timer",
  StartTimer: "start_timer",
  StopTimer: "stop_timer",
  ToggleVoteVisibility: "toggle_vote_visibility",
  RequestCoach: "request_coach",
  PushTicker: "push_ticker",
} as const;

/* ── Create the singleton socket ── */
export const socket: Socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
});

/* ── Connection state tracker (observable for hooks) ── */
let connectionState: ConnectionState = "connecting";
const connectionListeners = new Set<(s: ConnectionState) => void>();

function setConnectionState(s: ConnectionState) {
  connectionState = s;
  for (const fn of connectionListeners) fn(s);
}

socket.on("connect", () => setConnectionState("connected"));
socket.on("disconnect", () => setConnectionState("disconnected"));
socket.io.on("reconnect_attempt", () =>
  setConnectionState("reconnecting"),
);
socket.io.on("reconnect", () => setConnectionState("connected"));
socket.io.on("reconnect_failed", () => setConnectionState("disconnected"));

export function getConnectionState(): ConnectionState {
  return connectionState;
}

export function subscribeConnectionState(
  fn: (s: ConnectionState) => void,
): () => void {
  connectionListeners.add(fn);
  // Immediately call with current state
  fn(connectionState);
  return () => connectionListeners.delete(fn);
}

/* ── Typed emit helpers (client → server, with ack callbacks) ── */

export function emitJoinRoom(
  payload: JoinRoomPayload,
  ack: (res: JoinRoomAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.JoinRoom, payload, ack);
}

export function emitAddIdea(
  payload: AddIdeaPayload,
  ack: (res: IdeaAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.AddIdea, payload, ack);
}

export function emitEditIdea(
  payload: EditIdeaPayload,
  ack: (res: IdeaAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.EditIdea, payload, ack);
}

export function emitAddVote(
  payload: AddVotePayload,
  ack: (res: VoteAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.AddVote, payload, ack);
}

export function emitRemoveVote(
  payload: RemoveVotePayload,
  ack: (res: OkAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.RemoveVote, payload, ack);
}

export function emitSetStatus(
  payload: SetStatusPayload,
  ack: (res: JoinRoomAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.SetStatus, payload, ack);
}

export function emitSetTimer(
  payload: SetTimerPayload,
  ack: (res: OkAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.SetTimer, payload, ack);
}

export function emitStartTimer(
  code: string,
  ack: (res: TimerAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.StartTimer, { code }, ack);
}

export function emitStopTimer(code: string, ack: (res: OkAck) => void): void {
  socket.emit(CLIENT_EVENTS.StopTimer, { code }, ack);
}

export function emitToggleVoteVisibility(
  payload: ToggleVoteVisibilityPayload,
  ack: (res: OkAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.ToggleVoteVisibility, payload, ack);
}

export function emitRequestCoach(
  payload: RequestCoachPayload,
  ack: (res: CoachAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.RequestCoach, payload, ack);
}

export function emitPushTicker(
  payload: PushTickerPayload,
  ack: (res: OkAck) => void,
): void {
  socket.emit(CLIENT_EVENTS.PushTicker, payload, ack);
}

/* ── Typed event listener helpers (server → client) ── */

export function onIdeaAdded(fn: (p: IdeaAddedPayload) => void): () => void {
  socket.on(SERVER_EVENTS.IdeaAdded, fn);
  return () => socket.off(SERVER_EVENTS.IdeaAdded, fn);
}

export function onIdeaUpdated(fn: (p: IdeaUpdatedPayload) => void): () => void {
  socket.on(SERVER_EVENTS.IdeaUpdated, fn);
  return () => socket.off(SERVER_EVENTS.IdeaUpdated, fn);
}

export function onVoteAdded(fn: (p: VoteAddedPayload) => void): () => void {
  socket.on(SERVER_EVENTS.VoteAdded, fn);
  return () => socket.off(SERVER_EVENTS.VoteAdded, fn);
}

export function onWorkshopStatusChanged(
  fn: (p: WorkshopStatusChangedPayload) => void,
): () => void {
  socket.on(SERVER_EVENTS.WorkshopStatusChanged, fn);
  return () => socket.off(SERVER_EVENTS.WorkshopStatusChanged, fn);
}

export function onTicker(fn: (p: TickerPayload) => void): () => void {
  socket.on(SERVER_EVENTS.Ticker, fn);
  return () => socket.off(SERVER_EVENTS.Ticker, fn);
}

export function onTimerStarted(fn: (p: TimerStartedPayload) => void): () => void {
  socket.on(SERVER_EVENTS.TimerStarted, fn);
  return () => socket.off(SERVER_EVENTS.TimerStarted, fn);
}

export function onTimerStopped(fn: (p: TimerStoppedPayload) => void): () => void {
  socket.on(SERVER_EVENTS.TimerStopped, fn);
  return () => socket.off(SERVER_EVENTS.TimerStopped, fn);
}

export function onVoteVisibilityChanged(
  fn: (p: VoteVisibilityChangedPayload) => void,
): () => void {
  socket.on(SERVER_EVENTS.VoteVisibilityChanged, fn);
  return () => socket.off(SERVER_EVENTS.VoteVisibilityChanged, fn);
}

export function onCoachReply(fn: (p: CoachReplyPayload) => void): () => void {
  socket.on(SERVER_EVENTS.CoachReply, fn);
  return () => socket.off(SERVER_EVENTS.CoachReply, fn);
}
