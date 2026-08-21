// Playwright screenshot script — serves the production build via a local
// static server that proxies /api to the backend on :3000.
// Captures every route × every status.
//
// Run: node scripts/screenshot.mjs

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import http from "node:http";

const BACKEND_URL = "http://localhost:3000";
const MOD_KEY = "test-mod-key-12345";
const SHOTS_DIR = path.resolve(process.cwd(), "shots");
const CLIENT_DIST = path.resolve(process.cwd(), "client", "dist");
const CONSOLE_ERRORS = [];
const STATIC_PORT = 3456;
const SCREENSHOT_URL = `http://localhost:${STATIC_PORT}`;

if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

// ── Static file server with API proxy (built-in http only) ──
const mimeTypes = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png",
  ".json": "application/json", ".map": "application/json",
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Proxy API to backend
      if (req.url.startsWith("/api")) {
        const proxyReq = http.request(BACKEND_URL + req.url, {
          method: req.method,
          headers: req.headers,
        }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          proxyRes.pipe(res);
        });
        proxyReq.on("error", () => { res.writeHead(502); res.end("proxy error"); });
        req.pipe(proxyReq);
        return;
      }
      // Serve static files from client/dist
      let filePath = path.join(CLIENT_DIST, req.url.split("?")[0]);
      if (req.url === "/" || !fs.existsSync(filePath)) {
        filePath = path.join(CLIENT_DIST, "index.html");
      }
      const ext = path.extname(filePath);
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(STATIC_PORT, () => {
      console.log(`Static server on :${STATIC_PORT} (proxying /api to :3000)`);
      resolve(server);
    });
  });
}

// ── Workshop room setup ──
const CODE = "shot" + Date.now().toString().slice(-6);

async function setupRoom() {
  for (let i = 1; i <= 6; i++) {
    await fetch(`${BACKEND_URL}/api/idea`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: CODE,
        text: `Workshop idea #${i} — ${["Shake up the orchard", "Pulp-powered activation", "Bounce Back campus tour", "Golden burst moment", "50 years of flavour", "Gulp and twist campaign"][i-1]}`,
        team: ["classic", "tropical", "mixed", "berry"][i % 4],
        flavour: ["classic", "tropical", "mixed", "berry"][i % 4],
        author: `Tester${i}`,
        authorId: `shot-author-${i}`,
      }),
    });
  }
}

async function setStatus(status) {
  await fetch(`${BACKEND_URL}/api/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${MOD_KEY}` },
    body: JSON.stringify({ code: CODE, status }),
  });
}

async function capture(browser, routePath, name, options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  if (options.modToken) {
    await page.addInitScript((token) => {
      localStorage.setItem("mm-moderator-key", token);
    }, options.modToken);
  }
  if (options.participant) {
    await page.addInitScript(({ name, team }) => {
      localStorage.setItem("mm-participant-name", name);
      localStorage.setItem("mm-participant-team", team);
    }, { name: options.participant.name, team: options.participant.team });
  }
  if (options.clearParticipant) {
    await page.addInitScript(() => {
      localStorage.removeItem("mm-participant-name");
      localStorage.removeItem("mm-participant-team");
      localStorage.removeItem("mm-visitor-id");
    });
  }
  if (options.clearMod) {
    await page.addInitScript(() => {
      localStorage.removeItem("mm-moderator-key");
    });
  }

  const url = routePath.includes(":id") ? routePath.replace(":id", CODE) : routePath;
  try {
    await page.goto(`${SCREENSHOT_URL}${url}`, { waitUntil: "networkidle", timeout: 15000 });
  } catch {
    await page.goto(`${SCREENSHOT_URL}${url}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  }
  await page.waitForTimeout(2500);

  const filepath = path.join(SHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });

  if (errors.length > 0) {
    CONSOLE_ERRORS.push({ name, errors });
    console.log(`  ⚠ ${name} — ${errors.length} console error(s)`);
    errors.forEach(e => console.log(`    → ${e.substring(0, 120)}`));
  } else {
    console.log(`  ✓ ${name}`);
  }
  await page.close();
}

async function run() {
  const staticServer = await startStaticServer();
  await setupRoom();

  const browser = await chromium.launch({ headless: true });
  console.log(`\n=== Screenshots (room: ${CODE}) ===\n`);

  console.log("── Landing ──");
  await capture(browser, "/", "01-landing");

  console.log("\n── Big Screen ──");
  for (const status of ["Ideate", "Presentation", "Vote", "Reveal", "Completed"]) {
    await setStatus(status);
    await capture(browser, "/workshops/:id/screen", `02-screen-${status.toLowerCase()}`);
  }

  console.log("\n── Participant ──");
  await setStatus("Ideate");
  await capture(browser, "/workshops/:id/participants", `03-participant-teamselect`, {
    clearParticipant: true,
  });
  for (const status of ["Ideate", "Presentation", "Vote", "Reveal", "Completed"]) {
    await setStatus(status);
    await capture(browser, "/workshops/:id/participants", `03-participant-${status.toLowerCase()}`, {
      participant: { name: "Alex", team: "classic" },
    });
  }

  console.log("\n── Control Console ──");
  await capture(browser, "/workshops/:id/control", `04-control-auth`, { clearMod: true });
  for (const status of ["Ideate", "Presentation", "Vote", "Reveal", "Completed"]) {
    await setStatus(status);
    await capture(browser, "/workshops/:id/control", `04-control-${status.toLowerCase()}`, {
      modToken: MOD_KEY,
    });
  }

  console.log("\n── Empty States ──");
  const EMPTY_CODE = "empty" + Date.now().toString().slice(-6);
  await capture(browser, `/workshops/${EMPTY_CODE}/screen`, "05-empty-screen");
  await capture(browser, `/workshops/${EMPTY_CODE}/participants`, "05-empty-participant", {
    participant: { name: "Sam", team: "classic" },
  });

  await browser.close();
  staticServer.close();

  console.log("\n=== Console Error Summary ===");
  if (CONSOLE_ERRORS.length === 0) {
    console.log("  ✓ 0 console errors across all screenshots");
  } else {
    console.log(`  ✗ ${CONSOLE_ERRORS.length} screenshot(s) with console errors:`);
    CONSOLE_ERRORS.forEach(c => console.log(`    ${c.name}: ${c.errors.length} error(s)`));
  }

  const files = fs.readdirSync(SHOTS_DIR).filter(f => f.endsWith(".png")).sort();
  console.log(`\n=== ${files.length} screenshots saved to shots/ ===`);
  files.forEach(f => console.log(`  ${f}`));

  process.exit(CONSOLE_ERRORS.length > 0 ? 1 : 0);
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
