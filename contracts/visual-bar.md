# Visual Bar — the rubric Argus scores against

"Exceeds Vercel-tier polish" is unenforceable as a sentence. This is the enforceable version. Argus scores each clause 0/1/2 (fail / partial / pass). **Merge gate: total ≥ 90% of available points, with zero 0-scores in any clause marked `BLOCKING`.**

## A. Typography
- **A1 `BLOCKING`** Self-hosted variable fonts, `font-display: swap`, subset, preloaded. No system-font fallback on the happy path.
- **A2** Modular scale from `visual.contract.json`; no ad-hoc font sizes in components.
- **A3** Optical sizing or tighter tracking at ≥32px. Display text never uses body tracking.
- **A4** Measure held to 60–75ch for prose. Tabular numbers on all numeric columns.

## B. Colour
- **B1 `BLOCKING`** Perceptually-derived ramps (OKLCH). No hand-picked hex values in components.
- **B2 `BLOCKING`** Body text ≥4.5:1, large ≥3:1, non-text ≥3:1, in both themes.
- **B3 `BLOCKING`** Dark mode is a distinct token set with its own chroma decisions — not a filter inversion or a lightness flip.
- **B4** Accent used with restraint: no more than ~10% of visible surface area on any default screen.

## C. Form, depth, layout
- **C1** Shadows are layered (≥3 stops) or absent. A single default `box-shadow` is a fail.
- **C2** Nested radii computed (`outer − gap`), never equal to their parent.
- **C3** Optical alignment corrected at the edges of icons, avatars and glyphs — not naive box alignment.
- **C4** Layout on an explicit grid; no magic-number offsets.

## D. Motion
- **D1 `BLOCKING`** Every transition in `flow.contract.json` has a defined duration + easing. Nothing snaps.
- **D2 `BLOCKING`** `prefers-reduced-motion` honoured everywhere.
- **D3** Enter/exit are asymmetric (exit faster than enter).
- **D4** Only `transform`/`opacity`/`filter` animated. No animated layout properties.

## E. State completeness — where most competent apps actually lose
- **E1 `BLOCKING`** Every screen in the contract ships **loading, empty, error**.
- **E2 `BLOCKING`** Every realtime screen ships **offline** and **reconnecting**.
- **E3** Empty states are designed, not a centred grey sentence: they carry an illustration or texture and a primary action.
- **E4** Skeletons match final layout dimensions (see F3).
- **E5** Optimistic UI on socket writes, with a visible rollback treatment on failure.

## F. Craft & performance-as-fidelity
- **F1 `BLOCKING`** `:focus-visible` ring is designed, from `focus.ring`, visible on every interactive element in both themes.
- **F2** LCP ≤ 2.0s on simulated Fast 3G; INP ≤ 200ms.
- **F3 `BLOCKING`** CLS ≤ 0.02.
- **F4 `BLOCKING`** No layout thrash on socket events. High-frequency updates batched to one frame via `requestAnimationFrame`.
- **F5** Cold-start choreography designed (see §8 of crew playbook).
- **F6** Keyboard traversal complete; visible skip-link; correct roles on all custom controls.

## G. Originality — the anti-default clause
- **G1 `BLOCKING`** Shipping an unmodified component-library skin is an automatic fail. Specifically banned as *outputs*: default indigo/violet-on-white, stock `shadcn` radii and shadows untouched, Inter-at-every-size, default Tailwind grey ramp.
- **G2 `BLOCKING`** The visual system must not reproduce the Figma file's palette, type or spacing.
- **G3** Every clause-relevant decision has a one-line justification in `DESIGN_RATIONALE.md`.
- **G4** No cloning of identifiable third-party product layouts. The bar is a set of *qualities*, not a target to replicate.
