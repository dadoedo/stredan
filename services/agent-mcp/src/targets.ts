import postgres from "postgres";
import { sql } from "./db/client.js";
import { decrypt, encrypt, secretHint } from "./vault.js";
import type {
  ApiKeyRecord,
  EmailConfig,
  Permissions,
  PostgresConfig,
  ResolvedAccount,
  ResolvedDatabase,
  ResolvedEnvironment,
} from "./types.js";

function inScope(scope: string[] | "*", id: string, key: string): boolean {
  if (scope === "*") return true;
  return scope.includes(id) || scope.includes(key);
}

function overlayPermissions(base: Permissions, keyReadonly: boolean): Permissions {
  return keyReadonly ? "readonly" : base;
}

function asPermissions(value: string): Permissions {
  return value === "readwrite" ? "readwrite" : "readonly";
}

export async function storeSecret(plaintext: string): Promise<string> {
  const blob = encrypt(plaintext);
  const rows = await sql<{ id: string }[]>`
    INSERT INTO vault_secrets (ciphertext, nonce)
    VALUES (${blob.ciphertext}, ${blob.nonce})
    RETURNING id
  `;
  return rows[0].id;
}

export async function replaceSecret(oldId: string | null, plaintext: string): Promise<string> {
  const id = await storeSecret(plaintext);
  if (oldId) {
    await sql`DELETE FROM vault_secrets WHERE id = ${oldId}`;
  }
  return id;
}

export async function readSecret(id: string): Promise<string> {
  const rows = await sql<{ ciphertext: Buffer; nonce: Buffer }[]>`
    SELECT ciphertext, nonce FROM vault_secrets WHERE id = ${id}
  `;
  if (rows.length === 0) throw new Error("Secret not found");
  return decrypt({ ciphertext: rows[0].ciphertext, nonce: rows[0].nonce });
}

function buildConnectionUrl(input: {
  connectionUrl?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}): string {
  if (input.connectionUrl?.trim()) return input.connectionUrl.trim();
  if (!input.host || !input.database || !input.username) {
    throw new Error("Provide a connection URL or host, database, and username");
  }
  const port = input.port ?? 5432;
  const user = encodeURIComponent(input.username);
  const pass = encodeURIComponent(input.password ?? "");
  const db = encodeURIComponent(input.database);
  const ssl = input.ssl === false ? "" : "?sslmode=prefer";
  return `postgres://${user}:${pass}@${input.host}:${port}/${db}${ssl}`;
}

export { buildConnectionUrl, secretHint };

export async function loadPostgresConfig(key: ApiKeyRecord): Promise<PostgresConfig> {
  const databases = new Map<string, ResolvedDatabase>();
  const targets = await sql<{
    id: string;
    key: string;
    name: string;
    notes: string | null;
    enabled: boolean;
  }[]>`
    SELECT id, key, name, notes, enabled
    FROM database_targets
    WHERE enabled = true
    ORDER BY key
  `;

  for (const target of targets) {
    if (!inScope(key.databaseIds, target.id, target.key)) continue;

    const envs = await sql<{
      id: string;
      name: string;
      permissions: string;
      connection_url_secret_id: string | null;
    }[]>`
      SELECT id, name, permissions, connection_url_secret_id
      FROM database_environments
      WHERE database_id = ${target.id}
      ORDER BY name
    `;

    const environments = new Map<string, ResolvedEnvironment>();
    for (const envRow of envs) {
      if (!envRow.connection_url_secret_id) continue;
      const connectionUrl = await readSecret(envRow.connection_url_secret_id);
      environments.set(envRow.name, {
        id: envRow.id,
        name: envRow.name,
        connectionUrl,
        permissions: overlayPermissions(asPermissions(envRow.permissions), key.readonly),
      });
    }
    if (environments.size === 0) continue;
    databases.set(target.key, {
      id: target.id,
      key: target.key,
      name: target.name,
      notes: target.notes,
      enabled: target.enabled,
      environments,
    });
  }

  return { databases };
}

export async function loadEmailConfig(key: ApiKeyRecord): Promise<EmailConfig> {
  const accounts = new Map<string, ResolvedAccount>();
  const rows = await sql<{
    id: string;
    key: string;
    name: string;
    address: string;
    imap_host: string;
    imap_port: number;
    imap_secure: boolean;
    smtp_host: string;
    smtp_port: number;
    smtp_secure: boolean;
    imap_user: string | null;
    smtp_user: string | null;
    password_secret_id: string | null;
    permissions: string;
    append_to_sent: boolean;
    sent_folder: string;
  }[]>`
    SELECT
      id, key, name, address,
      imap_host, imap_port, imap_secure,
      smtp_host, smtp_port, smtp_secure,
      imap_user, smtp_user,
      password_secret_id, permissions, append_to_sent, sent_folder
    FROM email_accounts
    WHERE enabled = true
    ORDER BY key
  `;

  for (const row of rows) {
    if (!inScope(key.emailIds, row.id, row.key)) continue;
    if (!row.password_secret_id) continue;
    const password = await readSecret(row.password_secret_id);
    accounts.set(row.key, {
      id: row.id,
      key: row.key,
      name: row.name,
      address: row.address,
      imap: {
        host: row.imap_host,
        port: row.imap_port,
        secure: row.imap_secure,
        user: row.imap_user?.trim() || row.address,
      },
      smtp: {
        host: row.smtp_host,
        port: row.smtp_port,
        secure: row.smtp_secure,
        user: row.smtp_user?.trim() || row.address,
      },
      password,
      permissions: overlayPermissions(asPermissions(row.permissions), key.readonly),
      sendVia: "smtp",
      appendToSent: row.append_to_sent,
      sentFolder: row.sent_folder,
    });
  }

  return { accounts };
}

export function getDatabaseInfo(
  config: PostgresConfig,
  dbKey: string,
  environment: string
): { db: ResolvedDatabase; env: ResolvedEnvironment } {
  const db = config.databases.get(dbKey);
  if (!db) {
    const available = Array.from(config.databases.keys()).join(", ") || "(none in scope)";
    throw new Error(`Database "${dbKey}" not found. Available databases: ${available}`);
  }

  let env = db.environments.get(environment);
  if (!env && (environment === "default" || !environment) && db.environments.size === 1) {
    env = db.environments.values().next().value;
  }
  if (!env) {
    const available = Array.from(db.environments.keys()).join(", ");
    throw new Error(
      `Environment "${environment}" not found for database "${dbKey}". Available environments: ${available}`
    );
  }
  return { db, env };
}

export function getAccount(config: EmailConfig, accountKey: string): ResolvedAccount {
  const account = config.accounts.get(accountKey);
  if (!account) {
    const available = Array.from(config.accounts.keys()).join(", ") || "(none in scope)";
    throw new Error(`Account "${accountKey}" not found. Available accounts: ${available}`);
  }
  return account;
}

export function assertWritable(account: ResolvedAccount): void {
  if (account.permissions === "readonly") {
    throw new Error(
      `Account "${account.key}" is configured as readonly. Write operations (send, mark, move, delete) are not allowed.`
    );
  }
}

export async function testPostgresConnection(connectionUrl: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = postgres(connectionUrl, {
    max: 1,
    connect_timeout: 8,
    idle_timeout: 1,
    onnotice: () => {},
  });
  try {
    await client`SELECT 1 AS ok`;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await client.end({ timeout: 2 }).catch(() => {});
  }
}
