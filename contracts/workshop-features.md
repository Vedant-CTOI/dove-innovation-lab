# Workshop Feature Contract

## Status machine
```
Ideate → Presentation → Vote → Reveal → Completed
```
- Status transitions are operator-triggered via the Operator Console.
- Each transition broadcasts a `workshop_status_changed` socket event.
- Idea edit/re-save is blocked when status != Ideate.
- Voting is blocked until the operator toggles blind-vote off (during Vote phase).

## Routes
| Route | View | Description |
|---|---|---|
| `/` | Landing | Branded hero, room code input, dual CTA |
| `/workshops/:id/screen` | Big Screen | Operator console + live idea wall + ticker + timer + QR |
| `/workshops/:id/participants` | Participant | Team selection → idea submission → voting |
| `/workshops/:id/control` | Control | Moderator-only operator console (may merge with screen) |

## Socket events (server → client)
| Event | Payload | Room scope |
|---|---|---|
| `idea_added` | `{ id, text, team, flavour, author, createdAt }` | `room:{code}` |
| `idea_updated` | `{ id, text, flavour }` | `room:{code}` |
| `vote_added` | `{ ideaId, totalVotes }` | `room:{code}` |
| `workshop_status_changed` | `{ status, prevStatus }` | `room:{code}` |
| `ticker` | `{ badge, badgeColor, text }` | `room:{code}` |
| `timer_started` | `{ duration, endsAt }` | `room:{code}` |
| `timer_stopped` | `{}` | `room:{code}` |
| `vote_visibility_changed` | `{ visible: boolean }` | `room:{code}` |
| `coach_reply` | `{ ideaId, persona, text }` | `room:{code}` |

## Socket events (client → server)
| Event | Payload | Ack |
|---|---|---|
| `join_room` | `{ code, name, team }` | `{ ok, room }` |
| `add_idea` | `{ code, text, team, flavour, author }` | `{ ok, idea }` |
| `edit_idea` | `{ code, ideaId, text, flavour, authorId }` | `{ ok, idea }` or 403 |
| `add_vote` | `{ code, ideaId, visitorId }` | `{ ok, idea, totalVotes }` |
| `remove_vote` | `{ code, ideaId, visitorId }` | `{ ok }` |
| `set_status` | `{ code, status }` (moderator only) | `{ ok, room }` |
| `set_timer` | `{ code, duration }` (moderator only) | `{ ok }` |
| `start_timer` | `{ code }` (moderator only) | `{ ok, endsAt }` |
| `stop_timer` | `{ code }` (moderator only) | `{ ok }` |
| `toggle_vote_visibility` | `{ code, visible }` (moderator only) | `{ ok }` |
| `request_coach` | `{ code, ideaId, persona }` | `{ ok, reply }` |
| `push_ticker` | `{ code, badge, badgeColor, text }` (moderator only) | `{ ok }` |

## REST endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | `{ ok: true, uptime }` |
| GET | `/api/ideas?code=XXX` | List ideas for room |
| POST | `/api/idea` | Submit idea (body: code, text, team, flavour, author) |
| PUT | `/api/idea/:id` | Edit idea (author-only, Ideate phase only) |
| POST | `/api/vote` | Vote (body: code, ideaId, visitorId, action) |
| GET | `/api/results?code=XXX` | Ranked results (Reveal phase only) |
| POST | `/api/status` | Set status (moderator token) |
| POST | `/api/moderator/reset` | Reset workshop state (moderator token) |
| GET | `/api/moderator/state` | Get full room state (moderator token) |
| POST | `/api/coach` | Request coach reply (body: code, ideaId, persona) |
| GET | `/api/ticker?code=XXX` | Get ticker items |

## Coach personas
1. **The Provocateur** — challenges assumptions, pushes boundaries, reframes the problem.
2. **The Sharpener** — refines language, tightens the value proposition, clarifies impact.
3. **The Brand Lens** — grounds ideas in brand equity, consumer insight, market reality.

**Principle: PROVOCATION OVER EVALUATION.** Coaches NEVER score, rank, or judge.
They expand, provoke, and reframe. Judged participants stop submitting → volume collapses.

## Moderator auth
- Simple bearer token in `Authorization` header.
- Set via `MODERATOR_KEY` env var on the server.
- Operator Console route checks this token before allowing phase/timer/vote toggles.

## LLM integration (for coaches)
- Provider-agnostic: auto-detect `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`.
- Default: Gemini 2.5 Flash (if `GEMINI_API_KEY` set).
- Multi-turn: coach maintains conversation history per idea.
- `maxOutputTokens` set generously (~1024) — thinking models burn tokens before reply.
