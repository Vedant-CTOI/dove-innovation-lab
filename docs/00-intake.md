# 00 — Intake & Build Plan

## Codename
**Dove** — internal codename for this workshop build.

## Brand
**Minute Maid Pulpy Orange (India)** — 50th Anniversary & New Flavour Launch.
Tagline: "Filled With Life at 50" / "Around the Orchard" (big screen name).

## Source of truth
- `contracts/brand-brief.md` — brand tokens, typography, design language, gradients, asset URLs
- `contracts/workshop-features.md` — status machine, routes, socket events, REST endpoints, coach personas, moderator auth, LLM integration
- `contracts/visual-benchmark.md` — what Coke (LA28) and Sprite (NBA) do well, what we must beat, what they do wrong
- `AGENTS.md` — write-fences, stack, non-negotiables, definition of done

## Repo state at intake
- npm workspaces monorepo scaffolded: `client/` + `server/` + `apps/web/`
- `client/src/{components,lib,routes,styles}/.gitkeep` — empty, no code yet
- `server/src/` — empty
- `apps/web/` — empty
- `infra/render.yaml` — exists, targets Starter plan, /api/health, numInstances:1
- No root `package.json` yet — Iris/Relay/Forge each create their workspace package.json
- Git initialized, .gitignore present

## Sequenced build plan

### Phase 1 — IRIS (brand system + canvas + primitives) [GATE: blocks Phase 3]
**Owner:** @iris
**Write-fence:** `client/src/components/**`, `client/src/styles/**`, `client/public/img/**`
**Deliverables:**
1. Tailwind v4 theme config from brand tokens (all 13 colors + 3 gradients + bounce easing)
2. Self-hosted fonts: Baloo 2 (display), Nunito (body), Fredoka (accent) — subset, preload, font-display: swap
3. Canvas particle system: pulp droplets + glow orbs + leaf motes + amber sparks (brand-coded, not generic circles)
4. Component primitives (each with gradient fills, spring/overshoot motion, layered shadows, nested radii, :focus-visible):
   - Button, Card, Badge, Input
   - Timer (animated countdown digits)
   - Ticker (smooth marquee, no clipping)
   - QRCard
   - IdeaCard (with pulp-burst on submit)
   - CoachPanel (collapsed by default)
   - VoteCard (blind — no counts until reveal)
   - RevealCard (ranked, branded animation)
5. Empty states: designed illustration + CTA, not grey text
6. Skeleton states matching final layout dimensions
7. Noise overlay texture on dark surfaces
8. Glass morphism on cards over canvas backdrop
9. `prefers-reduced-motion` honoured everywhere (durations → 0, opacity-only crossfade)

**Acceptance:** All primitives importable from `client/src/components/index.ts`. Tokens resolvable from CSS variables. No raw literals. No Google Fonts CDN. `tsc --noEmit` on client passes.

---

### Phase 2 — RELAY (backend: Express + Socket.IO + status machine + coaches) [parallel with Phase 1]
**Owner:** @relay
**Write-fence:** `server/src/**`
**Deliverables:**
1. Express server with CORS disabled (same-origin), serves `/api/*` REST + Socket.IO
2. In-memory RoomStore (rooms keyed by lowercase code, getOrCreate on write paths)
3. Status machine: `Ideate → Presentation → Vote → Reveal → Completed`
   - Edit blocked when status != Ideate
   - Voting blocked until operator toggles blind-vote visibility
   - Results endpoint returns 403 until status == Reveal
4. All socket events from contract (server→client and client→server) with ack callbacks
5. All REST endpoints from contract
6. Moderator auth: bearer token from `MODERATOR_KEY` env var
7. Zod validation at every boundary — reject early, never echo raw input
8. Socket handshake auth, room-scoped broadcasts (default deny)
9. Rate limiting per socket, payload size cap
10. Coach system: provider-agnostic LLM (auto-detect GEMINI/OPENAI/ANTHROPIC key), 3 personas (Provocateur, Sharpener, Brand Lens), multi-turn per idea, maxOutputTokens ~1024, PROVOCATION OVER EVALUATION
11. SIGTERM handler: stop accepting, flush, disconnect gracefully
12. `GET /api/health` → `{ ok: true, uptime }`
13. Production: serve `client/dist` + SPA fallback from same process

**Acceptance:** `tsc --noEmit` on server passes. Socket e2e test (idea_added, vote_added, workshop_status_changed, ticker) passes. REST e2e (coach, edit, vote permissions, blind voting) passes. Health endpoint returns 200.

