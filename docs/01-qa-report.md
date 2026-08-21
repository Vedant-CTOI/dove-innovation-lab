# QA Report — Minute Maid Pulpy Orange Workshop (Dove)

**Reviewer:** @argus (QA & Visual Adversary)
**Date:** 2026-08-21
**Verdict:** 🔴 **FIX** — 3× P1 blockers prevent merge

---

## Executive Summary

The app has a strong visual design system — brand-coded canvas particles, self-hosted fonts, spring/overshoot motion, glass morphism, noise overlay, the ownable pulp-burst asset, and layered shadows with nested radii. The backend is solid: status machine, socket relay, authorisation, blind voting, and coach system all pass e2e. **However, three P1 bugs block the merge:** the Ticker component crashes on every page (API field mismatch), the production server doesn't serve static files (NODE_ENV not set), and the QR code is a non-functional placeholder canvas.

---

## Test Results

| Test | Result | Details |
|---|---|---|
| `npx tsc --noEmit` (client) | ✅ PASS | Exit 0, no errors |
| `npx tsc --noEmit` (server) | ✅ PASS | Exit 0, no errors |
| `npm run build` (both) | ✅ PASS | Exit 0. Client: 639 modules, 551KB JS (gzip 172KB) |
| Socket e2e | ✅ 24/24 PASS | All broadcasts verified, edit blocked at non-Ideate, 401/403 auth |
| REST e2e | ✅ 20/20 PASS | All endpoints, permissions, status transitions, coach fallback |
| Screenshots | ⚠ 20 captured, ALL with console errors | See P1/P2 findings below |
| 0 console errors | ❌ FAIL | Every screenshot has 3-5 console errors |

---

## P1 — Blockers (BLOCK MERGE)

### P1-1: Ticker component crashes on every page (`TypeError: t is not iterable`)

- **Element:** Ticker component crashes during render with `TypeError: t is not iterable`
- **Problem:** `client/src/lib/api.ts` `getTicker()` expects response field `items` (via `TickerResponse` type), but `server/src/rest.ts` returns `{ ok: true, ticker: [...] }` — field name is `ticker`, not `items`. The `useTicker` hook does `setTickerItems(res.items)` → state becomes `undefined` → Ticker component does `[...items, ...items]` → crash.
- **File:** `client/src/lib/api.ts` (line 160, `getTicker`) + `server/src/rest.ts` (line 364, returns `ticker` field)
- **Expected:** API response field name matches what the client expects (`items` or `ticker` — pick one)
- **Observed:** Server returns `ticker`, client reads `items` → `undefined` → TypeError on every page with a Ticker (Big Screen × 5, Control Console × 5, Empty Screen × 1)
- **Owning bot:** **Forge** (client/src/lib) / **Relay** (server/src/rest.ts)

### P1-2: Production server does not serve static files

- **Element:** Server root URL returns "Cannot GET /" — no SPA, no CSS, no JS, no fonts, no images
- **Problem:** `server/src/index.ts` line 57: `if (isProduction && fs.existsSync(clientDist))` — `isProduction` is `process.env.NODE_ENV === "production"`. The running server on `localhost:3000` does NOT have `NODE_ENV=production` set. The Render deployment (`dove-innovation-lab.onrender.com`) also returns 404 on root URL (uptime 269s, health 200).
- **File:** `server/src/index.ts` (line 27, 57)
- **Expected:** Production server serves `client/dist/` + SPA fallback for all non-API routes
- **Observed:** `curl http://localhost:3000/` → "Cannot GET /". `curl https://dove-innovation-lab.onrender.com/` → 404. App is inaccessible in production.
- **Note:** `infra/render.yaml` sets `NODE_ENV: production`, but the live deployment doesn't reflect this. Either stale deployment or startCommand doesn't propagate the env.
- **Owning bot:** **Helm** (deploy/infra) / **Relay** (server)

### P1-3: QR code is non-functional placeholder

