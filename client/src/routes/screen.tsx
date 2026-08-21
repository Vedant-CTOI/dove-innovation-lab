/* ═══════════════════════════════════════════════════════════
   screen.tsx — Big Screen (/workshops/:id/screen)
   Operator console + live idea wall + ticker + timer + QR.
   Dark cinematic. Uses IdeaCard, Timer, Ticker, QRCard,
   GlassCard, PulpBurst, ParticleField.
   ═══════════════════════════════════════════════════════════ */

import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  IdeaCard,
  Ticker,
  QRCard,
  Timer,
  GlassCard,
  Badge,
  Button,
} from "../components";
import { useStaggerContainer, useStaggerItem } from "../components/motion";
import {
  PageTransition,
  OfflineBanner,
  LoadingState,
  EmptyStateScreen,
  ErrorState,
  StaleIndicator,
  StatusBadge,
} from "../lib/states";
import {
  useSocket,
  useRoom,
  useIdeas,
  useStatus,
  useTimer,
  useTicker,
} from "../lib/hooks";
import { WORKSHOP_TITLE } from "../lib/constants";
import type { Idea } from "../lib/types";

export function BigScreen() {
  const { id: code } = useParams({ strict: false }) as { id?: string };

  const { isConnected, isReconnecting } = useSocket();
  const { joinState } = useRoom(code ?? null);
  const { ideas, isLoading, isError, isStale, refetch } = useIdeas(code ?? null);
  const { status } = useStatus(code ?? null);
  const { timer } = useTimer(code ?? null);
  const { tickerItems } = useTicker(code ?? null);

  // Dark theme for big screen
  useEffect(() => {
    document.documentElement.classList.remove("theme-light");
    document.documentElement.classList.add("theme-dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const staggerContainer = useStaggerContainer(0.06);
  const staggerItem = useStaggerItem();

  const participantUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/workshops/${code}/participants`
      : `/workshops/${code}/participants`;

  // Loading state
  if (isLoading || joinState === "joining") {
    return (
      <>
        <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
        <PageTransition>
          <div className="relative min-h-screen p-6">
            <ScreenHeader status={status} code={code ?? ""} />
            <LoadingState variant="grid" label="Pouring the pulp…" />
          </div>
        </PageTransition>
      </>
    );
  }

  // Error state
  if (isError) {
    return (
      <>
        <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
        <PageTransition>
          <div className="relative min-h-screen p-6">
            <ScreenHeader status={status} code={code ?? ""} />
            <ErrorState
              title="Couldn't load ideas"
              message="The orchard is暂时 unreachable. Try again?"
              onRetry={() => refetch()}
            />
          </div>
        </PageTransition>
      </>
    );
  }

  return (
    <>
      <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
      <PageTransition>
        <div className="relative min-h-screen flex flex-col">
          {/* ── Header ── */}
          <ScreenHeader status={status} code={code ?? ""} stale={isStale} />

          {/* ── Main content: idea wall + sidebar ── */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 px-6 pb-4">
            {/* Idea wall */}
            <div className="flex-1 min-h-0">
              <AnimatePresence mode="wait">
                {ideas.length === 0 ? (
                  <EmptyStateScreen
                    key="empty"
                    title="No ideas yet"
                    description="Ideas will burst onto the screen the moment participants submit them!"
                    ctaLabel="Open Participant View"
                    onCta={() => {
                      if (code) {
                        window.open(`/workshops/${code}/participants`, "_blank");
                      }
                    }}
                  />
                ) : (
                  <motion.div
                    key="wall"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                  >
                    <AnimatePresence mode="popLayout">
                      {ideas.map((idea: Idea) => (
                        <motion.div key={idea.id} variants={staggerItem} layout>
                          <IdeaCard idea={idea} preview />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar: QR + Timer */}
            <aside className="lg:w-80 shrink-0 flex flex-col gap-4 items-center">
              <QRCard
                value={participantUrl}
                roomCode={code ?? ""}
                title="Scan to Join"
                subtitle="Point your camera here"
                timer={
                  timer.running && timer.endsAt ? (
                    <Timer endsAt={timer.endsAt} compact />
                  ) : undefined
                }
              />
              {timer.running && timer.endsAt && (
                <GlassCard padding="sm" className="w-full">
                  <div className="relative z-10 flex flex-col items-center gap-2" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
                    <Badge variant="berry" size="sm" pulse>Timer Active</Badge>
                    <Timer endsAt={timer.endsAt} />
                  </div>
                </GlassCard>
              )}
            </aside>
          </div>

          {/* ── Ticker ── */}
          <div className="px-6 pb-6">
            <Ticker items={tickerItems} />
          </div>
        </div>
      </PageTransition>
    </>
  );
}

/* ── Screen header ── */
function ScreenHeader({
  status,
  code,
  stale,
}: {
  status: string;
  code: string;
  stale?: boolean;
}) {
  return (
    <header className="px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-juice-gradient">
          {WORKSHOP_TITLE}
        </h1>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center gap-3">
        {stale && <StaleIndicator show={stale} />}
        <Badge variant="ink" size="md">
          Room: {code}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`/workshops/${code}/control`, "_blank")}
          aria-label="Open operator console"
        >
          ⚙ Console
        </Button>
      </div>
    </header>
  );
}