---

### Phase 3 — FORGE (screen composition) [GATED on Phase 1 completion]
**Owner:** @forge
**Write-fence:** `client/src/routes/**`, `client/src/lib/**`, `scripts/**`
**Deliverables:**
1. Vite + React 19 + TanStack Router + TanStack Query + Tailwind v4 + Framer Motion + GSAP setup
2. Routes:
   - `/` — Landing (branded hero, room code input, dual CTA: big screen + participant)
   - `/workshops/:id/screen` — Big Screen (operator console + live idea wall + ticker + timer + QR)
   - `/workshops/:id/participants` — Participant (team selection → idea submission → voting)
   - `/workshops/:id/control` — Moderator operator console
3. Socket.io-client singleton in `src/lib/socket.ts` — hooks subscribe, components never construct
4. TanStack Query for REST state; socket events invalidate/refetch queries
5. Every screen ships: loading, empty, error, offline/reconnecting, stale states
6. Framer Motion page transitions, staggered card entrances, layout animations
7. Pulp-burst particle explosion on idea submission (from Iris primitive)
8. Blind voting UI — participant sees only own Back/Backed state
9. Reveal screen: ranked cards + branded confetti animation
10. PPT export button (moderator-only, appears at Reveal)
11. Operator Console: numbered phase flow, blind-vote toggle, timer, ticker push
12. Ticker: smooth marquee, branded badge per event type, no clipping
13. CoachPanel: collapsed by default, 3 personas, multi-turn conversation
14. Keyboard navigation, focus management, labelled controls on every route
15. `prefers-reduced-motion` honoured

**Acceptance:** `tsc --noEmit` passes. `npm run build` passes. All routes render. Socket events wire correctly. All states visible. No raw design literals (everything from Iris tokens).

---

### Phase 4 — HELM (deploy config) [can start in parallel with Phase 2]
**Owner:** @helm
**Write-fence:** `infra/**`, `render.yaml`
**Deliverables:**
1. `render.yaml` blueprint verified: Starter plan, /api/health, numInstances:1, Node 20
2. Single-service topology: Express serves client/dist + SPA fallback + Socket.IO, same-origin
3. Env vars: PORT, MODERATOR_KEY (generateValue), exactly one LLM key (sync: false)
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Verify build locally with production env before touching Render
7. After deploy: prove /api/health 200, socket round-trips, one REST call succeeds, reconnect survives redeploy

**Acceptance:** `render.yaml` valid. Local production build succeeds. Deployed instance healthy.

---

### Phase 5 — INTEGRATE & GATE (Atlas)
1. Verify Iris primitives + Relay backend + Forge screens compose
2. `npx tsc --noEmit` exits 0 (both client and server)
3. `npm run build` exits 0
4. Socket e2e test passes
5. Feature e2e over REST passes
6. Screenshots of every route + every status, 0 console errors
7. LCP ≤ 2.0s, CLS ≤ 0.02

---

### Phase 6 — SHIP (after Argus sign-off)
1. Hand to @argus for visual review → SHIP verdict
2. Hand to @helm for final deploy
3. Report to @user

## Delegation order
1. **Iris + Relay in parallel** — no dependencies between them
2. **Forge after Iris gate** — Forge needs primitives + tokens before composing screens
3. **Helm in parallel with Relay** — render.yaml mostly exists, needs verification
4. **Integration after Forge** — Atlas composes and gates
5. **Ship after Argus** — visual review is the final gate

## Gate summary
| Gate | Condition | Owner |
|---|---|---|
| G1 | Iris primitives + tokens delivered | Iris |
| G2 | Relay backend passes e2e | Relay |
| G3 | Forge screens compose + build passes | Forge |
| G4 | tsc 0, build 0, socket e2e, REST e2e | Atlas |
| G5 | Visual review SHIP | Argus |
| G6 | Deployed, /api/health 200 | Helm |

## Risks
- **No root package.json** — first delegate (Iris or Relay) must create it with workspaces config
- **Font licensing** — Baloo 2, Nunito, Fredoka are OFL licensed via Google Fonts; self-host requires downloading the variable font files
- **LLM key** — build needs at least one of GEMINI/OPENAI/ANTHROPIC keys for coach testing; escalate to @user if none available
- **Single instance** — in-memory RoomStore means numInstances must stay 1
