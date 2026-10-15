import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Secret, TOTP } from "otpauth";
import { audit } from "../src/audit.js";
import { hashApiKey, lookupApiKey } from "../src/auth/api-keys.js";
import { hashPassword, passwordIssues } from "../src/auth/passwords.js";
import { createSession, hashToken, loadSession } from "../src/auth/sessions.js";
import { sql, closePlatformDb } from "../src/db/client.js";
import { backfillTenancy, migrate } from "../src/db/migrate.js";
import { bootstrapAdmin } from "../src/bootstrap.js";
import { createEmailMcp } from "../src/email/mcp.js";
import { createApp } from "../src/http/app.js";
import type { ToolAudit } from "../src/mcp-audit.js";
import { createPostgresMcp } from "../src/postgres/mcp.js";
import { loadEmailConfig, loadPostgresConfig } from "../src/targets.js";
import { encrypt } from "../src/vault.js";
import type { ApiKeyRecord } from "../src/types.js";

const databaseUrl = process.env.DATABASE_URL ?? "";
const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
const legacyKey = "smcp_legacykeyvaluelegacykeyvaluelegacy";

function totpCode(base32: string): string {
  return new TOTP({
    issuer: "mcp.stredan.sk",
    label: "user",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(base32),
  }).generate();
}

function mergeCookies(previous: string, res: Response): string {
  const jar = new Map<string, string>();
  for (const part of previous.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const cookie of setCookies) {
    const pair = cookie.split(";")[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

function toolText(result: unknown): string {
  if (!result || typeof result !== "object" || !("content" in result) || !Array.isArray(result.content)) return "";
  return result.content
    .map((item) => (item && typeof item === "object" && "text" in item && typeof item.text === "string" ? item.text : ""))
    .join("\n");
}

async function callTool(server: McpServer, name: string, args: Record<string, unknown>) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "tenancy-test", version: "0.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    return await client.callTool({ name, arguments: args });
  } finally {
    await client.close();
    await server.close();
  }
}

function auditFor(key: ApiKeyRecord, kind: "postgres" | "email"): ToolAudit {
  return {
    async record({ tool, target, success }) {
      await audit(key.ownerId, "mcp.tool", "api_key", key.id, { kind }, {
        apiKeyId: key.id,
        success,
        tool,
        target,
      });
    },
  };
}

test("multi-user tenancy", async (t) => {
  assert.match(databaseUrl, /agent_mcp_test/, "DATABASE_URL must contain agent_mcp_test");
  let server: Server | undefined;
  let base = "";

  try {
    await t.test("migration keeps legacy keys and assigns them to the superadmin", async () => {
      assert.equal(passwordIssues("short1"), "Password must be at least 12 characters");
      assert.equal(passwordIssues("longenoughpassword"), "Password must include a letter and a number");
      assert.equal(passwordIssues("longenoughpassword1"), null);

      await sql.unsafe(`
        DROP TABLE IF EXISTS
          audit_log, sessions, user_invites, api_keys, email_accounts,
          database_environments, database_targets, users, admins, vault_secrets
        CASCADE
      `);
      await migrate();

      const totp = encrypt("LEGACYTOTPSECRET234567");
      const connection = encrypt("postgres://legacy:legacy@127.0.0.1:1/legacy");
      const mailbox = encrypt("legacy-mailbox-secret");
      const totpRows = await sql<{ id: string }[]>`
        INSERT INTO vault_secrets (ciphertext, nonce) VALUES (${totp.ciphertext}, ${totp.nonce}) RETURNING id
      `;
      const urlRows = await sql<{ id: string }[]>`
        INSERT INTO vault_secrets (ciphertext, nonce) VALUES (${connection.ciphertext}, ${connection.nonce}) RETURNING id
      `;
      const mailRows = await sql<{ id: string }[]>`
        INSERT INTO vault_secrets (ciphertext, nonce) VALUES (${mailbox.ciphertext}, ${mailbox.nonce}) RETURNING id
      `;
      const passwordHash = await hashPassword("legacy-admin-password-12");
      const admins = await sql<{ id: string }[]>`
        INSERT INTO admins (email, password_hash, totp_secret_id, totp_enabled)
        VALUES (${adminEmail}, ${passwordHash}, ${totpRows[0].id}, true)
        RETURNING id
      `;
      const adminId = admins[0].id;
      await sql`
        INSERT INTO database_targets (key, name) VALUES ('legacy-db', 'Legacy')
      `;
      const target = await sql<{ id: string }[]>`SELECT id FROM database_targets WHERE key = 'legacy-db'`;
      await sql`
        INSERT INTO database_environments (
          database_id, name, connection_url_secret_id, secret_hint, permissions
        ) VALUES (
          ${target[0].id}, 'default', ${urlRows[0].id}, '••••gacy', 'readonly'
        )
      `;
      await sql`
        INSERT INTO email_accounts (
          key, name, address, imap_host, smtp_host, password_secret_id, secret_hint
        ) VALUES (
          'legacy-box', 'Legacy', 'legacy@example.com', 'imap.example.com', 'smtp.example.com',
          ${mailRows[0].id}, '••••cret'
        )
      `;
      const keyHash = hashApiKey(legacyKey);
      await sql`
        INSERT INTO api_keys (label, key_hash, key_prefix, scopes)
        VALUES (
          'legacy',
          ${keyHash},
          ${legacyKey.slice(0, 12)},
          ${sql.json({ databases: "*", emails: "*", readonly: false })}
        )
      `;
      const sessionToken = "legacy-session-token";
      await sql`
        INSERT INTO sessions (admin_id, token_hash, pending_totp, expires_at)
        VALUES (${adminId}, ${hashToken(sessionToken)}, false, ${new Date(Date.now() + 60 * 60 * 1000)})
      `;
      await sql`
        INSERT INTO audit_log (admin_id, action) VALUES (${adminId}, 'legacy.action')
      `;

      assert.equal(await lookupApiKey(legacyKey), null);
      assert.equal(await loadSession(sessionToken), null);

      await backfillTenancy();
      await backfillTenancy();
      await bootstrapAdmin();

      const users = await sql<{ id: string; role: string; totp_enabled: boolean; password_hash: string }[]>`
        SELECT id, role, totp_enabled, password_hash FROM users WHERE email = ${adminEmail}
      `;
      assert.equal(users.length, 1);
      assert.equal(users[0].id, adminId);
      assert.equal(users[0].role, "superadmin");
      assert.equal(users[0].totp_enabled, true);
      assert.equal(users[0].password_hash, passwordHash);

      await sql`UPDATE users SET password_hash = ${passwordHash + "x"} WHERE id = ${adminId}`;
      await backfillTenancy();
      const after = await sql<{ password_hash: string; n: number }[]>`
        SELECT password_hash, (SELECT count(*)::int FROM users) AS n FROM users WHERE id = ${adminId}
      `;
      assert.equal(after[0].password_hash, passwordHash + "x");
      assert.equal(after[0].n, 1);

      const owned = await sql<{ emails: number; databases: number; keys: number; secrets: number }[]>`
        SELECT
          (SELECT count(*)::int FROM email_accounts WHERE owner_id = ${adminId}) AS emails,
          (SELECT count(*)::int FROM database_targets WHERE owner_id = ${adminId}) AS databases,
          (SELECT count(*)::int FROM api_keys WHERE owner_id = ${adminId}) AS keys,
          (SELECT count(*)::int FROM vault_secrets WHERE owner_id = ${adminId}) AS secrets
      `;
      assert.deepEqual(owned[0], { emails: 1, databases: 1, keys: 1, secrets: 3 });

      const storedKey = await sql<{ key_hash: string; scopes: { databases: string } }[]>`
        SELECT key_hash, scopes FROM api_keys WHERE label = 'legacy'
      `;
      assert.equal(storedKey[0].key_hash, keyHash);
      assert.equal(storedKey[0].scopes.databases, "*");

      const lookedUp = await lookupApiKey(legacyKey);
      assert.ok(lookedUp);
      assert.equal(lookedUp.ownerId, adminId);
      assert.equal(lookedUp.databaseIds, "*");
      assert.equal(lookedUp.readonly, false);

      const session = await loadSession(sessionToken);
      assert.equal(session?.userId, adminId);
      assert.equal(session?.role, "superadmin");
      assert.equal(session?.pendingTotp, false);

      const legacyAudit = await sql<{ user_id: string }[]>`
        SELECT user_id FROM audit_log WHERE action = 'legacy.action'
      `;
      assert.equal(legacyAudit[0].user_id, adminId);

      const config = await loadPostgresConfig(lookedUp);
      assert.deepEqual([...config.databases.keys()], ["legacy-db"]);
      const emailConfig = await loadEmailConfig(lookedUp);
      assert.equal(emailConfig.accounts.get("legacy-box")?.password, "legacy-mailbox-secret");

      await sql.unsafe(`
        DROP INDEX IF EXISTS database_targets_owner_key_idx;
        DROP INDEX IF EXISTS email_accounts_owner_key_idx;
        ALTER TABLE database_targets ADD CONSTRAINT database_targets_key_key UNIQUE (key);
        ALTER TABLE email_accounts ADD CONSTRAINT email_accounts_key_key UNIQUE (key);
      `);
      await migrate();

      const leftover = await sql<{ n: number }[]>`
        SELECT count(*)::int AS n
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname IN ('database_targets', 'email_accounts')
          AND con.contype = 'u'
          AND pg_get_constraintdef(con.oid) = 'UNIQUE (key)'
      `;
      assert.equal(leftover[0].n, 0);
      const indexes = await sql<{ indexname: string; indexdef: string }[]>`
        SELECT indexname, indexdef FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname IN ('database_targets_owner_key_idx', 'email_accounts_owner_key_idx')
        ORDER BY indexname
      `;
      assert.deepEqual(
        indexes.map((row) => row.indexname),
        ["database_targets_owner_key_idx", "email_accounts_owner_key_idx"]
      );
      assert.ok(indexes.every((row) => row.indexdef.includes("UNIQUE")));
      const afterMigrate = await lookupApiKey(legacyKey);
      assert.equal(afterMigrate?.ownerId, adminId);
      assert.deepEqual([...(await loadPostgresConfig(afterMigrate!)).databases.keys()], ["legacy-db"]);
    });

    await t.test("dashboard and MCP deny cross-tenant access", async () => {
      const superRows = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${adminEmail}`;
      const superId = superRows[0].id;
      const alphaHash = await hashPassword("alpha-password-12");
      const bravoHash = await hashPassword("bravo-password-12");
      const alpha = await sql<{ id: string }[]>`
        INSERT INTO users (email, password_hash, role) VALUES ('alpha@example.com', ${alphaHash}, 'user') RETURNING id
      `;
      const bravo = await sql<{ id: string }[]>`
        INSERT INTO users (email, password_hash, role) VALUES ('bravo@example.com', ${bravoHash}, 'user') RETURNING id
      `;
      const alphaToken = await createSession(alpha[0].id, false);
      const bravoToken = await createSession(bravo[0].id, false);
      const superToken = await createSession(superId, false);

      const app = createApp();
      server = app.listen(0);
      const port = (server.address() as AddressInfo).port;
      base = `http://127.0.0.1:${port}`;

      async function authed(token: string, path: string, init: RequestInit = {}) {
        const headers = new Headers(init.headers);
        headers.set("cookie", `agent_mcp_sid=${token}`);
        return fetch(base + path, { ...init, headers, redirect: "manual" });
      }

      const alphaDb = await authed(alphaToken, "/databases", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: "alpha-db",
          name: "Alpha",
          env_name: "default",
          permissions: "readonly",
          connection_url: "postgres://alpha:alpha@127.0.0.1:1/alpha",
          ssl: "on",
        }),
      });
      assert.equal(alphaDb.status, 302);
      const bravoDb = await authed(bravoToken, "/databases", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: "bravo-db",
          name: "Bravo",
          env_name: "default",
          permissions: "readonly",
          connection_url: "postgres://bravo:bravo@127.0.0.1:1/bravo",
          ssl: "on",
        }),
      });
      assert.equal(bravoDb.status, 302);

      async function addMailbox(token: string, key: string, secret: string) {
        const res = await authed(token, "/email", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            key,
            name: key,
            address: `${key}@example.com`,
            imap_host: "imap.example.com",
            imap_port: "993",
            smtp_host: "smtp.example.com",
            smtp_port: "465",
            password: secret,
            permissions: "readwrite",
            imap_secure: "on",
            smtp_secure: "on",
            append_to_sent: "on",
            sent_folder: "Sent",
          }),
        });
        assert.equal(res.status, 302, await res.text());
      }
      await addMailbox(alphaToken, "alpha-box", "alpha-mailbox-secret");
      await addMailbox(bravoToken, "bravo-box", "bravo-mailbox-secret");

      const alphaList = await authed(alphaToken, "/databases");
      const alphaHtml = await alphaList.text();
      assert.equal(alphaList.status, 200);
      assert.match(alphaHtml, /alpha-db/);
      assert.doesNotMatch(alphaHtml, /bravo-db/);
      assert.doesNotMatch(alphaHtml, /legacy-db/);

      const alphaMail = await (await authed(alphaToken, "/email")).text();
      assert.match(alphaMail, /alpha-box@example.com/);
      assert.doesNotMatch(alphaMail, /bravo-mailbox-secret/);
      assert.doesNotMatch(alphaMail, /bravo-box/);

      const superList = await (await authed(superToken, "/databases")).text();
      assert.match(superList, /alpha-db/);
      assert.match(superList, /bravo-db/);
      assert.match(superList, /legacy-db/);
      assert.match(superList, /alpha@example.com/);
      assert.match(superList, /bravo@example.com/);

      const bravoTarget = await sql<{ id: string; name: string; enabled: boolean }[]>`
        SELECT id, name, enabled FROM database_targets WHERE key = 'bravo-db'
      `;
      const bravoBox = await sql<{ id: string }[]>`SELECT id FROM email_accounts WHERE key = 'bravo-box'`;
      const alphaKeyRow = await sql<{ id: string }[]>`SELECT id FROM api_keys WHERE label = 'legacy'`;

      const hidden = await authed(alphaToken, `/databases/${bravoTarget[0].id}`);
      assert.equal(hidden.status, 404);
      const hiddenMail = await authed(alphaToken, `/email/${bravoBox[0].id}`);
      assert.equal(hiddenMail.status, 404);

      const renamed = await authed(alphaToken, `/databases/${bravoTarget[0].id}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: "bravo-db",
          name: "Stolen",
          env_name: "default",
          permissions: "readwrite",
        }),
      });
      assert.equal(renamed.status, 404);
      const toggled = await authed(alphaToken, `/databases/${bravoTarget[0].id}/toggle`, { method: "POST" });
      assert.equal(toggled.status, 404);
      const tested = await authed(alphaToken, `/databases/${bravoTarget[0].id}/test`, { method: "POST" });
      assert.equal(tested.status, 404);
      const still = await sql<{ name: string; enabled: boolean }[]>`
        SELECT name, enabled FROM database_targets WHERE id = ${bravoTarget[0].id}
      `;
      assert.equal(still[0].name, "Bravo");
      assert.equal(still[0].enabled, true);

      const usersForbidden = await authed(alphaToken, "/users");
      assert.equal(usersForbidden.status, 403);
      const usersOk = await authed(superToken, "/users");
      assert.equal(usersOk.status, 200);
      assert.match(await usersOk.text(), /Invite/);

      const beforeKeys = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM api_keys WHERE owner_id = ${alpha[0].id}`;
      const foreignKey = await authed(alphaToken, "/keys", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ label: "steal", db: bravoTarget[0].id, email: bravoBox[0].id }),
      });
      assert.equal(foreignKey.status, 302);
      const foreignLoc = foreignKey.headers.get("location") ?? "";
      assert.match(foreignLoc, /error=/);
      assert.doesNotMatch(foreignLoc, /created=/);
      const afterKeys = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM api_keys WHERE owner_id = ${alpha[0].id}`;
      assert.equal(afterKeys[0].n, beforeKeys[0].n);

      const superForeign = await authed(superToken, "/keys", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ label: "super-steal", db: bravoTarget[0].id }),
      });
      assert.match(superForeign.headers.get("location") ?? "", /error=/);

      const ownKey = await authed(alphaToken, "/keys", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ label: "alpha-key", all_db: "on", all_email: "on" }),
      });
      const created = new URL(ownKey.headers.get("location") ?? "", base).searchParams.get("created");
      assert.ok(created?.startsWith("smcp_"));
      const alphaApiKey = await lookupApiKey(created!);
      assert.equal(alphaApiKey?.ownerId, alpha[0].id);

      const revoke = await authed(bravoToken, `/keys/${alphaKeyRow[0].id}/revoke`, { method: "POST" });
      assert.equal(revoke.status, 404);
      const legacyStill = await sql<{ revoked_at: Date | null }[]>`
        SELECT revoked_at FROM api_keys WHERE id = ${alphaKeyRow[0].id}
      `;
      assert.equal(legacyStill[0].revoked_at, null);

      const poisoned = await sql<{ id: string }[]>`
        INSERT INTO api_keys (label, key_hash, key_prefix, scopes, owner_id)
        VALUES (
          'poison',
          ${hashApiKey("smcp_poisonkeypoisonkeypoisonkeypoison")},
          'smcp_poisonk',
          ${sql.json({ databases: [bravoTarget[0].id], emails: [bravoBox[0].id], readonly: false })},
          ${alpha[0].id}
        )
        RETURNING id
      `;
      const poisonKey = await lookupApiKey("smcp_poisonkeypoisonkeypoisonkeypoison");
      assert.equal(poisonKey?.id, poisoned[0].id);
      const poisonDb = await loadPostgresConfig(poisonKey!);
      assert.equal(poisonDb.databases.size, 0);
      const poisonMail = await loadEmailConfig(poisonKey!);
      assert.equal(poisonMail.accounts.size, 0);

      const alphaConfig = await loadPostgresConfig(alphaApiKey!);
      assert.deepEqual([...alphaConfig.databases.keys()], ["alpha-db"]);
      const alphaMailConfig = await loadEmailConfig(alphaApiKey!);
      assert.deepEqual([...alphaMailConfig.accounts.keys()], ["alpha-box"]);
      assert.equal(alphaMailConfig.accounts.get("alpha-box")?.password, "alpha-mailbox-secret");

      const sharedAlphaDb = await authed(alphaToken, "/databases", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: "shared-db",
          name: "Shared Alpha",
          env_name: "default",
          permissions: "readonly",
          connection_url: "postgres://alpha:alpha@127.0.0.1:1/shared-alpha",
          ssl: "on",
        }),
      });
      assert.equal(sharedAlphaDb.status, 302);
      const sharedBravoDb = await authed(bravoToken, "/databases", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: "shared-db",
          name: "Shared Bravo",
          env_name: "default",
          permissions: "readonly",
          connection_url: "postgres://bravo:bravo@127.0.0.1:1/shared-bravo",
          ssl: "on",
        }),
      });
      assert.equal(sharedBravoDb.status, 302);
      const sharedDbRows = await sql<{ owner_id: string }[]>`
        SELECT owner_id FROM database_targets WHERE key = 'shared-db'
      `;
      assert.equal(sharedDbRows.length, 2);
      const duplicateDb = await authed(alphaToken, "/databases", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: "shared-db",
          name: "Shared Alpha Again",
          env_name: "default",
          permissions: "readonly",
          connection_url: "postgres://alpha:alpha@127.0.0.1:1/shared-alpha-2",
          ssl: "on",
        }),
      });
      assert.equal(duplicateDb.status, 400);
      assert.match(await duplicateDb.text(), /already in use/);

      await addMailbox(alphaToken, "shared-box", "alpha-shared-secret");
      await addMailbox(bravoToken, "shared-box", "bravo-shared-secret");
      const sharedBoxRows = await sql<{ owner_id: string }[]>`
        SELECT owner_id FROM email_accounts WHERE key = 'shared-box'
      `;
      assert.equal(sharedBoxRows.length, 2);
      const duplicateBox = await authed(alphaToken, "/email", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: "shared-box",
          name: "shared-box-again",
          address: "shared-box-again@example.com",
          imap_host: "imap.example.com",
          imap_port: "993",
          smtp_host: "smtp.example.com",
          smtp_port: "465",
          password: "alpha-shared-secret-2",
          permissions: "readwrite",
          imap_secure: "on",
          smtp_secure: "on",
          append_to_sent: "on",
          sent_folder: "Sent",
        }),
      });
      assert.equal(duplicateBox.status, 400);
      assert.match(await duplicateBox.text(), /already in use/);

      const bravoOwn = await authed(bravoToken, "/keys", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ label: "bravo-key", all_db: "on", all_email: "on" }),
      });
      const bravoCreated = new URL(bravoOwn.headers.get("location") ?? "", base).searchParams.get("created");
      assert.ok(bravoCreated?.startsWith("smcp_"));
      const bravoApiKey = await lookupApiKey(bravoCreated!);
      const alphaShared = await loadPostgresConfig(alphaApiKey!);
      const bravoShared = await loadPostgresConfig(bravoApiKey!);
      assert.equal(
        alphaShared.databases.get("shared-db")?.environments.get("default")?.connectionUrl,
        "postgres://alpha:alpha@127.0.0.1:1/shared-alpha"
      );
      assert.equal(
        bravoShared.databases.get("shared-db")?.environments.get("default")?.connectionUrl,
        "postgres://bravo:bravo@127.0.0.1:1/shared-bravo"
      );
      assert.equal((await loadEmailConfig(alphaApiKey!)).accounts.get("shared-box")?.password, "alpha-shared-secret");
      assert.equal((await loadEmailConfig(bravoApiKey!)).accounts.get("shared-box")?.password, "bravo-shared-secret");
      assert.match(await (await authed(superToken, "/databases")).text(), /shared-db/);
      assert.match(await (await authed(superToken, "/email")).text(), /shared-box@example.com/);

      const legacy = await lookupApiKey(legacyKey);
      const legacyConfig = await loadPostgresConfig(legacy!);
      assert.deepEqual([...legacyConfig.databases.keys()], ["legacy-db"]);
      assert.equal((await loadEmailConfig(legacy!)).accounts.has("bravo-box"), false);

      const listed = await callTool(
        createPostgresMcp(alphaConfig, auditFor(alphaApiKey!, "postgres")),
        "list_databases",
        {}
      );
      assert.notEqual(listed.isError, true);
      assert.match(toolText(listed), /alpha-db/);
      assert.doesNotMatch(toolText(listed), /bravo-db/);
      assert.doesNotMatch(toolText(listed), /bravo-mailbox-secret/);

      const queried = await callTool(
        createPostgresMcp(alphaConfig, auditFor(alphaApiKey!, "postgres")),
        "query",
        { database: "bravo-db", sql: "select 1" }
      );
      assert.equal(queried.isError, true);
      const queriedText = toolText(queried);
      assert.match(queriedText, /not found/);
      assert.doesNotMatch(queriedText, /bravo-mailbox-secret/);
      assert.doesNotMatch(queriedText, /postgres:\/\/bravo/);

      const folders = await callTool(
        createEmailMcp(alphaMailConfig, auditFor(alphaApiKey!, "email")),
        "list_folders",
        { account: "bravo-box" }
      );
      assert.equal(folders.isError, true);
      assert.match(toolText(folders), /not found/);
      assert.doesNotMatch(toolText(folders), /bravo-mailbox-secret/);

      const mcpCalls = await sql<{ tool: string; target: string | null; success: boolean; user_id: string; api_key_id: string }[]>`
        SELECT tool, target, success, user_id, api_key_id
        FROM audit_log
        WHERE action = 'mcp.tool' AND api_key_id = ${alphaApiKey!.id}
        ORDER BY created_at
      `;
      assert.deepEqual(
        mcpCalls.map((row) => [row.tool, row.target, row.success, row.user_id]),
        [
          ["list_databases", null, true, alpha[0].id],
          ["query", "bravo-db", false, alpha[0].id],
          ["list_folders", "bravo-box", false, alpha[0].id],
        ]
      );

      const alphaAudit = await (await authed(alphaToken, "/audit")).text();
      assert.match(alphaAudit, /mcp\.tool/);
      assert.match(alphaAudit, /bravo-db/);
      assert.doesNotMatch(alphaAudit, /bravo@example.com/);
      const bravoAudit = await (await authed(bravoToken, "/audit")).text();
      assert.doesNotMatch(bravoAudit, /mcp\.tool/);
      assert.match(bravoAudit, /bravo@example.com/);
      const superAudit = await (await authed(superToken, "/audit")).text();
      assert.match(superAudit, /alpha@example.com/);
      assert.match(superAudit, /bravo@example.com/);
      assert.match(superAudit, /mcp\.tool/);

      const anon = await fetch(base + "/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "x-agent-mcp": "postgres",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "query", arguments: { database: "bravo-db", sql: "select 1" } },
        }),
      });
      assert.equal(anon.status, 401);

      const authedMcp = await fetch(base + "/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          authorization: `Bearer ${created}`,
          "x-agent-mcp": "postgres",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "query", arguments: { database: "bravo-db", sql: "select 1" } },
        }),
      });
      const mcpBody = await authedMcp.text();
      assert.equal(authedMcp.status, 200, mcpBody);
      assert.match(mcpBody, /not found/);
      assert.doesNotMatch(mcpBody, /bravo-mailbox-secret/);
      assert.doesNotMatch(mcpBody, /postgres:\/\/bravo/);

      const httpAudit = await sql<{ n: number }[]>`
        SELECT count(*)::int AS n FROM audit_log
        WHERE action = 'mcp.tool' AND api_key_id = ${alphaApiKey!.id} AND tool = 'query' AND target = 'bravo-db' AND success = false
      `;
      assert.ok(httpAudit[0].n >= 2);
    });

    await t.test("invite is one-time and the new user is isolated", async () => {
      const superRows = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${adminEmail}`;
      const superToken = await createSession(superRows[0].id, false);
      const invited = await fetch(base + "/users/invites", {
        method: "POST",
        redirect: "manual",
        headers: {
          cookie: `agent_mcp_sid=${superToken}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email: "invitee@example.com" }),
      });
      assert.equal(invited.status, 302);
      const link = new URL(invited.headers.get("location") ?? "", base).searchParams.get("invite") ?? "";
      const inviteToken = link.split("/invite/")[1];
      assert.ok(inviteToken);

      let cookies = "";
      const accepted = await fetch(`${base}/invite/${inviteToken}`, {
        method: "POST",
        redirect: "manual",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ password: "invitee-password-12", confirm: "invitee-password-12" }),
      });
      assert.equal(accepted.status, 302);
      assert.equal(accepted.headers.get("location"), "/enroll-totp");
      cookies = mergeCookies(cookies, accepted);

      const enrollPage = await fetch(base + "/enroll-totp", { headers: { cookie: cookies } });
      cookies = mergeCookies(cookies, enrollPage);
      const enrollHtml = await enrollPage.text();
      const secret = enrollHtml.match(/<div class="secret">([A-Z2-7]+)<\/div>/)?.[1];
      assert.ok(secret);
      const enrolled = await fetch(base + "/enroll-totp", {
        method: "POST",
        redirect: "manual",
        headers: { cookie: cookies, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code: totpCode(secret) }),
      });
      assert.equal(enrolled.status, 302);
      assert.equal(enrolled.headers.get("location"), "/databases");
      cookies = mergeCookies(cookies, enrolled);

      const home = await fetch(base + "/databases", { headers: { cookie: cookies } });
      const homeHtml = await home.text();
      assert.equal(home.status, 200);
      assert.doesNotMatch(homeHtml, /alpha-db/);
      assert.doesNotMatch(homeHtml, /bravo-db/);
      assert.match(homeHtml, /invitee@example.com/);

      const reused = await fetch(`${base}/invite/${inviteToken}`, { redirect: "manual" });
      assert.equal(reused.status, 404);

      await fetch(base + "/logout", { method: "POST", headers: { cookie: cookies }, redirect: "manual" });
      const login = await fetch(base + "/login", {
        method: "POST",
        redirect: "manual",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: "invitee@example.com", password: "invitee-password-12" }),
      });
      assert.equal(login.status, 302);
      assert.equal(login.headers.get("location"), "/login/totp");
      let loginCookies = mergeCookies("", login);
      const totp = await fetch(base + "/login/totp", {
        method: "POST",
        redirect: "manual",
        headers: { cookie: loginCookies, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code: totpCode(secret) }),
      });
      assert.equal(totp.status, 302);
      assert.equal(totp.headers.get("location"), "/databases");
      loginCookies = mergeCookies(loginCookies, totp);
      const afterLogin = await fetch(base + "/databases", { headers: { cookie: loginCookies } });
      assert.equal(afterLogin.status, 200);
      assert.doesNotMatch(await afterLogin.text(), /legacy-db/);

      const invitee = await sql<{ role: string; totp_enabled: boolean }[]>`
        SELECT role, totp_enabled FROM users WHERE email = 'invitee@example.com'
      `;
      assert.equal(invitee[0].role, "user");
      assert.equal(invitee[0].totp_enabled, true);
    });
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }
});

after(async () => {
  await closePlatformDb();
});
