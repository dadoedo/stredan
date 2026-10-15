import { createHash, randomBytes } from "node:crypto";
import { sql } from "../db/client.js";
import { env } from "../env.js";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function inviteUrl(token: string): string {
  const base = env.publicDashboardUrl.replace(/\/$/, "");
  return `${base}/invite/${token}`;
}

export async function createInvite(email: string, invitedBy: string): Promise<{ token: string; expiresAt: Date }> {
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email");
  }
  const existing = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${normalized}`;
  if (existing.length > 0) throw new Error("That email already has an account");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await sql.begin(async (tx) => {
    await tx`
      UPDATE user_invites
      SET expires_at = now()
      WHERE email = ${normalized} AND accepted_at IS NULL AND expires_at > now()
    `;
    await tx`
      INSERT INTO user_invites (email, token_hash, role, invited_by, expires_at)
      VALUES (${normalized}, ${hashInviteToken(token)}, 'user', ${invitedBy}, ${expiresAt})
    `;
  });
  return { token, expiresAt };
}

export async function peekInvite(token: string): Promise<{ email: string } | null> {
  const rows = await sql<{ email: string }[]>`
    SELECT email FROM user_invites
    WHERE token_hash = ${hashInviteToken(token.trim())}
      AND accepted_at IS NULL
      AND expires_at > now()
  `;
  return rows[0] ?? null;
}

export async function acceptInvite(
  token: string,
  passwordHash: string
): Promise<{ userId: string; email: string } | null> {
  const hash = hashInviteToken(token.trim());
  return sql.begin(async (tx) => {
    const rows = await tx<{ id: string; email: string; role: string }[]>`
      SELECT id, email, role FROM user_invites
      WHERE token_hash = ${hash}
        AND accepted_at IS NULL
        AND expires_at > now()
      FOR UPDATE
    `;
    const invite = rows[0];
    if (!invite || (invite.role !== "user" && invite.role !== "superadmin")) return null;
    const taken = await tx<{ id: string }[]>`SELECT id FROM users WHERE email = ${invite.email}`;
    if (taken.length > 0) return null;
    const inserted = await tx<{ id: string }[]>`
      INSERT INTO users (email, password_hash, role)
      VALUES (${invite.email}, ${passwordHash}, ${invite.role})
      RETURNING id
    `;
    await tx`UPDATE user_invites SET accepted_at = now() WHERE id = ${invite.id}`;
    return { userId: inserted[0].id, email: invite.email };
  });
}
