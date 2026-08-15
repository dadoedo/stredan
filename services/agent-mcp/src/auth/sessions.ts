import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { sql } from "../db/client.js";
import { env } from "../env.js";
import type { AdminSession } from "../types.js";

const COOKIE = "agent_mcp_sid";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const PENDING_TTL_MS = 10 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(adminId: string, pendingTotp: boolean): Promise<string> {
  const token = newToken();
  const ttl = pendingTotp ? PENDING_TTL_MS : SESSION_TTL_MS;
  await sql`
    INSERT INTO sessions (admin_id, token_hash, pending_totp, expires_at)
    VALUES (${adminId}, ${hashToken(token)}, ${pendingTotp}, ${new Date(Date.now() + ttl)})
  `;
  return token;
}

export async function promoteSession(sessionId: string): Promise<void> {
  await sql`
    UPDATE sessions
    SET pending_totp = false, expires_at = ${new Date(Date.now() + SESSION_TTL_MS)}
    WHERE id = ${sessionId}
  `;
}

export async function destroySession(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
}

export async function loadSession(token: string): Promise<AdminSession | null> {
  const rows = await sql<AdminSession[]>`
    SELECT
      s.id,
      a.id AS "adminId",
      a.email,
      s.pending_totp AS "pendingTotp",
      a.totp_enabled AS "totpEnabled"
    FROM sessions s
    JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.expires_at > now()
  `;
  return rows[0] ?? null;
}

export function readSessionCookie(req: Request): string | undefined {
  const value = req.cookies?.[COOKIE];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function setSessionCookie(res: Response, token: string, pending: boolean): void {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: pending ? PENDING_TTL_MS : SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/",
  });
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
