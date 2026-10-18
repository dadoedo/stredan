import { sql } from "../db/client.js";
import type { ApiKeyScope, UserSession } from "../types.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSuperadmin(session: UserSession): boolean {
  return session.role === "superadmin";
}

export async function foreignScopeIds(ownerId: string, scopes: ApiKeyScope): Promise<string | null> {
  const databases = await idsOwned(ownerId, scopes.databases, "databases");
  if (databases) return databases;
  return idsOwned(ownerId, scopes.emails, "mailboxes");
}

async function idsOwned(
  ownerId: string,
  ids: string[] | "*",
  label: "databases" | "mailboxes"
): Promise<string | null> {
  if (ids === "*") return null;
  const unique = [...new Set(ids)];
  if (unique.length === 0) return null;
  if (unique.some((id) => !UUID_RE.test(id))) {
    return `A key can only reference its owner's ${label}`;
  }
  const rows =
    label === "databases"
      ? await sql<{ id: string }[]>`
          SELECT id FROM database_targets
          WHERE owner_id = ${ownerId} AND id = ANY(${unique}::uuid[])
        `
      : await sql<{ id: string }[]>`
          SELECT id FROM email_accounts
          WHERE owner_id = ${ownerId} AND id = ANY(${unique}::uuid[])
        `;
  if (rows.length !== unique.length) {
    return `A key can only reference its owner's ${label}`;
  }
  return null;
}
