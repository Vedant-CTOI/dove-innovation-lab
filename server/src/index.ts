// server/src/index.ts — Server entry point.
//
// One process, one http.Server: Express serves the REST API (and, in
// production, the built React client), Socket.IO rides the same server for the
// realtime workshop events. Same-origin — no CORS. Listens on 0.0.0.0 with the
// port from PORT (default 3000) and shuts down gracefully on SIGTERM.

import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express, { type Express, type Request, type Response } from "express";
import { Server } from "socket.io";
import { RoomStore } from "./store.js";
import { setupRest } from "./rest.js";
import { setupSocket } from "./socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// App + servers
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 3000);
const HOST = "0.0.0.0";
const isProduction = process.env.NODE_ENV === "production";

export const app: Express = express();
export const httpServer = http.createServer(app);

// Socket.IO shares the same http.Server — same origin, no CORS.
export const io = new Server(httpServer, {
  cors: { origin: false, credentials: false },
  maxHttpBufferSize: 1e6, // 1MB payload cap
});

// In-memory store — single instance keeps rooms valid.
export const store = new RoomStore();

// Body parsing for JSON (REST).
app.use(express.json({ limit: "1mb" }));

// ---------------------------------------------------------------------------
// Routes + realtime
// ---------------------------------------------------------------------------

setupRest(app, store);
setupSocket(io, store);

// ---------------------------------------------------------------------------
// Production: serve the built client (SPA fallback)
// ---------------------------------------------------------------------------

const clientDist = path.resolve(__dirname, "..", "client", "dist");

if (isProduction && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: any non-/api route returns index.html so the client router
  // takes over. API 404s fall through to the Express default handler above.
  app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ---------------------------------------------------------------------------
// Start + graceful shutdown
// ---------------------------------------------------------------------------

httpServer.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[relay] listening on http://${HOST}:${PORT}`);
});

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  // eslint-disable-next-line no-console
  console.log(`[relay] ${signal} received, shutting down gracefully`);

  // 1. Stop accepting new connections.
  httpServer.close(() => {
    // eslint-disable-next-line no-console
    console.log("[relay] http server closed");
  });

  // 2. Flush + disconnect all socket connections (room-scoped, in-memory).
  io.disconnectSockets(true);
  io.close(() => {
    // eslint-disable-next-line no-console
    console.log("[relay] socket.io closed");
  });

  // 3. Hard exit fallback in case something hangs.
  const force = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error("[relay] forcing exit after timeout");
    process.exit(1);
  }, 10_000);
  force.unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default httpServer;
