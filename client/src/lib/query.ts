/* ═══════════════════════════════════════════════════════════
   query.ts — TanStack Query client setup
   Sensible defaults: short staleTime for realtime data,
   retry with backoff for transient failures.
   ═══════════════════════════════════════════════════════════ */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /* Realtime data changes via sockets — don't hold stale
         data too long, but don't hammer the server either */
      staleTime: 30_000,
      gcTime: 5 * 60_000,

      /* Retry transient failures with backoff */
      retry: (failureCount, error: unknown) => {
        // Don't retry 4xx (except 429) — the server is working
        // but the request is bad/forbidden
        if (error instanceof ApiError) {
          if (error.status === 429) return failureCount < 3;
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30_000),

      /* Don't refetch on window focus for workshop data —
         sockets handle realtime updates */
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/* Re-export for convenience */
export type { QueryClient } from "@tanstack/react-query";

/* ── Local ApiError type for retry logic ── */
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
