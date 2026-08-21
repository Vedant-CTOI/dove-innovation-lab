/* ═══════════════════════════════════════════════════════════
   landing.tsx — Landing page (/)
   Branded hero, room code input, dual CTA (big screen + participant).
   Dark cinematic. Uses Iris Button, Card, Input, Badge, ParticleField.
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  Button,
  Card,
  Input,
  Badge,
  ParticleField,
} from "../components";
import { DURATION, EASE_BOUNCE } from "../components/motion";
import { PageTransition, OfflineBanner } from "../lib/states";
import { useSocket } from "../lib/hooks";
import { BRAND_NAME, WORKSHOP_TITLE, BRAND_TAGLINE } from "../lib/constants";

export function LandingPage() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const [code, setCode] = useState("");
  const { isConnected, isReconnecting } = useSocket();

  // Ensure dark theme for cinematic landing
  useEffect(() => {
    document.documentElement.classList.remove("theme-light");
    document.documentElement.classList.add("theme-dark");
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const cleanCode = code.trim().toUpperCase();

  const goBigScreen = () => {
    if (!cleanCode) return;
    navigate({ to: "/workshops/$id/screen", params: { id: cleanCode } });
  };

  const goParticipant = () => {
    if (!cleanCode) return;
    navigate({ to: "/workshops/$id/participants", params: { id: cleanCode } });
  };

  return (
    <>
      <OfflineBanner show={!isConnected} message={isReconnecting ? "Reconnecting…" : "Offline"} />
      <ParticleField density={0.8} interactive />
      <PageTransition>
        <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
          {/* Content */}
          <div className="relative z-10 max-w-2xl w-full flex flex-col items-center gap-8">
            {/* Brand badge */}
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.9 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: DURATION.base, ease: EASE_BOUNCE }}
            >
              <Badge variant="pulp" size="md" pulse>
                {BRAND_NAME} · 50th Anniversary
              </Badge>
            </motion.div>

            {/* Hero title */}
            <div className="text-center">
              <motion.h1
                className="font-display text-5xl md:text-7xl font-extrabold text-juice-gradient leading-tight"
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.95 }}
                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: DURATION.slow, ease: EASE_BOUNCE, delay: 0.1 }}
              >
                {WORKSHOP_TITLE}
              </motion.h1>
              <motion.p
                className="font-body text-lg md:text-xl text-cream/60 mt-3"
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: DURATION.base }}
              >
                {BRAND_TAGLINE}
              </motion.p>
            </div>

            {/* Room code + CTAs */}
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: DURATION.base, ease: EASE_BOUNCE }}
              className="w-full"
            >
              <Card variant="glass" padding="lg">
                <div className="relative z-10 flex flex-col gap-4" style={{ borderRadius: "calc(var(--radius-lg) - var(--radius-gap))" }}>
                  <Input
                    label="Room Code"
                    placeholder="Enter your room code…"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    size="lg"
                    hint="Ask your facilitator for the 4-letter room code"
                    autoFocus
                    maxLength={6}
                    aria-label="Workshop room code"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") goParticipant();
                    }}
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={goBigScreen}
                      disabled={!cleanCode}
                      className="flex-1"
                      aria-label="Open big screen view"
                    >
                      📺 Big Screen
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={goParticipant}
                      disabled={!cleanCode}
                      className="flex-1"
                      aria-label="Join as participant"
                    >
                      📱 Join as Participant
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Footer tagline */}
            <motion.p
              className="font-body text-xs text-cream/30"
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: DURATION.base }}
            >
              Shake it up · Bounce back with every gulp!
            </motion.p>
          </div>
        </div>
      </PageTransition>
    </>
  );
}
