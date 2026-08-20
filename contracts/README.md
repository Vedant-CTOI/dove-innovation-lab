# Contracts — single source of truth (v4)

Two contracts govern this project. They are fundamentally different in who owns them and how they evolve.

## flow.contract.json — IMMUTABLE
The behavioural contract. Derived from the Figma prototype by `ops/figma-flow-extract.py`.
Defines every screen, state, and transition. Machine-checked by `ops/flow-parity.py`.
- **Owner:** human only. Changes require `flow-change:` commit prefix.
- **Read by:** all agents. Written by: none.
- A `flow-change:` commit invalidates Argus's last passing score.

## visual.contract.json — EVOLVABLE
The visual contract. Iris's original design system: colour ramps, type scale, spacing,
radius, elevation, motion, density. Forge may not introduce a literal that isn't resolved here.
- **Owner:** Iris. Versioned bumps with a DESIGN_RATIONALE.md entry.
- **Read by:** all agents. Written by: Iris only.
- `lockedAt` is set when the human picks an art direction (Stage 4).

## visual-bar.md
The rubric Argus scores against. Human-authored; Argus appends scores.
**Merge gate:** ≥90% of available points, zero 0-scores on BLOCKING clauses.

## DESIGN_RATIONALE.md
One sentence per visual decision, citing the clause id it serves. Iris-owned.

## flow.contract.draft.json
The intermediate state. `figma-flow-extract.py` writes this. Human reviews, names
routes/events, sets `signedOffBy`, renames to `flow.contract.json`, commits.
