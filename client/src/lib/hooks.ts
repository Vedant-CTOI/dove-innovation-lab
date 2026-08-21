/* ═══════════════════════════════════════════════════════════
   hooks.ts — React hooks for the workshop platform.
   Socket events invalidate/refetch TanStack Query — never
   trust in-memory state to survive reconnect.
   REST for reads/writes with a response. Sockets for push.
   ═══════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useSyncExternalStore, useRef, useState } from "react";
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  socket,
  subscribeConnectionState,
  onIdeaAdded,
  onIdeaUpdated,
  onVoteAdded,
  onWorkshopStatusChanged,
  onTicker,
  onTimerStarted,
  onTimerStopped,
  onVoteVisibilityChanged,
  onCoachReply,
  emitJoinRoom,
  emitAddIdea,
  emitSetStatus,
  emitSetTimer,
  emitStartTimer,
  emitStopTimer,
  emitPushTicker,
} from "./socket";
import {
  getIdeas as apiGetIdeas,
  getResults as apiGetResults,
  getTicker as apiGetTicker,
  castVote as apiCastVote,
  requestCoach as apiRequestCoach,
  submitIdea as apiSubmitIdea,
  editIdea as apiEditIdea,
  getRoomState as apiGetRoomState,
} from "./api";
import { queryKeys, getVisitorId } from "./constants";
import { ApiError } from "./query";
import type {
  ConnectionState,
  Idea,
  IdeaAddedPayload,
  IdeaUpdatedPayload,
  TickerEntry,
  TickerPayload,
  TimerState,
  WorkshopStatus,
  WorkshopStatusChangedPayload,
  VoteVisibilityChangedPayload,
  CoachMessage,
  CoachPersona,
  CoachReplyPayload,
} from "./types";

/* ═══════════════════════════════════════════════════════════
   useSocket — subscribe to socket connection state
   ═══════════════════════════════════════════════════════════ */

export interface UseSocketResult {
  connectionState: ConnectionState;
  isConnected: boolean;
  isReconnecting: boolean;
}

export function useSocket(): UseSocketResult {
  const connectionState = useSyncExternalStore(
    subscribeConnectionState,
    () => socketStateSnapshot,
    () => "connecting" as ConnectionState,
  );

  return {
    connectionState,
    isConnected: connectionState === "connected",
    isReconnecting: connectionState === "reconnecting",
  };
}

// Module-level snapshot for useSyncExternalStore getSnapshot
let socketStateSnapshot: ConnectionState = "connecting";
subscribeConnectionState((s) => {
  socketStateSnapshot = s;
});

/* ═══════════════════════════════════════════════════════════
   useRoom — join room, track join status
   ═══════════════════════════════════════════════════════════ */

export type JoinState = "idle" | "joining" | "joined" | "error";

export interface UseRoomResult {
  joinState: JoinState;
  error: string | null;
  rejoin: () => void;
}

export function useRoom(
  code: string | null,
  opts?: { name?: string; team?: string },
): UseRoomResult {
  const [joinState, setJoinState] = useState<JoinState>("idle");
  const [error, setError] = useState<string | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const doJoin = useCallback(() => {
    if (!code) return;
    setJoinState("joining");
    setError(null);

    emitJoinRoom(
      {
        code,
        name: optsRef.current?.name || "Anonymous",
        team: optsRef.current?.team || "classic",
      },
      (ack) => {
        if (ack.ok) {
          setJoinState("joined");
        } else {
          setJoinState("error");
          setError("Failed to join room");
        }
      },
    );

    // Timeout fallback — if no ack in 10s, show error
    const timer = setTimeout(() => {
      setJoinState((prev) => (prev === "joining" ? "error" : prev));
      if (joinState === "joining") setError("Connection timeout");
    }, 10_000);

    return () => clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    if (!code) {
      setJoinState("idle");
      return;
    }

    // Wait for socket connection before joining
    if (!socket.connected) {
      const onConnect = () => doJoin();
      socket.on("connect", onConnect);
      return () => {
        socket.off("connect", onConnect);
      };
    }

    const cleanup = doJoin();
    return cleanup;
  }, [code, doJoin]);

  return { joinState, error, rejoin: doJoin };
}

/* ═══════════════════════════════════════════════════════════
   useIdeas — TanStack Query for ideas + socket invalidation
   ═══════════════════════════════════════════════════════════ */

