import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env.js";
import { sql } from "./client.js";

const here = dirname(fileURLToPath(import.meta.url));

function schemaPath(): string {
  const candidates = [
    join(here, "schema.sql"),
    join(here, "../../src/db/schema.sql"),
    join(process.cwd(), "src/db/schema.sql"),
    join(process.cwd(), "dist/db/schema.sql"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  throw new Error(`schema.sql not found. Tried: ${candidates.join(", ")}`);
}

export async function migrate(): Promise<void> {
  const schema = readFileSync(schemaPath(), "utf8");
  await sql.unsafe(schema);
  await backfillTenancy();
}

/**
 * Idempotent. Copies legacy admins into users (ADMIN_EMAIL, and any other
 * existing admin, as superadmin) and assigns every unowned mailbox, database,
 * API key, and vault secret to that superadmin. Existing key hashes and scope
 * JSON are not modified. Safe to run on every boot.
 */
export async function backfillTenancy(): Promise<void> {
  await sql`
    INSERT INTO users (id, email, password_hash, role, totp_secret_id, totp_enabled, created_at)
    SELECT
      a.id,
      lower(a.email),
      a.password_hash,
      'superadmin',
      a.totp_secret_id,
      a.totp_enabled,
      a.created_at
    FROM admins a
    ON CONFLICT (email) DO UPDATE SET
      role = 'superadmin',
      password_hash = CASE
        WHEN users.password_hash IS NULL OR users.password_hash = '' THEN EXCLUDED.password_hash
        ELSE users.password_hash
      END,
      totp_secret_id = COALESCE(users.totp_secret_id, EXCLUDED.totp_secret_id),
      totp_enabled = users.totp_enabled OR EXCLUDED.totp_enabled
  `;

  await sql`
    UPDATE users
    SET role = 'superadmin'
    WHERE lower(email) = ${env.adminEmail} AND role <> 'superadmin'
  `;

  const preferred = await sql<{ id: string }[]>`
    SELECT id FROM users
    WHERE role = 'superadmin' AND lower(email) = ${env.adminEmail}
    LIMIT 1
  `;
  const owners = preferred[0]
    ? preferred
    : await sql<{ id: string }[]>`
        SELECT id FROM users WHERE role = 'superadmin' ORDER BY created_at ASC LIMIT 1
      `;
  const ownerId = owners[0]?.id;
  if (!ownerId) return;

  const emails = await sql<{ id: string }[]>`
    UPDATE email_accounts SET owner_id = ${ownerId} WHERE owner_id IS NULL RETURNING id
  `;
  const databases = await sql<{ id: string }[]>`
    UPDATE database_targets SET owner_id = ${ownerId} WHERE owner_id IS NULL RETURNING id
  `;
  const keys = await sql<{ id: string }[]>`
    UPDATE api_keys SET owner_id = ${ownerId} WHERE owner_id IS NULL RETURNING id
  `;
  const secrets = await sql<{ id: string }[]>`
    UPDATE vault_secrets SET owner_id = ${ownerId} WHERE owner_id IS NULL RETURNING id
  `;
  await sql`
    UPDATE sessions s
    SET user_id = u.id
    FROM admins a
    JOIN users u ON lower(u.email) = lower(a.email)
    WHERE s.user_id IS NULL AND s.admin_id = a.id
  `;
  await sql`
    UPDATE audit_log g
    SET user_id = u.id
    FROM admins a
    JOIN users u ON lower(u.email) = lower(a.email)
    WHERE g.user_id IS NULL AND g.admin_id = a.id
  `;

  const touched = emails.length + databases.length + keys.length + secrets.length;
  if (touched > 0) {
    console.log(
      `Tenancy backfill assigned ${databases.length} databases, ${emails.length} mailboxes, ${keys.length} api keys, ${secrets.length} secrets to superadmin ${ownerId}`
    );
  }
}
