// REST e2e test — verifies all REST endpoints from contracts/workshop-features.md.
// Run: node scripts/rest-e2e.mjs
const URL = "http://localhost:3000";
const MOD_KEY = "test-mod-key-12345";
const CODE = "rest" + Date.now().toString().slice(-6);

let pass = 0, fail = 0;
function ok(name) { pass++; console.log(`  ✓ ${name}`); }
function bad(name, err) { fail++; console.error(`  ✗ ${name}: ${err}`); }

async function json(method, path, body, headers = {}) {
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${URL}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

async function run() {
  console.log(`\n=== REST E2E (room: ${CODE}) ===\n`);

  // 1. Health
  let r = await json("GET", "/api/health");
  if (r.data?.ok === true) ok("GET /api/health → 200 ok"); else bad("health", JSON.stringify(r));

  // 2. Get ideas (empty room)
  r = await json("GET", `/api/ideas?code=${CODE}`);
  if (r.data?.ok === true && Array.isArray(r.data.ideas)) ok("GET /api/ideas → empty array"); else bad("ideas empty", JSON.stringify(r));

  // 3. Create idea
  r = await json("POST", "/api/idea", { code: CODE, text: "REST test idea", team: "classic", flavour: "classic", author: "Tester", authorId: "rest-author-1" });
  const ideaId = r.data?.idea?.id;
  if (r.status === 201 && r.data?.ok && ideaId) ok(`POST /api/idea → 201 (id: ${ideaId?.slice(0,8)}...)`); else bad("create idea", JSON.stringify(r));

  // 4. Get ideas (1 idea)
  r = await json("GET", `/api/ideas?code=${CODE}`);
  if (r.data?.ideas?.length === 1) ok("GET /api/ideas → 1 idea"); else bad("ideas count", JSON.stringify(r));

  // 5. Edit idea (author-only, Ideate phase only)
  r = await json("PUT", `/api/idea/${ideaId}`, { code: CODE, text: "Edited REST idea", flavour: "classic", authorId: "rest-author-1" });
  if (r.data?.ok && r.data.idea?.text === "Edited REST idea") ok("PUT /api/idea/:id → edited (author, Ideate)"); else bad("edit idea", JSON.stringify(r));

  // 6. Edit idea (wrong author → 403)
  r = await json("PUT", `/api/idea/${ideaId}`, { code: CODE, text: "Hacked idea", flavour: "classic", authorId: "wrong-author" });
  if (r.status === 403) ok("PUT /api/idea/:id (wrong author) → 403"); else bad("edit wrong author", `got ${r.status}`);

  // 7. Vote (blocked until voteVisible)
  r = await json("POST", "/api/vote", { code: CODE, ideaId, visitorId: "v-rest-1", action: "add" });
  if (r.status === 403) ok("POST /api/vote (blind) → 403 (vote_not_visible)"); else bad("vote blind", `got ${r.status}: ${JSON.stringify(r.data)}`);

  // 8. Set status to Vote (moderator only)
  r = await json("POST", "/api/status", { code: CODE, status: "Presentation" }, { Authorization: `Bearer ${MOD_KEY}` });
  if (r.data?.ok) ok("POST /api/status → Presentation (mod)"); else bad("set Presentation", JSON.stringify(r));

  r = await json("POST", "/api/status", { code: CODE, status: "Vote" }, { Authorization: `Bearer ${MOD_KEY}` });
  if (r.data?.ok) ok("POST /api/status → Vote (mod)"); else bad("set Vote", JSON.stringify(r));

  // 9. Edit idea during Vote → 403
  r = await json("PUT", `/api/idea/${ideaId}`, { code: CODE, text: "Can't edit now", flavour: "classic", authorId: "rest-author-1" });
  if (r.status === 403) ok("PUT /api/idea/:id (Vote phase) → 403 (not_ideate)"); else bad("edit during Vote", `got ${r.status}`);

  // 10. Set status without moderator key → 401
  r = await json("POST", "/api/status", { code: CODE, status: "Reveal" });
  if (r.status === 401 || r.status === 403) ok("POST /api/status (no key) → 401"); else bad("status no key", `got ${r.status}`);

  // 11. Results (not Reveal → 403)
  r = await json("GET", `/api/results?code=${CODE}`);
  if (r.status === 403) ok("GET /api/results (Vote) → 403"); else bad("results not reveal", `got ${r.status}`);

  // 12. Set status to Reveal
  r = await json("POST", "/api/status", { code: CODE, status: "Reveal" }, { Authorization: `Bearer ${MOD_KEY}` });
  if (r.data?.ok) ok("POST /api/status → Reveal (mod)"); else bad("set Reveal", JSON.stringify(r));

  // 13. Results (Reveal → 200)
  r = await json("GET", `/api/results?code=${CODE}`);
  if (r.data?.ok && Array.isArray(r.data.results)) ok("GET /api/results (Reveal) → 200"); else bad("results reveal", JSON.stringify(r));

  // 14. Coach (graceful fallback — no LLM key)
  r = await json("POST", "/api/coach", { code: CODE, ideaId, persona: "Provocateur" });
  if (r.data?.ok && typeof r.data.reply === "string") ok("POST /api/coach → fallback reply"); else bad("coach", JSON.stringify(r));

  // 15. Ticker
  r = await json("GET", `/api/ticker?code=${CODE}`);
  if (r.data?.ok && Array.isArray(r.data.ticker)) ok("GET /api/ticker → array"); else bad("ticker", JSON.stringify(r));

  // 16. Moderator state
  r = await json("GET", `/api/moderator/state?code=${CODE}`, null, { Authorization: `Bearer ${MOD_KEY}` });
  if (r.data?.ok && r.data.room) ok("GET /api/moderator/state → room state"); else bad("mod state", JSON.stringify(r));

  // 17. Moderator state without key → 401
  r = await json("GET", `/api/moderator/state?code=${CODE}`);
  if (r.status === 401) ok("GET /api/moderator/state (no key) → 401"); else bad("mod state no key", `got ${r.status}`);

  // 18. Moderator reset
  r = await json("POST", "/api/moderator/reset", { code: CODE }, { Authorization: `Bearer ${MOD_KEY}` });
  if (r.data?.ok) ok("POST /api/moderator/reset → ok"); else bad("reset", JSON.stringify(r));

  // 19. Set status to Completed
  r = await json("POST", "/api/status", { code: CODE, status: "Completed" }, { Authorization: `Bearer ${MOD_KEY}` });
  if (r.data?.ok) ok("POST /api/status → Completed (mod)"); else bad("set Completed", JSON.stringify(r));

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