- **Element:** QRCard renders a blank dark canvas with a radial gradient — no actual QR code
- **Problem:** `client/src/components/QRCard.tsx` lines 43-63 draw a placeholder background only. The code comment says "For production, qr-code-styling library would draw here" but it never does. The `qr-code-styling` package is in `client/package.json` dependencies but is never imported or used.
- **File:** `client/src/components/QRCard.tsx` (lines 38-64)
- **Expected:** Scannable QR code encoding the participant join URL
- **Observed:** Black square with golden radial gradient — cannot be scanned
- **Owning bot:** **Iris** (visual/primitives)

---

## P2 — Major

### P2-1: `theme-dark:` / `theme-light:` Tailwind variants not configured

- **Element:** Input fields on dark theme have white backgrounds and dark text instead of dark backgrounds and light text
- **Problem:** `Input.tsx` uses `theme-dark:bg-ink/60`, `theme-dark:text-cream`, `theme-dark:placeholder:text-cream/30`, etc. These are NOT configured as custom variants in Tailwind v4. The compiled CSS (`client/dist/assets/index-Bzj4kLB7.css`) contains 0 instances of `theme-dark:` or `theme-light:` utility classes. All these classes are silently dropped.
- **File:** `client/src/components/Input.tsx` (lines 47, 54, 62, 71, 84, 92) + `client/src/components/Skeleton.tsx` (line 82)
- **Expected:** Inputs adapt to dark/light theme (dark bg + cream text on dark pages)
- **Observed:** All inputs use `bg-white/80` + `text-ink` regardless of theme. On dark pages (landing, control console), inputs are bright white boxes with dark text — visually inconsistent with the glass morphism design language.
- **Fix:** Add `@custom-variant theme-dark (&:where(.theme-dark, .theme-dark *));` to `globals.css` (Tailwind v4 syntax), or use the built-in `dark:` variant with a custom selector.
- **Owning bot:** **Iris** (visual/primitives)

### P2-2: 401 console error on every non-moderator page

- **Element:** `useStatus` hook calls `/api/moderator/state` without checking for moderator token
- **Problem:** `client/src/lib/hooks.ts` `useStatus()` (line 296) calls `apiGetRoomState(code)` on every route. The `api.ts` `request()` helper attaches the moderator token from localStorage IF available, but on non-moderator views (big screen, participant), no token exists → server returns 401 → browser logs console error.
- **File:** `client/src/lib/hooks.ts` (useStatus, line 296)
- **Expected:** Only call `/api/moderator/state` when a moderator token is available
- **Observed:** Every non-moderator page generates a 401 console error. The `.catch()` handler suppresses the app-level error, but the browser network layer still logs it.
- **Owning bot:** **Forge** (client/src/lib)

### P2-3: PPT export endpoint missing

- **Element:** PPT export button calls `POST /api/moderator/export-ppt` which doesn't exist
- **Problem:** `client/src/lib/api.ts` (line 167) defines `exportPpt()` calling `POST /api/moderator/export-ppt`. The server's `rest.ts` does NOT register this endpoint. The export button appears at Reveal phase but clicking it would return 404.
- **File:** `client/src/lib/api.ts` (line 167) + `server/src/rest.ts` (missing endpoint)
- **Expected:** `POST /api/moderator/export-ppt` generates a branded PowerPoint deck
- **Observed:** 404 — endpoint not implemented
- **Owning bot:** **Relay** (server)

---

## P3 — Minor

### P3-1: Bundle size exceeds 500KB

- **Element:** Client JS bundle is 551KB (gzip: 172KB)
- **Problem:** No code splitting configured. Vite warns about chunk size. Could impact LCP on slow connections.
- **File:** `client/vite.config.ts` (no `manualChunks` config)
- **Owning bot:** **Forge** (client)

### P3-2: Screen.tsx error message contains non-English text

- **Element:** Error state message: `"The orchard is暂时 unreachable. Try again?"` — contains Chinese characters "暂时" (temporarily)
- **Problem:** Copy-paste artifact in error message text
- **File:** `client/src/routes/screen.tsx` (line 92)
- **Owning bot:** **Forge** (client/routes)

---

## Visual Fidelity Assessment

### What beats Coke/Sprite (verified from source code)

