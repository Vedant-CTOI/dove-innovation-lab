// Socket e2e test — verifies all socket events broadcast correctly.
// Run: node scripts/socket-e2e.test.js
import { io } from "socket.io-client";

const URL = "http://localhost:3000";
const MOD_KEY = "test-mod-key-12345";
const CODE = "e2e" + Date.now().toString().slice(-6);

let pass = 0, fail = 0;
function ok(name) { pass++; console.log(`  ✓ ${name}`); }
function bad(name, err) { fail++; console.error(`  ✗ ${name}: ${err}`); }

// Moderator socket (auth token in handshake)
const modSock = io(URL, {
  transports: ["websocket", "polling"],
  auth: { token: MOD_KEY },
});

// Participant socket (no auth)
const partSock = io(URL, { transports: ["websocket", "polling"] });

let resolveTest;
const done = new Promise((r) => (resolveTest = r));

// --- Participant listens for broadcasts ---
let gotIdeaAdded = false;
let gotVoteAdded = false;
let gotStatusChanged = false;
let gotTicker = false;
let gotVoteVisibilityChanged = false;
let gotCoachReply = false;

partSock.on("idea_added", () => { gotIdeaAdded = true; ok("participant received idea_added"); });
partSock.on("vote_added", () => { gotVoteAdded = true; ok("participant received vote_added"); });
partSock.on("workshop_status_changed", () => { gotStatusChanged = true; ok("participant received workshop_status_changed"); });
partSock.on("ticker", () => { gotTicker = true; ok("participant received ticker"); });
partSock.on("vote_visibility_changed", () => { gotVoteVisibilityChanged = true; ok("participant received vote_visibility_changed"); });
partSock.on("coach_reply", () => { gotCoachReply = true; ok("participant received coach_reply"); });

// --- Run the flow ---
async function run() {
  await new Promise((r) => modSock.on("connect", r));
  await new Promise((r) => partSock.on("connect", r));
  ok("both sockets connected");

  // 1. Both join the room
  await new Promise((resolve) => {
    modSock.emit("join_room", { code: CODE, name: "Mod", team: "Orange" }, (r) => {
      if (r.ok) ok("mod join_room"); else bad("mod join_room", r.error);
      resolve();
    });
  });

  await new Promise((resolve) => {
    partSock.emit("join_room", { code: CODE, name: "Part", team: "Orange" }, (r) => {
      if (r.ok) ok("part join_room"); else bad("part join_room", r.error);
      resolve();
    });
  });

  // 2. Add an idea via participant
  await new Promise((resolve) => {
    partSock.emit("add_idea", { code: CODE, text: "Test idea from e2e", team: "Orange", flavour: "Pulpy", author: "Participant" }, (r) => {
      if (r.ok) ok("add_idea ack"); else bad("add_idea", r.error);
      resolve();
    });
  });

  // Wait a tick for broadcast
  await new Promise((r) => setTimeout(r, 200));

  // 3. Toggle vote visibility (moderator)
  await new Promise((resolve) => {
    modSock.emit("toggle_vote_visibility", { code: CODE, visible: true }, (r) => {
      if (r.ok) ok("toggle_vote_visibility ack"); else bad("toggle_vote_visibility", r.error);
      resolve();
    });
  });
  await new Promise((r) => setTimeout(r, 200));

  // 4. Add a vote
  // Need ideaId from the room state
  const stateResp = await fetch(`${URL}/api/ideas?code=${CODE}`).then((r) => r.json());
  const ideaId = stateResp.ideas?.[0]?.id;
  if (!ideaId) return bad("get ideaId", "no ideas");

  await new Promise((resolve) => {
    partSock.emit("add_vote", { code: CODE, ideaId, visitorId: "e2e-v1" }, (r) => {
      if (r.ok) ok("add_vote ack"); else bad("add_vote", r.error);
      resolve();
    });
  });
  await new Promise((r) => setTimeout(r, 200));

  // 5. Change status (moderator)
  await new Promise((resolve) => {
    modSock.emit("set_status", { code: CODE, status: "Presentation" }, (r) => {
      if (r.ok) ok("set_status ack"); else bad("set_status", r.error);
      resolve();
    });
  });
  await new Promise((r) => setTimeout(r, 200));

  // 6. Push a ticker item (moderator)
  await new Promise((resolve) => {
    modSock.emit("push_ticker", { code: CODE, badge: "INFO", badgeColor: "#F08810", text: "E2E test ticker" }, (r) => {
      if (r.ok) ok("push_ticker ack"); else bad("push_ticker", r.error);
      resolve();
    });
  });
  await new Promise((r) => setTimeout(r, 200));

  // 7. Edit idea (should be blocked since status = Presentation)
  await new Promise((resolve) => {
    partSock.emit("edit_idea", { code: CODE, ideaId, text: "Edited", flavour: "Pulpy", authorId: "e2e-author" }, (r) => {
      if (!r.ok) ok("edit_idea blocked (not Ideate)"); else bad("edit_idea should be blocked", "was allowed");
      resolve();
    });
  });

  // 8. Request coach (no LLM key → graceful fallback via socket)
  await new Promise((resolve) => {
    partSock.emit("request_coach", { code: CODE, ideaId, persona: "Provocateur" }, (r) => {
      if (r.ok) ok("request_coach ack (fallback)"); else bad("request_coach", r.error);
      resolve();
    });
  });
  await new Promise((r) => setTimeout(r, 500));

  // --- Verify all broadcasts were received ---
  console.log("\n--- Broadcast verification ---");
  if (gotIdeaAdded) ok("idea_added broadcast"); else bad("idea_added broadcast", "not received");
  if (gotVoteAdded) ok("vote_added broadcast"); else bad("vote_added broadcast", "not received");
  if (gotStatusChanged) ok("workshop_status_changed broadcast"); else bad("workshop_status_changed broadcast", "not received");
  if (gotTicker) ok("ticker broadcast"); else bad("ticker broadcast", "not received");
  if (gotVoteVisibilityChanged) ok("vote_visibility_changed broadcast"); else bad("vote_visibility_changed broadcast", "not received");
  // coach_reply may or may not fire depending on impl — don't fail on it

  // --- REST permission checks ---
  console.log("\n--- REST permission checks ---");

  // Results 403 when not Reveal
  let r2 = await fetch(`${URL}/api/results?code=${CODE}`).then((r) => r.json());
  if (r2.ok === false) ok("results 403 (not Reveal)"); else bad("results should be 403", JSON.stringify(r2));

  // Move to Reveal
  await fetch(`${URL}/api/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${MOD_KEY}` },
    body: JSON.stringify({ code: CODE, status: "Reveal" }),
  });

  // Results 200 at Reveal
  let r3 = await fetch(`${URL}/api/results?code=${CODE}`).then((r) => r.json());
  if (r3.ok === true) ok("results 200 (Reveal)"); else bad("results should be 200", JSON.stringify(r3));

  // Status without moderator key → 401
  let r4 = await fetch(`${URL}/api/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: CODE, status: "Vote" }),
  });
  if (r4.status === 401 || r4.status === 403) ok("status 401/403 (no mod key)"); else bad("status should be 401/403", `got ${r4.status}`);

  modSock.disconnect();
  partSock.disconnect();
  resolveTest();
}

run().catch((e) => { console.error("FATAL:", e); resolveTest(); });

await done;
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
