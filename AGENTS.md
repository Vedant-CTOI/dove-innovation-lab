# AGENTS.md — project rules for all bots (v4: Generative Visual Design)

## Non-negotiables
1. Contracts in /contracts/ are the source of truth. Two types:
   - flow.contract.json — IMMUTABLE behavioural contract (human-only writes)
   - visual.contract.json — Iris-owned evolvable visual contract
2. Stay inside your write-fence. Need a change outside it? Request via @atlas.
3. Secrets from env vars only. Never in code, never in a commit, never in chat.
4. Small commits, conventional messages, scope prefix: feat(api):, fix(web):.
5. Report honestly. "I could not verify X" beats implying you did.

## Write-fences (v4)

| Path | Owner | Others |
|---|---|---|
| `.figma-cache/**` | **human only** | read-only, no network calls |
| `contracts/flow.contract.json` | **human only** (`flow-change:` commits) | read-only |
| `contracts/visual.contract.json` | Iris | read-only |
| `contracts/visual-bar.md` | human authors; Argus appends scores | read-only |
| `contracts/DESIGN_RATIONALE.md` | Iris | read-only |
| `packages/ui/**`, `assets/**` | Iris | Forge may import, never restyle |
| `apps/web/**` | Forge | — |
| `apps/web/flow.manifest.json` | Forge | Argus + CI read |
| `apps/api/**` | Relay | — |
| `infra/**`, `render.yaml` | Helm | — |
| secrets, `.env.*` | Vault | never printed, never committed |
| `reports/**` | Argus | — |

## FIGMA QUOTA RULE — applies to every bot
`.figma-cache/*.raw.json` is a CACHED snapshot from ONE API call.
- NO BOT CALLS THE FIGMA API. Not once. Not to check. Not to refresh.
- Only a human runs ops/figma-snapshot.py.
- A 429 is never retried. The quota is monthly, not per-minute.
- Only @iris holds a Figma credential. Iris does NOT use it for API calls —
  the PAT exists for provenance and emergencies only.

## Flow contract rule
- flow.contract.json is IMMUTABLE once signed (signedOffBy is set).
- Changes require a `flow-change:` commit prefix and invalidate Argus's last
  passing score.
- No agent writes this file. Ever.
- Forge maintains apps/web/flow.manifest.json as the implementation mirror.
- ops/flow-parity.py is the CI gate: code vs contract.

## Visual contract rule
- visual.contract.json is Iris-owned and evolvable.
- Forge may NOT introduce a colour, spacing, radius, shadow or duration literal
  that isn't resolved from here. Enforced by ESLint.
- Token changes are versioned bumps with a DESIGN_RATIONALE.md entry.
- Iris does not compose screens. Forge does not restyle primitives.
  If Forge needs a value that doesn't exist as a token, that is an Iris ticket.

## Visual quality rule
- contracts/visual-bar.md is the enforceable rubric.
- Argus scores each clause 0/1/2. Merge gate: ≥90%, zero BLOCKING zeros.
- Argus's authority is absolute on visual merges and it may not write code.
- Fonts must be self-hosted and licence-cleared. No Google Fonts CDN in
  production. Vault records the licence per family.

## Stack (amendable only by @atlas)
Frontend  React 18 + TS + Vite, Socket.io-client, tokens from visual.contract.json
Backend   Node 20 + Express + socket.io + zod, single long-lived process
Data      Supabase Postgres, RLS on all user tables
Host      Render.com Web Service, health check /healthz
Repo      npm workspaces monorepo (apps/web, apps/api, packages/ui)

## Definition of done
- flow-parity.py exits 0
- Matches the FROZEN visual contract (no raw literals)
- Handles loading, empty, error, offline states (per flow contract)
- Inputs validated at the boundary
- No secrets in the diff
- @argus scored ≥90% on visual-bar.md with zero BLOCKING zeros
- LCP ≤2.0s, INP ≤200ms, CLS ≤0.02