| Benchmark item | Status | Evidence |
|---|---|---|
| Self-hosted fonts (no Google CDN) | ✅ | `fonts.css` — 17 `@font-face` declarations, Baloo 2 + Nunito + Fredoka, `font-display: swap`, unicode-range subset, preloaded in `index.html` |
| Brand-coded canvas particles | ✅ | `particles.ts` — 4 distinct shapes: pulp droplets (teardrop + gradient), glow orbs (radial pulse), leaf motes (leaf + vein), amber sparks (glow halo + core). NOT generic circles. |
| Pulp burst ownable asset | ✅ | `PulpBurst.tsx` — 16-24 tapered golden-yellow shards exploding radially with ease-out cubic, central glow, shadow blur. Used on idea submission. |
| Signature gradients | ✅ | `brand-tokens.css` — juice gradient (160deg gold→orange→dark), pulp gradient (radial light→gold→orange→deep), night gradient (dark blue→night) |
| Spring/overshoot easing | ✅ | `motion.ts` — `EASE_BOUNCE = [0.34, 1.56, 0.64, 1]`, spring configs (stiffness/damping), `useReducedMotion` everywhere |
| Glass morphism | ✅ | `globals.css` `.glass` — `backdrop-filter: blur(16px) saturate(1.4)`, brand-tinted border, theme-specific overrides |
| Noise overlay texture | ✅ | `globals.css` `.noise-overlay` — SVG fractal noise, `mix-blend-mode: overlay`, `opacity: 0.04` |
| Dark cinematic big screen | ✅ | `brand-tokens.css` — Night `#0A0F14` base with `--gradient-mm-night` (not flat black) |
| Light/branded participant | ✅ | Cream `#F8E0A8` background, orange-dark text |
| Ticker no clipping | ✅ | `Ticker.tsx` — `overflow-visible`, gradient fade edges, duplicate track for seamless loop. Directly addresses Coke/Sprite ticker clipping bug. |
| Staggered card entrance | ✅ | `useStaggerContainer` + `useStaggerItem` with `popLayout` mode |
| Confetti on reveal | ✅ | `RevealCard.tsx` — branded colors (#FCBC00, #F08810, #FFE08A, #DC8800, #008040), rect + tri shapes, gravity physics |
| Timer animated digits | ✅ | `Timer.tsx` — `DigitPair` with `AnimatePresence` popLayout, bounce on tick, pulse on low time |
| Button hover: scale + shadow | ✅ | `Button.tsx` — `useBounceHover` variants (rest/hover/tap), scale 1.04/0.96, shadow shift |
| Page transitions | ✅ | `PageTransition` wrapper with Framer Motion (opacity + y) |
| Loading: branded skeleton | ✅ | `Skeleton.tsx` — pulp droplet shimmer (falling orange gradient), `SkeletonIdeaCard`, `SkeletonQRCard`, `SkeletonGrid` |
| Empty: illustration + CTA | ✅ | `EmptyState.tsx` — branded SVG illustration, title, description, CTA button, glass morphism |
| Error: branded + actionable | ✅ | `ErrorState` — 🍊 emoji, berry badge, retry button, glass card |
| Offline/reconnecting | ✅ | `OfflineBanner` — sticky top, pulsing dot, `role="status"`, `aria-live="polite"` |
| Stale indicator | ✅ | `StaleIndicator` — pulsing dot, "Updating" label |
| Focus-visible designed | ✅ | `globals.css` — 3px solid pulp-gold, offset 2px, light variant (pulp-light) |
| Reduced motion | ✅ | CSS media query (all durations → 0ms) + Framer Motion `useReducedMotion` on every animated component |
| Numbered phase flow | ✅ | `StatusFlow` — 5 phases with checkmarks, current highlight, locked future |
| Collapsed coach panel | ✅ | `CoachPanel.tsx` — collapsed by default, expand/collapse with chevron rotation |
| Blind voting UI | ✅ | `VoteCard` — only shows "Back it/Backed", "Blind" indicator, counts hidden until `revealed` |
| Layered shadows (≥3 stops) | ✅ | All cards, buttons, badges have 3-4 stop shadows (brand-tinted) |
| Nested radii | ✅ | `--radius-gap: 4px`, `calc(var(--radius-lg) - var(--radius-gap))` on all inner content |

### What does NOT beat Coke/Sprite

| Issue | Impact |
|---|---|
| Ticker crashes (P1-1) | Cannot assess ticker visual quality — it doesn't render |
| QR code non-functional (P1-3) | Cannot assess QR visual quality — it's a blank square |
| Input fields don't adapt to dark theme (P2-1) | Bright white inputs on dark pages — Coke/Sprite have theme-consistent inputs |
| Production server broken (P1-2) | Cannot verify production visual fidelity at all |

### Visual verdict: **Cannot SHIP** — P1 bugs prevent visual assessment of 3 major components (Ticker, QR, production rendering). The design system is strong, but I cannot certify it beats Coke/Sprite when critical UI elements crash.

---

## States Coverage

| State | Screen | Participant | Control |
|---|---|---|---|
| Loading | ✅ `LoadingState` (branded skeleton) | ✅ `LoadingState` | ✅ `LoadingState` |
| Empty | ✅ `EmptyStateScreen` (illustration + CTA) | ✅ `EmptyStateScreen` | ✅ "No ideas submitted yet" |
| Error | ✅ `ErrorState` (branded + retry) | ✅ `ErrorState` | ✅ `ErrorState` |
| Offline | ✅ `OfflineBanner` | ✅ `OfflineBanner` | ✅ `OfflineBanner` |
| Reconnecting | ✅ `OfflineBanner` (message swap) | ✅ `OfflineBanner` | ✅ `OfflineBanner` |
| Stale | ✅ `StaleIndicator` | ✅ `StaleIndicator` | ✅ `StaleIndicator` |
| Ideate | ✅ screenshot | ✅ screenshot | ✅ screenshot |
| Presentation | ✅ screenshot | ✅ screenshot | ✅ screenshot |
| Vote | ✅ screenshot | ✅ screenshot | ✅ screenshot |
| Reveal | ✅ screenshot | ✅ screenshot | ✅ screenshot |
| Completed | ✅ screenshot | ✅ screenshot | ✅ screenshot |

---

## Feature Contract Checklist

| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | Landing page | ✅ | Branded hero, room code input, dual CTA, particle field |
| 2 | Team selection | ✅ | 4 teams, branded cards, name + team selection |
| 3 | Live idea wall | ✅ | Socket relay verified (idea_added broadcast), staggered cards |
| 4 | Multi-persona coaching | ✅ | 3 personas, multi-turn, PROVOCATION OVER EVALUATION, provider-agnostic |
| 5 | Blind voting | ✅ | Vote counts hidden, participant sees own state, operator toggle |
| 6 | Idea edit & re-save | ✅ | Author-only, Ideate-only, 403 on wrong author + wrong phase |
| 7 | Operator Console | ✅ | Numbered phases, vote toggle, timer, ticker push |
| 8 | Live ticker | ❌ P1 | Component crashes — field mismatch `ticker` vs `items` |
| 9 | Status machine | ✅ | Ideate → Presentation → Vote → Reveal → Completed, forward transitions verified |
| 10 | QR code | ❌ P1 | Non-functional placeholder canvas |
| 11 | Timer | ✅ | Presets, start/stop, animated digits, branded gradient |
| 12 | Reveal screen | ✅ | Ranked cards, confetti, pulp glow, staggered entrance |
| 13 | PPT export | ❌ P2 | Button exists but endpoint missing (404) |

---

## A11y Audit

| Check | Status | Evidence |
|---|---|---|
| Keyboard traversal | ✅ | All interactive elements are buttons/inputs, focus-visible designed |
| Visible focus | ✅ | 3px solid pulp-gold outline, offset 2px, theme-specific |
| Labelled controls | ✅ | All inputs have `<label>`, all buttons have `aria-label` |
| Reduced motion | ✅ | CSS media query + Framer Motion `useReducedMotion` on every component |
| ARIA roles | ✅ | `role="status"` (offline), `role="timer"` (timer), `role="switch"` (vote toggle), `role="marquee"` (ticker), `aria-expanded` (coach panel), `aria-live="polite"` (offline banner) |
| `aria-pressed` | ✅ | Team selection buttons |
| `aria-checked` | ✅ | Vote visibility toggle |

---

## Performance

| Metric | Status | Notes |
|---|---|---|
| LCP | ⚠ Could not measure | Could not run Lighthouse (browser_exec unavailable). Fonts preloaded (good for LCP). Bundle 551KB (above 500KB — no code splitting). |
| CLS | ⚠ Likely fails | Ticker crash causes layout shift. Skeleton states should mitigate CLS on async surfaces. |
| Bundle size | ⚠ 551KB (172KB gzip) | Above 500KB Vite warning threshold. No `manualChunks` config. |

---

## What I Could NOT Verify

1. **Production visual fidelity** — Server doesn't serve static files (P1-2). Screenshots taken via a local static proxy server. Could not verify production rendering on Render.
2. **Real-time socket relay in production** — Screenshots taken without socket.io (static server). Socket e2e verified separately (24/24 pass), but not in a browser context.
3. **Lighthouse metrics** (LCP, CLS) — Could not run performance audits. browser_exec unavailable.
4. **Live visual comparison with Coke/Sprite** — Could not view screenshots (no vision capability). Assessment based on source code review only.
5. **PPT export** — Endpoint doesn't exist (P2-3). Cannot verify.
6. **QR code scanning** — Non-functional (P1-3). Cannot verify.

---

## Screenshots

20 screenshots saved to `shots/`:
- `01-landing.png` — Landing page
- `02-screen-{ideate,presentation,vote,reveal,completed}.png` — Big Screen × 5 statuses
- `03-participant-{teamselect,ideate,presentation,vote,reveal,completed}.png` — Participant × 6 states
- `04-control-{auth,ideate,presentation,vote,reveal,completed}.png` — Control × 6 states
- `05-empty-{screen,participant}.png` — Empty states

**All screenshots have console errors** (3-5 per page) — see P1-1 (ticker crash), P2-2 (401), and WebSocket connection failures (artifact of screenshot setup, not a production bug).

---

## Defect Summary

| # | Sev | Element | File | Owning Bot |
|---|---|---|---|---|
| P1-1 | P1 | Ticker crashes (`TypeError: t is not iterable`) | `client/src/lib/api.ts` + `server/src/rest.ts` | Forge / Relay |
| P1-2 | P1 | Production server doesn't serve static files | `server/src/index.ts` | Helm / Relay |
| P1-3 | P1 | QR code is non-functional placeholder | `client/src/components/QRCard.tsx` | Iris |
| P2-1 | P2 | `theme-dark:` variants not configured in Tailwind v4 | `client/src/components/Input.tsx` + `Skeleton.tsx` | Iris |
| P2-2 | P2 | 401 console error on non-moderator pages | `client/src/lib/hooks.ts` (useStatus) | Forge |
| P2-3 | P2 | PPT export endpoint missing | `client/src/lib/api.ts` + `server/src/rest.ts` | Relay |
| P3-1 | P3 | Bundle size 551KB, no code splitting | `client/vite.config.ts` | Forge |
| P3-2 | P3 | Chinese characters in error message | `client/src/routes/screen.tsx:92` | Forge |

---

## Verdict: 🔴 FIX

**3× P1 blockers prevent merge.** The design system is strong and would likely beat Coke/Sprite once bugs are fixed, but I cannot certify SHIP with:
- A component that crashes on every page (Ticker)
- A production server that doesn't serve the app
- A non-functional QR code (core feature #10)

**Required fixes before re-review:**
1. Fix ticker field mismatch: change `server/src/rest.ts` line 364 `ticker` → `items`, OR change `client/src/lib/types.ts` `TickerResponse.items` → `ticker` + update `hooks.ts`
2. Set `NODE_ENV=production` on the running server (or remove the `isProduction` guard)
3. Implement actual QR code generation in `QRCard.tsx` using the `qr-code-styling` dependency
4. Add `@custom-variant theme-dark (&:where(.theme-dark, .theme-dark *));` to `globals.css`
5. Guard `useStatus` to only call `/api/moderator/state` when `getModeratorToken()` returns non-null
6. Implement `POST /api/moderator/export-ppt` endpoint
