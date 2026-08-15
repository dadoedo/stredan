import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { sql } from "../db/client.js";
import type { ApiKeyRecord, ApiKeyScope } from "../types.js";

const PREFIX = "smcp_";

export function generateApiKey(): string {
  return PREFIX + randomBytes(32).toString("base64url");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function parseScopes(raw: unknown): ApiKeyScope {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const databases = obj.databases === "*" || Array.isArray(obj.databases) ? (obj.databases as string[] | "*") : [];
  const emails = obj.emails === "*" || Array.isArray(obj.emails) ? (obj.emails as string[] | "*") : [];
  return {
    databases,
    emails,
    readonly: obj.readonly === true,
  };
}

export async function lookupApiKey(bearer: string): Promise<ApiKeyRecord | null> {
  const key = bearer.trim();
  if (!key.startsWith(PREFIX)) return null;
  const hash = hashApiKey(key);
  const rows = await sql<{
    id: string;
    label: string;
    key_prefix: string;
    key_hash: string;
    scopes: unknown;
  }[]>`
    SELECT id, label, key_prefix, key_hash, scopes
    FROM api_keys
    WHERE key_hash = ${hash}
      AND revoked_at IS NULL
  `;
  const row = rows[0];
  if (!row) return null;
  const expected = Buffer.from(row.key_hash, "hex");
  const actual = Buffer.from(hash, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  const scopes = parseScopes(row.scopes);
  void sql`UPDATE api_keys SET last_used_at = now() WHERE id = ${row.id}`.catch(() => {});
  return {
    id: row.id,
    label: row.label,
    prefix: row.key_prefix,
    readonly: scopes.readonly,
    databaseIds: scopes.databases,
    emailIds: scopes.emails,
  };
}

export function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function createApiKey(label: string, scopes: ApiKeyScope): Promise<{ id: string; plaintext: string }> {
  const plaintext = generateApiKey();
  const prefix = plaintext.slice(0, 12);
  const rows = await sql<{ id: string }[]>`
    INSERT INTO api_keys (label, key_hash, key_prefix, scopes)
    VALUES (${label}, ${hashApiKey(plaintext)}, ${prefix}, ${sql.json(scopes as never)})
    RETURNING id
  `;
  return { id: rows[0].id, plaintext };
}

export async function revokeApiKey(id: string): Promise<void> {
  await sql`UPDATE api_keys SET revoked_at = now() WHERE id = ${id} AND revoked_at IS NULL`;
}
