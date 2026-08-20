# AGENTS.md — project rules for all bots

## Non-negotiables
1. Contracts in /contracts/ are the source of truth. Read before writing. Never
   implement against a DRAFT contract. Never silently diverge from a FROZEN one.
2. Stay inside your write-fence. Need a change outside it? Request via @atlas.
3. Secrets from env vars only. Never in code, never in a commit, never in chat.
4. Small commits, conventional messages, scope prefix: feat(api):, fix(web):.
5. Report honestly. "I could not verify X" beats implying you did.

## FIGMA QUOTA RULE — applies to every bot
intake/figma-api/file.json is a CACHED snapshot from ONE API call. Free-plan files
allow only a handful of reads per MONTH.
- NO BOT CALLS THE FIGMA API. Not once. Not to check. Not to refresh.
- Only a human runs ops/figma-snapshot.py.
- A 429 is never retried. The quota is monthly, not per-minute.
- Only @iris interprets the snapshot. Only @iris holds a Figma credential.

## Design provenance rule
Every token in tokens.json is tagged NAMED | EXTRACTED | STATED | DERIVED |
INFERRED | ASSUMED.
- Never present an ASSUMED value as fact, in code, docs or chat.
- Never "improve" a token outside @iris's fence. Report it instead.
- NAMED tokens use the designer's own vocabulary. Do not rename them.

## Stack (amendable only by @atlas)
Frontend  React 18 + TS + Vite, Socket.io-client, tokens.css
Backend   Node 20 + Express + socket.io + zod, single long-lived process
Data      Supabase Postgres, RLS on all user tables
Host      Render.com Web Service, health check /healthz
Repo      npm workspaces monorepo

## Reference material rules
intake/figma-api/file.json → Design source of truth. @iris interprets, offline.
intake/figma/*.png         → Visual cross-check only. JSON wins on values.
intake/vercel-examples/    → Mine for logic, validation, data access. Do NOT copy
                             serverless handler shapes; our runtime is persistent.
intake/architecture/       → Intent, not gospel. Conflicts with Render/Socket.io
                             reality go to @atlas.
DESIGN-FACTS.md            → Human ground truth for semantics and interaction.

## Definition of done
- Matches the FROZEN contract
- Handles loading, empty, error, offline states
- Inputs validated at the boundary
- No secrets in the diff
- @argus verified it with an actual test run
