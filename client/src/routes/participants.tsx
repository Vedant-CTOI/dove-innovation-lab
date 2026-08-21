/* ═══════════════════════════════════════════════════════════
   participants.tsx — Participant (/workshops/:id/participants)
   Team selection → idea submission → voting.
   Light/branded theme. Uses IdeaCard/IdeaSubmitForm, VoteCard,
   RevealCard, Button, Card, CoachPanel.
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState, useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  IdeaCard,
  IdeaSubmitForm,
  VoteCard,
  RevealCard,
  Button,
  Card,
  Badge,
  Input,
  CoachPanel,
  ParticleField,
} from "../components";
import { DURATION, EASE_BOUNCE, useStaggerContainer, useStaggerItem } from "../components/motion";
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
  useVote,
  useCoach,
  useSubmitIdea,
  useResults,
} from "../lib/hooks";
import { TEAMS, getVisitorId } from "../lib/constants";
import { BRAND_TAGLINE } from "../lib/constants";
import type { CoachPersona } from "../lib/types";

const NAME_KEY = "mm-participant-name";
const TEAM_KEY = "mm-participant-team";

export function ParticipantPage() {
  const { id: code } = useParams({ strict: false }) as { id?: string };
  const prefersReduced = useReducedMotion();

  // Participant identity (name + team)
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [team, setTeam] = useState(() => localStorage.getItem(TEAM_KEY) || "");
  const [hasJoined, setHasJoined] = useState(() => !!localStorage.getItem(NAME_KEY) && !!localStorage.getItem(TEAM_KEY));

  const { isConnected, isReconnecting } = useSocket();
  const { joinState } = useRoom(hasJoined ? code ?? null : null, { name, team });
  const { ideas, isLoading, isError, isStale, refetch } = useIdeas(code ?? null);
  const { status } = useStatus(code ?? null);
  const { voteVisible, toggleVote, isVoting, votedIdeas } = useVote(code ?? null);
  const { submitIdea, editIdea, isSubmitting } = useSubmitIdea(code ?? null);

  // Coaching
  const [coachingIdeaId, setCoachingIdeaId] = useState<string | null>(null);
  const coachingIdea = useMemo(
    () => ideas.find((i) => i.id === coachingIdeaId) ?? null,
    [ideas, coachingIdeaId],
  );
  const { messages, requestCoach, loading: coachLoading } = useCoach(
    code ?? null,
    coachingIdeaId,
  );

  // Results (Reveal phase)
  const showResults = status === "Reveal" || status === "Completed";
  const { results, isForbidden, isLoading: resultsLoading } = useResults(
    code ?? null,
    showResults,
  );

  // Light/branded theme for participant view
  useEffect(() => {
    document.documentElement.classList.remove("theme-dark");
    document.documentElement.classList.add("theme-light");
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const staggerContainer = useStaggerContainer(0.05);
  const staggerItem = useStaggerItem();

  const visitorId = getVisitorId();

  const handleJoin = () => {
    if (!name.trim() || !team) return;
    localStorage.setItem(NAME_KEY, name.trim());
    localStorage.setItem(TEAM_KEY, team);
    setHasJoined(true);
  };

  // ── Team selection screen ──
  if (!hasJoined) {
    return (
      <>
        <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
        <ParticleField density={0.3} interactive={false} />
        <PageTransition>
          <div className="relative min-h-screen flex items-center justify-center p-6">
            <div className="relative z-10 w-full max-w-lg">
              <div className="text-center mb-6">
                <Badge variant="pulp" size="md" pulse>Join the Orchard</Badge>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-juice-gradient mt-3">
                  Pick Your Team
                </h1>
                <p className="font-body text-sm text-orange-dark/70 mt-1">
                  {BRAND_TAGLINE}
                </p>
              </div>
              <Card variant="solid" padding="lg">
                <div className="flex flex-col gap-4">
                  <Input
                    label="Your Name"
                    placeholder="Enter your name…"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    size="lg"
                    autoFocus
                    aria-label="Participant name"
                    hint="This will be shown with your ideas"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim() && team) handleJoin();
                    }}
                  />
                  <div>
                    <label className="font-accent font-medium text-sm text-orange-dark block mb-2">
                      Select Your Team
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {TEAMS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTeam(t.id)}
                          className={[
                            "flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)]",
                            "font-display font-semibold transition-all no-select",
                            "border-2",
                            team === t.id
                              ? "bg-pulp-gradient text-ink border-pulp-gold shadow-[0_4px_12px_rgba(252,188,0,0.25)]"
                              : "bg-white/60 text-ink/60 border-orange-dark/15 hover:border-orange-dark/30",
                          ].join(" ")}
                          style={{
                            transitionTimingFunction: "var(--ease-bounce)",
                            transitionDuration: "var(--duration-fast)",
                          }}
                          aria-pressed={team === t.id}
                          aria-label={`Select team ${t.label}`}
                        >
                          <span className="text-2xl">
                            {t.id === "classic" ? "🍊" : t.id === "tropical" ? "🌴" : t.id === "mixed" ? "🍹" : "🫐"}
                          </span>
                          <span className="text-sm">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleJoin}
                    disabled={!name.trim() || !team}
                    aria-label="Join workshop"
                  >
                    Join Workshop →
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
            <ParticipantHeader status={status} code={code ?? ""} name={name} />
            <LoadingState variant="grid" label="Shaking up the pulp…" />
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
            <ParticipantHeader status={status} code={code ?? ""} name={name} />
            <ErrorState
              title="Couldn't load ideas"
              message="Check your connection and try again."
              onRetry={() => refetch()}
            />
          </div>
        </PageTransition>
      </>
    );
  }

  const canEdit = status === "Ideate";
  const canVote = status === "Vote";

  return (
    <>
      <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
      <PageTransition>
        <div className="relative min-h-screen flex flex-col">
          <ParticipantHeader
            status={status}
            code={code ?? ""}
            name={name}
            stale={isStale}
          />

          <main className="flex-1 px-6 py-4 max-w-5xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {/* ── Reveal phase: ranked results ── */}
              {showResults ? (
                <motion.div
                  key="reveal"
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                  animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
                  transition={{ duration: DURATION.base, ease: EASE_BOUNCE }}
                >
                  <div className="text-center mb-6">
                    <Badge variant="leaf" size="md" pulse>Results</Badge>
                    <h2 className="font-display text-3xl font-bold text-juice-gradient mt-2">
                      The Orchard Has Spoken!
                    </h2>
                  </div>
                  {resultsLoading ? (
                    <LoadingState variant="grid" label="Counting the pulp…" />
                  ) : isForbidden ? (
                    <EmptyStateScreen
                      title="Results coming soon"
                      description="The facilitator will reveal the results shortly."
                    />
                  ) : results.length === 0 ? (
                    <EmptyStateScreen
                      title="No results"
                      description="No votes were cast in this workshop."
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {results.map((item, i) => (
                        <RevealCard key={item.id} item={item} delay={i * 0.15} />
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="workshop"
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                  animate={prefersReduced ? { opacity: 1 } : { opacity: 1 }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* ── Idea submission (Ideate phase only) ── */}
                  {canEdit && (
                    <IdeaSubmitForm
                      onSubmit={(text) => {
                        submitIdea({
                          code: code!,
                          text,
                          team,
                          flavour: team,
                          author: name,
                        });
                      }}
                      team={team}
                      author={name}
                    />
                  )}

                  {/* ── Phase notice for non-Ideate phases ── */}
                  {!canEdit && !canVote && (
                    <Card variant="solid" padding="md">
                      <div className="relative z-10 flex items-center gap-3" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
                        <Badge variant="sky" size="md">Presentation</Badge>
                        <p className="font-body text-sm text-ink/70">
                          Review the ideas below. {canVote ? "Get ready to vote!" : "Voting opens soon."}
                        </p>
                      </div>
                    </Card>
                  )}

                  {/* ── Idea wall / Vote cards ── */}
                  {ideas.length === 0 && canEdit ? (
                    <EmptyStateScreen
                      title="No ideas yet"
                      description="Be the first to shake up an idea! Use the form above."
                    />
                  ) : ideas.length === 0 ? (
                    <EmptyStateScreen
                      title="Waiting for ideas"
                      description="Ideas will appear here as participants submit them."
                    />
                  ) : canVote ? (
                    // ── Vote cards ──
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="berry" size="md" pulse>Blind Voting</Badge>
                        <span className="font-body text-sm text-orange-dark/70">
                          Back your favourites — vote counts are hidden until reveal!
                        </span>
                      </div>
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                      >
                        {ideas.map((idea) => (
                          <motion.div key={idea.id} variants={staggerItem}>
                            <VoteCard
                              ideaId={idea.id}
                              ideaText={idea.text}
                              team={idea.team}
                              author={idea.author}
                              backed={votedIdeas.has(idea.id)}
                              revealed={voteVisible}
                              voteCount={idea.votes}
                              disabled={isVoting}
                              onToggle={() =>
                                toggleVote(idea.id, votedIdeas.has(idea.id))
                              }
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  ) : (
                    // ── Idea wall (read-only or editable) ──
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    >
                      <AnimatePresence mode="popLayout">
                        {ideas.map((idea) => (
                          <motion.div key={idea.id} variants={staggerItem} layout>
                            <IdeaCard
                              idea={idea}
                              editable={canEdit}
                              isAuthor={idea.author === name}
                              onSave={(text) =>
                                editIdea(idea.id, text, idea.flavour, visitorId)
                              }
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* ── Coach panel ── */}
                  {coachingIdea && (
                    <CoachPanel
                      messages={messages}
                      onRequest={(persona: CoachPersona) => requestCoach(persona)}
                      loading={coachLoading}
                      ideaText={coachingIdea.text}
                    />
                  )}

                  {/* ── Coaching trigger buttons (under each idea in the wall) ── */}
                  {canEdit && ideas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {ideas.slice(0, 5).map((idea) => (
                        <Button
                          key={idea.id}
                          size="sm"
                          variant={coachingIdeaId === idea.id ? "primary" : "ghost"}
                          onClick={() =>
                            setCoachingIdeaId(
                              coachingIdeaId === idea.id ? null : idea.id,
                            )
                          }
                          disabled={isSubmitting}
                        >
                          💬 Coach: {idea.text.slice(0, 20)}…
                        </Button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* ── Footer ── */}
          <footer className="px-6 py-3 text-center">
            <p className="font-body text-xs text-ink/30">
              Room {code} · {BRAND_TAGLINE}
            </p>
          </footer>
        </div>
      </PageTransition>
    </>
  );
}

/* ── Participant header ── */
function ParticipantHeader({
  status,
  code,
  name,
  stale,
}: {
  status: string;
  code: string;
  name: string;
  stale?: boolean;
}) {
  return (
    <header className="px-6 py-4 flex items-center justify-between gap-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        {stale && <StaleIndicator show={stale} />}
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="pulp" size="sm">{name}</Badge>
        <Badge variant="ink" size="sm">Room: {code}</Badge>
      </div>
    </header>
  );
}