export interface UseIdeasResult {
  ideas: Idea[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  refetch: () => void;
}

export function useIdeas(code: string | null): UseIdeasResult {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: code ? queryKeys.ideas(code) : ["ideas", "none"],
    queryFn: async ({ signal }) => {
      if (!code) return { ideas: [] };
      const res = await apiGetIdeas(code, signal);
      return res;
    },
    enabled: !!code,
    select: (data) => data.ideas,
  });

  // Socket events → invalidate queries
  useEffect(() => {
    if (!code) return;

    const offAdded = onIdeaAdded(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ideas(code) });
    });

    const offUpdated = onIdeaUpdated(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ideas(code) });
    });

    const offVote = onVoteAdded(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ideas(code) });
    });

    return () => {
      offAdded();
      offUpdated();
      offVote();
    };
  }, [code, queryClient]);

  return {
    ideas: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isStale: query.isStale,
    refetch: () => query.refetch(),
  };
}

/* ═══════════════════════════════════════════════════════════
   useResults — TanStack Query for results (403 until Reveal)
   ═══════════════════════════════════════════════════════════ */

export interface UseResultsResult {
  results: NonNullable<UseQueryResult<ResultsData>["data"]>["results"];
  isForbidden: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

interface ResultsData {
  results: import("./types").ResultItem[];
  forbidden: boolean;
}

export function useResults(
  code: string | null,
  enabled?: boolean,
): UseResultsResult {
  const query = useQuery({
    queryKey: code ? queryKeys.results(code) : ["results", "none"],
    queryFn: async ({ signal }) => {
      if (!code) return { results: [], forbidden: true };
      try {
        const res = await apiGetResults(code, signal);
        return { results: res.results, forbidden: false };
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          return { results: [], forbidden: true };
        }
        throw e;
      }
    },
    enabled: !!code && (enabled ?? true),
  });

  const data = query.data ?? { results: [], forbidden: true };

  return {
    results: data.results,
    isForbidden: data.forbidden,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  };
}

/* ═══════════════════════════════════════════════════════════
   useStatus — track workshop status via socket events
   ═══════════════════════════════════════════════════════════ */

export interface UseStatusResult {
  status: WorkshopStatus;
  setStatus: (status: WorkshopStatus) => void;
  isModerator: boolean;
}

export function useStatus(code: string | null): UseStatusResult {
  const [status, setStatusState] = useState<WorkshopStatus>("Ideate");

  // Try to get initial status from room state (moderator only)
  useEffect(() => {
    if (!code) return;

    // Try REST room state first (works if moderator token set)
    const controller = new AbortController();
    apiGetRoomState(code, controller.signal)
      .then((state) => {
        setStatusState(state.status);
      })
      .catch(() => {
        // Not moderator or not available — default to Ideate,
        // will be updated by socket events
      });

    return () => controller.abort();
  }, [code]);

  // Subscribe to status changes
  useEffect(() => {
    if (!code) return;

    const off = onWorkshopStatusChanged(
      (payload: WorkshopStatusChangedPayload) => {
        setStatusState(payload.status);
      },
    );

    return off;
  }, [code]);

  const setStatus = useCallback(
    (newStatus: WorkshopStatus) => {
      if (!code) return;
      emitSetStatus({ code, status: newStatus }, () => {
        // Optimistic update — server will broadcast the change
        setStatusState(newStatus);
      });
    },
    [code],
  );

  const isModerator = !!code;

  return { status, setStatus, isModerator };
}

/* ═══════════════════════════════════════════════════════════
   useTimer — track timer via timer_started/timer_stopped events
   ═══════════════════════════════════════════════════════════ */

export interface UseTimerResult {
  timer: TimerState;
  startTimer: (duration?: number) => void;
  stopTimer: () => void;
  setDuration: (duration: number) => void;
}

const DEFAULT_TIMER: TimerState = { duration: 300, endsAt: null, running: false };

