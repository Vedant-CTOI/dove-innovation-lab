// Moderator authentication — simple bearer token from MODERATOR_KEY env var.
// Used by the Operator Console and all moderator-only REST / socket endpoints.

import type { Request, Response, NextFunction } from "express";

/** The expected bearer token, read once from MODERATOR_KEY at module load. */
const MODERATOR_KEY = process.env.MODERATOR_KEY ?? "";

/**
 * Verify a moderator token against the configured MODERATOR_KEY.
 * Accepts either the raw token or a "Bearer <token>" prefixed string.
 */
export function verifyModerator(token: string | undefined | null): boolean {
  if (!MODERATOR_KEY || !token) return false;
  const raw = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
  return raw === MODERATOR_KEY;
}

/**
 * Express middleware that rejects requests without a valid moderator token.
 * Checks the Authorization header for a bearer token.
 */
export function moderatorMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!verifyModerator(authHeader)) {
    res.status(403).json({ ok: false, error: "Forbidden: invalid moderator token" });
    return;
  }
  next();
}
