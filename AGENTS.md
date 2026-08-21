# AGENTS.md — Workshop Generation System (v5: Generative Workshop Platform)

## Mission
Generate fresh, standalone, full-stack branded workshop platforms that beat the visual
quality of the Coke (LA28) and Sprite (NBA) Vercel reference apps. Each build is a
complete npm workspaces monorepo: React 19 + Vite + TanStack Router/Query + Tailwind v4 +
Framer Motion client, Express + Socket.IO + TypeScript server, deployed to Render.

## Non-negotiables
1. Contracts in /contracts/ are the source of truth. Read before writing.
2. Stay inside your write-fence. Need a change outside it? Request via @atlas.
3. Secrets from env vars only. Never in code, never in a commit, never in chat.
4. Small commits, conventional messages, scope prefix: feat(client):, fix(server):.
5. Report honestly. "I could not verify X" beats implying you did.
6. Backend status machine is sacred: Ideate → Presentation → Vote → Reveal → Completed.
   Never break the socket event mapping, query keys, mutations, hooks, or types.

## Write-fences

| Path | Owner | Others |
|---|---|---|
| `contracts/**` | Atlas (freezes) / Iris (visual) | read-only |
| `client/src/components/**` | Iris (primitives, canvas, motion) | Forge imports, never restyles |
| `client/src/styles/**` | Iris | read-only |
| `client/public/img/**` | Iris (brand assets) | — |
| `client/src/routes/**` | Forge | — |
| `client/src/lib/**` | Forge (hooks, queries, mutations, socket) | — |
| `server/src/**` | Relay | — |
| `scripts/**` | Argus / Forge (verification scripts) | — |
| `infra/**`, `render.yaml` | Helm | — |
| `shots/**` | Argus (screenshots) | — |
| `docs/**` | Atlas | — |

## Stack (amendable only by @atlas)
- Frontend: React 19 + TypeScript + Vite + TanStack Router/Query + Tailwind v4 + Framer Motion + GSAP
- Backend: Node 20+ + Express + Socket.IO + TypeScript + zod, single long-lived process
- Deploy: Render.com Web Service (Starter plan, /api/health, numInstances: 1)
- Repo: npm workspaces monorepo (client + server)

## Workshop feature contract (what "done" means)
Every build must ship ALL of these — a realtime idea-feed alone is NOT enough:

1. **Landing page** — branded hero, room code input, dual CTA (big screen + participant)
2. **Team selection** — pick a team before entering the workshop
3. **Live idea wall** — participant submissions land on big screen via socket
4. **Multi-persona AI coaching** — 3 personas, conversational (multi-turn), server-side.
   PROVOCATION OVER EVALUATION — coaches expand/provoke/reframe, NEVER score or rank.
5. **Blind live voting** — vote counts HIDDEN until Reveal, behind admin toggle.
   Participant sees only their own "Back it / Backed" state.
6. **Idea edit & re-save** — author-only, only while status == Ideate. Edits broadcast live.
7. **Operator Console** — numbered phase flow, blind-vote toggle, timer, ticker push
8. **Live activity ticker** — captures every idea / vote / phase change
9. **Status machine** — Ideate → Presentation → Vote → Reveal → Completed
10. **QR code** — big screen shows QR for participant join
11. **Timer** — moderator sets duration, starts on phase trigger, displays on big screen
12. **Reveal screen** — ranked results with branded animation
13. **PPT export** — moderator-only, generates branded deck from workshop data

## Visual quality bar
- Must beat Coke (LA28) and Sprite (NBA) reference apps in: visual fidelity, motion
  design, UI animations, page transitions, loading states, button interactions.
- Brand colors hardcoded (not from backend PrimaryColor).
- Self-hosted fonts (no Google Fonts CDN in production).
- Canvas particle system brand-coded to the specific brand.
- Dark cinematic big screen + light/branded participant view.
- Every screen ships loading, empty, error, offline states.
- :focus-visible designed, keyboard navigation complete.
- prefers-reduced-motion honoured everywhere.

## Reference apps (for benchmarking, NOT copying)
- Coke: https://coke-workshop.vercel.app/ (landing, team selection, animations)
- Sprite: https://sprite-nba-workshop-26.vercel.app/ (full flow incl. voting)
- Local copies: ~/Downloads/BaseCamp/coke-la28-workshop/ and sprite-nba-workshop/

## Definition of done
- `npx tsc --noEmit` exits 0 (both client and server)
- `npm run build` exits 0
- Socket e2e test passes (idea_added, vote_added, workshop_status_changed, ticker)
- Feature e2e over REST passes (coach, edit, vote permissions, blind voting)
- Screenshots of every route + every status, 0 console errors
- Visual review: SHIP verdict from Argus
- LCP ≤ 2.0s, CLS ≤ 0.02
- Deployed to Render, /api/health returns 200