export function useTimer(code: string | null): UseTimerResult {
  const [timer, setTimer] = useState<TimerState>(DEFAULT_TIMER);

  useEffect(() => {
    if (!code) return;

    const offStart = onTimerStarted((payload) => {
      setTimer({
        duration: payload.duration,
        endsAt: payload.endsAt,
        running: true,
      });
    });

    const offStop = onTimerStopped(() => {
      setTimer((prev) => ({ ...prev, running: false, endsAt: null }));
    });

    return () => {
      offStart();
      offStop();
    };
  }, [code]);

  const startTimer = useCallback(
    (duration?: number) => {
      if (!code) return;
      if (duration) {
        emitSetTimer({ code, duration }, () => {
          emitStartTimer(code, (ack) => {
            if (ack.ok) {
              setTimer({
                duration: duration,
                endsAt: ack.endsAt,
                running: true,
              });
            }
          });
        });
      } else {
        emitStartTimer(code, (ack) => {
          if (ack.ok) {
            setTimer((prev) => ({
              ...prev,
              endsAt: ack.endsAt,
              running: true,
            }));
          }
        });
      }
    },
    [code],
  );

  const stopTimer = useCallback(() => {
    if (!code) return;
    emitStopTimer(code, () => {
      setTimer((prev) => ({ ...prev, running: false, endsAt: null }));
    });
  }, [code]);

  const setDuration = useCallback(
    (duration: number) => {
      if (!code) return;
      emitSetTimer({ code, duration }, () => {
        setTimer((prev) => ({ ...prev, duration }));
      });
    },
    [code],
  );

  return { timer, startTimer, stopTimer, setDuration };
}

/* ═══════════════════════════════════════════════════════════
   useVote — vote via REST + track blind state via socket
   ═══════════════════════════════════════════════════════════ */

export interface UseVoteResult {
  voteVisible: boolean;
  vote: (ideaId: string) => Promise<void>;
  unvote: (ideaId: string) => Promise<void>;
  isVoting: boolean;
  votedIdeas: Set<string>;
  toggleVote: (ideaId: string, backed: boolean) => Promise<void>;
}

