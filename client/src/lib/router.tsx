/* ═══════════════════════════════════════════════════════════
   router.tsx — TanStack Router setup
   Route tree for all 4 routes, Framer Motion page transitions
   (AnimatePresence), TanStack Router devtools in dev only.
   ═══════════════════════════════════════════════════════════ */

import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { LandingPage } from "../routes/landing";
import { BigScreen } from "../routes/screen";
import { ParticipantPage } from "../routes/participants";
import { ControlPage } from "../routes/control";
import { ErrorState } from "./states";
import { Button, Badge } from "../components";
import { DURATION, EASE_BOUNCE } from "../components/motion";

/* ── Root route component ──
   Wraps Outlet in AnimatePresence for page transitions.
   Devtools rendered in dev only. */
function RootComponent() {
  const prefersReduced = useReducedMotion();
  const location = useRouterState({ select: (s) => s.location });

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: DURATION.base, ease: EASE_BOUNCE }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {/* TanStack Router Devtools — dev only */}
      {import.meta.env.DEV && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </>
  );
}

/* ── 404 Not Found component ── */
function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center flex flex-col items-center gap-4">
        <Badge variant="berry" size="md">404</Badge>
        <h1 className="font-display text-3xl font-bold text-juice-gradient">
          Page Not Found
        </h1>
        <p className="font-body text-sm text-cream/50 max-w-sm">
          This page doesn't exist. The orchard is vast, but not that vast.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => window.location.href = "/"}
          aria-label="Go back to landing page"
        >
          ← Back to Landing
        </Button>
      </div>
    </div>
  );
}

/* ── Error boundary component ── */
function ErrorComponent({ error }: { error: Error }) {
  return (
    <ErrorState
      title="Something broke"
      message={error.message || "An unexpected error occurred."}
      onRetry={() => window.location.reload()}
    />
  );
}

/* ── Route definitions ── */
const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const screenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workshops/$id/screen",
  component: BigScreen,
});

const participantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workshops/$id/participants",
  component: ParticipantPage,
});

const controlRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workshops/$id/control",
  component: ControlPage,
});

/* ── Route tree ── */
const routeTree = rootRoute.addChildren([
  landingRoute,
  screenRoute,
  participantsRoute,
  controlRoute,
]);

/* ── Router instance ── */
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingMs: 200,
});

/* ── Type registration for type-safe navigation ── */
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
