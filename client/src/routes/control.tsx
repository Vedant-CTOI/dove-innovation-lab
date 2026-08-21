/* ═══════════════════════════════════════════════════════════
   control.tsx — Moderator Operator Console (/workshops/:id/control)
   Numbered phase flow, blind-vote toggle, timer controls,
   ticker push, PPT export at Reveal.
   Dark theme. Uses Button, Badge, Card, Timer, VoteToggle.
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Badge,
  Card,
  Timer,
  VoteToggle,
  Input,
} from "../components";
import { DURATION, EASE_BOUNCE } from "../components/motion";
import {
  PageTransition,
  OfflineBanner,
  LoadingState,
  ErrorState,
  StatusBadge,
  StatusFlow,
  StaleIndicator,
} from "../lib/states";
import {
  useSocket,
  useRoom,
  useStatus,
  useTimer,
  useVote,
  useIdeas,
  useResults,
  useTicker,
} from "../lib/hooks";
import { getRoomState, exportPpt } from "../lib/api";
import { emitToggleVoteVisibility } from "../lib/socket";
import {
  getModeratorToken,
  setModeratorToken,
  clearModeratorToken,
  queryKeys,
} from "../lib/constants";
import { nextStatus } from "../lib/types";
import type { WorkshopStatus } from "../lib/types";

const TIMER_PRESETS = [
  { label: "1 min", value: 60 },
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
];

export function ControlPage() {
  const { id: code } = useParams({ strict: false }) as { id?: string };
  const prefersReduced = useReducedMotion();

  // Moderator auth
  const [tokenInput, setTokenInput] = useState("");
  const [hasToken, setHasToken] = useState(() => !!getModeratorToken());

  const { isConnected, isReconnecting } = useSocket();
  const { joinState } = useRoom(code ?? null, { name: "Moderator", team: "classic" });
  const { status, setStatus } = useStatus(code ?? null);
  const { timer, startTimer, stopTimer, setDuration } = useTimer(code ?? null);
  const { voteVisible } = useVote(code ?? null);
  const { ideas, isLoading, isError, isStale, refetch } = useIdeas(code ?? null);
  const { tickerItems, pushTicker } = useTicker(code ?? null);

  const showResults = status === "Reveal" || status === "Completed";
  const { results } = useResults(code ?? null, showResults);

  // Room state for initial values (moderator-only)
  const { data: roomState } = useQuery({
    queryKey: code ? queryKeys.roomState(code) : ["room-state", "none"],
    queryFn: async ({ signal }) => {
      if (!code) throw new Error("No code");
      return getRoomState(code, signal);
    },
    enabled: !!code && hasToken,
    staleTime: 5000,
  });

  // Dark theme for operator console
  useEffect(() => {
    document.documentElement.classList.remove("theme-light");
    document.documentElement.classList.add("theme-dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // ── Moderator auth screen ──
  if (!hasToken) {
    return (
      <>
        <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
        <PageTransition>
          <div className="relative min-h-screen flex items-center justify-center p-6">
            <div className="relative z-10 w-full max-w-md">
              <div className="text-center mb-6">
                <Badge variant="ink" size="md">Moderator Access</Badge>
                <h1 className="font-display text-2xl font-bold text-cream/90 mt-3">
                  Operator Console
                </h1>
                <p className="font-body text-sm text-cream/50 mt-1">
                  Enter your moderator key to control the workshop.
                </p>
              </div>
              <Card variant="glass" padding="lg">
                <div className="relative z-10 flex flex-col gap-4" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
                  <Input
                    label="Moderator Key"
                    type="password"
                    placeholder="Enter moderator key…"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    size="lg"
                    autoFocus
                    aria-label="Moderator authentication key"
                    hint="The key is set via MODERATOR_KEY env var on the server"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tokenInput.trim()) {
                        setModeratorToken(tokenInput.trim());
                        setHasToken(true);
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      if (tokenInput.trim()) {
                        setModeratorToken(tokenInput.trim());
                        setHasToken(true);
                      }
                    }}
                    disabled={!tokenInput.trim()}
                    aria-label="Authenticate as moderator"
                  >
                    Authenticate →
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </PageTransition>
      </>
    );
  }

  // ── Loading state ──
  if (isLoading || joinState === "joining") {
    return (
      <>
        <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
        <PageTransition>
          <div className="relative min-h-screen p-6">
            <ControlHeader status={status} code={code ?? ""} onLogout={() => { clearModeratorToken(); setHasToken(false); }} />
            <LoadingState variant="grid" label="Loading workshop state…" />
          </div>
        </PageTransition>
      </>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <>
        <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
        <PageTransition>
          <div className="relative min-h-screen p-6">
            <ControlHeader status={status} code={code ?? ""} onLogout={() => { clearModeratorToken(); setHasToken(false); }} />
            <ErrorState
              title="Couldn't load workshop"
              message="Check your connection and moderator key."
              onRetry={() => refetch()}
            />
          </div>
        </PageTransition>
      </>
    );
  }

  const next = nextStatus(status as WorkshopStatus);

  // Sync initial voteVisible from room state
  const initialVoteVisible = roomState?.voteVisible ?? voteVisible;

  return (
    <>
      <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
      <PageTransition>
        <div className="relative min-h-screen flex flex-col">
          <ControlHeader
            status={status}
            code={code ?? ""}
            stale={isStale}
            onLogout={() => {
              clearModeratorToken();
              setHasToken(false);
            }}
          />

          <div className="flex-1 px-6 py-4 max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ── Left column: phase flow + vote toggle ── */}
              <div className="flex flex-col gap-4">
                <StatusFlow
                  currentStatus={status}
                  onAdvance={() => {
                    if (next) setStatus(next);
                  }}
                />

                {/* Vote visibility toggle */}
                <Card variant="glass" padding="md">
                  <div className="relative z-10 flex flex-col gap-3" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
                    <div className="flex items-center gap-2">
                      <Badge variant="berry" size="sm">Blind Voting</Badge>
                      <span className="font-body text-sm text-cream/60">
                        {initialVoteVisible ? "Votes visible to participants" : "Votes hidden (blind)"}
                      </span>
                    </div>
                    <VoteToggle
                      visible={initialVoteVisible}
                      onToggle={(visible) => {
                        if (code) {
                          emitToggleVoteVisibility({ code, visible }, () => {});
                        }
                      }}
                    />
                    {status !== "Vote" && status !== "Reveal" && (
                      <p className="font-body text-xs text-cream/30 italic">
                        Toggle is active during Vote and Reveal phases
                      </p>
                    )}
                  </div>
                </Card>
              </div>

              {/* ── Right column: timer + ticker push + export ── */}
              <div className="flex flex-col gap-4">
                {/* Timer controls */}
                <Card variant="glass" padding="md">
                  <div className="relative z-10 flex flex-col gap-3" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
                    <div className="flex items-center gap-2">
                      <Badge variant="ink" size="sm">Timer</Badge>
                      {timer.running && timer.endsAt && (
                        <Timer endsAt={timer.endsAt} compact />
                      )}
                    </div>

                    {/* Duration presets */}
                    <div className="flex flex-wrap gap-2">
                      {TIMER_PRESETS.map((preset) => (
                        <Button
                          key={preset.value}
                          size="sm"
                          variant={timer.duration === preset.value ? "primary" : "ghost"}
                          onClick={() => setDuration(preset.value)}
                          aria-label={`Set timer to ${preset.label}`}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    {/* Start/Stop */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => startTimer()}
                        disabled={timer.running}
                        aria-label="Start timer"
                      >
                        ▶ Start
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={stopTimer}
                        disabled={!timer.running}
                        aria-label="Stop timer"
                      >
                        ⏹ Stop
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Ticker push */}
                <Card variant="glass" padding="md">
                  <TickerPushForm
                    onPush={(text) => {
                      if (code) {
                        pushTicker("ANNOUNCE", text, "ink");
                      }
                    }}
                  />
                </Card>

                {/* PPT export (Reveal phase only) */}
                <AnimatePresence>
                  {showResults && (
                    <motion.div
                      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
                      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                      transition={{ duration: DURATION.base, ease: EASE_BOUNCE }}
                    >
                      <Card variant="branded" padding="md">
                        <div className="relative z-10 flex flex-col gap-3" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
                          <Badge variant="leaf" size="md" pulse>Reveal Ready</Badge>
                          <p className="font-body text-sm text-ink/70">
                            Export a branded PowerPoint deck from the workshop results.
                          </p>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => {
                              if (code) exportPpt(code);
                            }}
                            aria-label="Export PowerPoint deck"
                          >
                            📊 Export PPT
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Ideas summary ── */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="pulp" size="sm">Ideas ({ideas.length})</Badge>
                {showResults && (
                  <Badge variant="leaf" size="sm">Results ({results.length})</Badge>
                )}
              </div>
              {showResults && results.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {results.slice(0, 5).map((item) => (
                    <Card key={item.id} variant="glass" padding="sm">
                      <div className="relative z-10 flex items-center gap-3" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
                        <Badge variant="pulp" size="sm">#{item.rank}</Badge>
                        <span className="font-body text-sm text-cream/70 flex-1 truncate">
                          {item.text}
                        </span>
                        <Badge variant="ink" size="sm">{item.votes} votes</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : ideas.length === 0 ? (
                <p className="font-body text-sm text-cream/40">No ideas submitted yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {ideas.slice(0, 10).map((idea) => (
                    <Card key={idea.id} variant="glass" padding="sm">
                      <div className="relative z-10 flex items-center gap-3" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
                        <Badge variant="pulp" size="sm">{idea.team}</Badge>
                        <span className="font-body text-sm text-cream/70 flex-1 truncate">
                          {idea.text}
                        </span>
                        <span className="font-body text-xs text-cream/30">
                          {idea.author}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* ── Live ticker preview ── */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="ink" size="sm">Live Ticker ({tickerItems.length})</Badge>
              </div>
              <div className="flex flex-col gap-1">
                {tickerItems.slice(-5).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <Badge variant={item.badgeColor || "ink"} size="sm">{item.badge}</Badge>
                    <span className="font-body text-cream/60">{item.text}</span>
                  </div>
                ))}
                {tickerItems.length === 0 && (
                  <p className="font-body text-sm text-cream/30">No ticker activity yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}

/* ── Control header ── */
function ControlHeader({
  status,
  code,
  stale,
  onLogout,
}: {
  status: string;
  code: string;
  stale?: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="px-6 py-4 flex items-center justify-between gap-4 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Badge variant="ink" size="md">⚙ Operator</Badge>
        <StatusBadge status={status} />
        {stale && <StaleIndicator show={stale} />}
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="ink" size="sm">Room: {code}</Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          aria-label="Logout moderator"
        >
          Logout
        </Button>
      </div>
    </header>
  );
}

/* ── Ticker push form ── */
function TickerPushForm({ onPush }: { onPush: (text: string) => void }) {
  const [text, setText] = useState("");
  const prefersReduced = useReducedMotion();

  return (
    <motion.form
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.fast, ease: EASE_BOUNCE }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onPush(text.trim());
        setText("");
      }}
      className="relative z-10 flex flex-col gap-3"
      style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}
    >
      <div className="flex items-center gap-2">
        <Badge variant="ink" size="sm">Push Ticker</Badge>
      </div>
      <Input
        placeholder="Enter announcement…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        size="sm"
        aria-label="Ticker message to push"
        hint="This message will appear on the big screen ticker"
      />
      <Button type="submit" size="sm" variant="primary" disabled={!text.trim()}>
        Push →
      </Button>
    </motion.form>
  );
}