export function useVote(code: string | null): UseVoteResult {
  const [voteVisible, setVoteVisible] = useState(false);
  const [votedIdeas, setVotedIdeas] = useState<Set<string>>(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const visitorId = getVisitorId();

  useEffect(() => {
    if (!code) return;

    const off = onVoteVisibilityChanged(
      (payload: VoteVisibilityChangedPayload) => {
        setVoteVisible(payload.visible);
      },
    );

    return off;
  }, [code]);

  const vote = useCallback(
    async (ideaId: string) => {
      if (!code) return;
      setIsVoting(true);
      try {
        await apiCastVote({
          code,
          ideaId,
          visitorId,
          action: "add",
        });
        setVotedIdeas((prev) => new Set(prev).add(ideaId));
      } finally {
        setIsVoting(false);
      }
    },
    [code, visitorId],
  );

  const unvote = useCallback(
    async (ideaId: string) => {
      if (!code) return;
      setIsVoting(true);
      try {
        await apiCastVote({
          code,
          ideaId,
          visitorId,
          action: "remove",
        });
        setVotedIdeas((prev) => {
          const next = new Set(prev);
          next.delete(ideaId);
          return next;
        });
      } finally {
        setIsVoting(false);
      }
    },
    [code, visitorId],
  );

  const toggleVote = useCallback(
    async (ideaId: string, backed: boolean) => {
      if (backed) {
        await unvote(ideaId);
      } else {
        await vote(ideaId);
      }
    },
    [vote, unvote],
  );

  return {
    voteVisible,
    vote,
    unvote,
    isVoting,
    votedIdeas,
    toggleVote,
  };
}

/* ═══════════════════════════════════════════════════════════
   useCoach — request coach via REST + track coach_reply events
   ═══════════════════════════════════════════════════════════ */

export interface UseCoachResult {
  messages: CoachMessage[];
  requestCoach: (persona: CoachPersona) => void;
  loading: boolean;
}

export function useCoach(
  code: string | null,
  ideaId: string | null,
): UseCoachResult {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code || !ideaId) return;

    const off = onCoachReply((payload: CoachReplyPayload) => {
      if (payload.ideaId !== ideaId) return;
      setMessages((prev) => [
        ...prev,
        {
          persona: payload.persona,
          text: payload.text,
          timestamp: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    });

    return off;
  }, [code, ideaId]);

  const requestCoach = useCallback(
    (persona: CoachPersona) => {
      if (!code || !ideaId) return;
      setLoading(true);
      // REST call — server processes and emits coach_reply via socket
      apiRequestCoach({ code, ideaId, persona }).catch(() => {
        setLoading(false);
      });
    },
    [code, ideaId],
  );

  return { messages, requestCoach, loading };
}

/* ═══════════════════════════════════════════════════════════
   useTicker — fetch initial ticker + subscribe to new items
   ═══════════════════════════════════════════════════════════ */

export interface UseTickerResult {
  tickerItems: TickerEntry[];
  pushTicker: (
    badge: string,
    text: string,
    badgeColor?: TickerPayload["badgeColor"],
  ) => void;
}

export function useTicker(code: string | null): UseTickerResult {
  const [tickerItems, setTickerItems] = useState<TickerEntry[]>([]);

  // Initial fetch via REST
  useEffect(() => {
    if (!code) return;
    const controller = new AbortController();
    apiGetTicker(code, controller.signal)
      .then((res) => setTickerItems(res.items))
      .catch(() => {});

    return () => controller.abort();
  }, [code]);

  // Subscribe to new ticker items via socket
  useEffect(() => {
    if (!code) return;

    const off = onTicker((payload: TickerPayload) => {
      setTickerItems((prev) => {
        const newItem: TickerEntry = {
          id: `t-${Date.now()}`,
          badge: payload.badge,
          badgeColor: payload.badgeColor,
          text: payload.text,
        };
        // Keep last 50 items
        return [...prev, newItem].slice(-50);
      });
    });

    return off;
  }, [code]);

  const pushTicker = useCallback(
    (badge: string, text: string, badgeColor?: TickerPayload["badgeColor"]) => {
      if (!code) return;
      emitPushTicker({ code, badge, text, badgeColor }, () => {});
    },
    [code],
  );

  return { tickerItems, pushTicker };
}

/* ═══════════════════════════════════════════════════════════
   useSubmitIdea — submit idea via REST (POST /api/idea)
   or via socket (emit add_idea). Uses socket for realtime push.
   ═══════════════════════════════════════════════════════════ */

export interface UseSubmitIdeaResult {
  submitIdea: (payload: {
    code: string;
    text: string;
    team: string;
    flavour: string;
    author: string;
  }) => Promise<void>;
  editIdea: (ideaId: string, text: string, flavour: string, authorId: string) => Promise<void>;
  isSubmitting: boolean;
}

export function useSubmitIdea(code: string | null): UseSubmitIdeaResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitIdea = useCallback(
    async (payload: {
      code: string;
      text: string;
      team: string;
      flavour: string;
      author: string;
    }) => {
      setIsSubmitting(true);
      try {
        // Emit via socket for realtime push
        emitAddIdea(payload, () => {});
        // Also call REST for persistence + ack
        await apiSubmitIdea(payload);
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const editIdea = useCallback(
    async (ideaId: string, text: string, flavour: string, authorId: string) => {
      if (!code) return;
      setIsSubmitting(true);
      try {
        await apiEditIdea(ideaId, { code, text, flavour, authorId });
      } finally {
        setIsSubmitting(false);
      }
    },
    [code],
  );

  return { submitIdea, editIdea, isSubmitting };
}

/* ═══════════════════════════════════════════════════════════
   useIdeaAdded — subscribe to idea_added events (for big screen)
   Returns the latest added idea for animation triggers.
   ═══════════════════════════════════════════════════════════ */

export function useIdeaAdded(code: string | null): {
  lastAdded: IdeaAddedPayload | null;
} {
  const [lastAdded, setLastAdded] = useState<IdeaAddedPayload | null>(null);

  useEffect(() => {
    if (!code) return;
    const off = onIdeaAdded((payload) => {
      setLastAdded(payload);
    });
    return off;
  }, [code]);

  return { lastAdded };
}

/* ═══════════════════════════════════════════════════════════
   useIdeaUpdated — subscribe to idea_updated events
   ═══════════════════════════════════════════════════════════ */

export function useIdeaUpdated(code: string | null): {
  lastUpdated: IdeaUpdatedPayload | null;
} {
  const [lastUpdated, setLastUpdated] = useState<IdeaUpdatedPayload | null>(null);

  useEffect(() => {
    if (!code) return;
    const off = onIdeaUpdated((payload) => {
      setLastUpdated(payload);
    });
    return off;
  }, [code]);

  return { lastUpdated };
}
