import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";
import { hashPassword } from "../src/auth/passwords.js";
import { createSession } from "../src/auth/sessions.js";
import { sql, closePlatformDb } from "../src/db/client.js";
import { migrate } from "../src/db/migrate.js";
import { createApp } from "../src/http/app.js";
import { readSecret } from "../src/targets.js";

const databaseUrl = process.env.DATABASE_URL ?? "";

test("rotating mailbox and database secrets", async () => {
  assert.match(databaseUrl, /agent_mcp_test/, "DATABASE_URL must contain agent_mcp_test");

  await sql.unsafe(`
    DROP TABLE IF EXISTS
      audit_log, sessions, user_invites, api_keys, email_accounts,
      database_environments, database_targets, users, admins, vault_secrets
    CASCADE
  `);
  await migrate();

  const passwordHash = await hashPassword("rotate-user-password-12");
  const user = await sql<{ id: string }[]>`
    INSERT INTO users (email, password_hash, role)
    VALUES ('rotate@example.com', ${passwordHash}, 'user')
    RETURNING id
  `;
  const ownerId = user[0].id;
  const token = await createSession(ownerId, false);

  const app = createApp();
  const server: Server = app.listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  try {
    async function authed(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers);
      headers.set("cookie", `agent_mcp_sid=${token}`);
      return fetch(base + path, { ...init, headers, redirect: "manual" });
    }

    const createDb = await authed("/databases", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: "rotate-db",
        name: "Rotate DB",
        env_name: "default",
        permissions: "readonly",
        connection_url: "postgres://old:old@127.0.0.1:1/olddb",
        ssl: "on",
      }),
    });
    assert.equal(createDb.status, 302, await createDb.text());

    const target = await sql<{ id: string }[]>`SELECT id FROM database_targets WHERE key = 'rotate-db' AND owner_id = ${ownerId}`;
    const envBefore = await sql<{ id: string; connection_url_secret_id: string }[]>`
      SELECT id, connection_url_secret_id
      FROM database_environments
      WHERE database_id = ${target[0].id} AND name = 'default'
    `;
    const oldDbSecretId = envBefore[0].connection_url_secret_id;
    assert.equal(await readSecret(oldDbSecretId, ownerId), "postgres://old:old@127.0.0.1:1/olddb");

    const updateDb = await authed(`/databases/${target[0].id}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: "rotate-db",
        name: "Rotate DB",
        env_name: "default",
        permissions: "readonly",
        connection_url: "postgres://new:new@127.0.0.1:1/newdb",
        ssl: "on",
      }),
    });
    assert.equal(updateDb.status, 302, await updateDb.text());

    const envAfter = await sql<{ connection_url_secret_id: string }[]>`
      SELECT connection_url_secret_id FROM database_environments WHERE id = ${envBefore[0].id}
    `;
    const newDbSecretId = envAfter[0].connection_url_secret_id;
    assert.notEqual(newDbSecretId, oldDbSecretId);
    assert.equal(await readSecret(newDbSecretId, ownerId), "postgres://new:new@127.0.0.1:1/newdb");

    const oldDbSecretRows = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM vault_secrets WHERE id = ${oldDbSecretId}
    `;
    assert.equal(oldDbSecretRows[0].n, 0);

    const createMail = await authed("/email", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: "rotate-box",
        name: "Rotate Box",
        address: "rotate@example.com",
        imap_host: "imap.example.com",
        imap_port: "993",
        smtp_host: "smtp.example.com",
        smtp_port: "465",
        password: "old-mailbox-password",
        permissions: "readwrite",
        imap_secure: "on",
        smtp_secure: "on",
        append_to_sent: "on",
        sent_folder: "Sent",
      }),
    });
    assert.equal(createMail.status, 302, await createMail.text());

    const mailbox = await sql<{ id: string; password_secret_id: string }[]>`
      SELECT id, password_secret_id FROM email_accounts WHERE key = 'rotate-box' AND owner_id = ${ownerId}
    `;
    const oldMailSecretId = mailbox[0].password_secret_id;
    assert.equal(await readSecret(oldMailSecretId, ownerId), "old-mailbox-password");

    const updateMail = await authed(`/email/${mailbox[0].id}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: "rotate-box",
        name: "Rotate Box",
        address: "rotate@example.com",
        imap_host: "imap.example.com",
        imap_port: "993",
        smtp_host: "smtp.example.com",
        smtp_port: "465",
        password: "new-mailbox-password",
        permissions: "readwrite",
        imap_secure: "on",
        smtp_secure: "on",
        append_to_sent: "on",
        sent_folder: "Sent",
      }),
    });
    assert.equal(updateMail.status, 302, await updateMail.text());

    const mailAfter = await sql<{ password_secret_id: string }[]>`
      SELECT password_secret_id FROM email_accounts WHERE id = ${mailbox[0].id}
    `;
    const newMailSecretId = mailAfter[0].password_secret_id;
    assert.notEqual(newMailSecretId, oldMailSecretId);
    assert.equal(await readSecret(newMailSecretId, ownerId), "new-mailbox-password");

    const oldMailSecretRows = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM vault_secrets WHERE id = ${oldMailSecretId}
    `;
    assert.equal(oldMailSecretRows[0].n, 0);

    const orphans = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n
      FROM vault_secrets v
      WHERE v.owner_id = ${ownerId}
        AND NOT EXISTS (SELECT 1 FROM email_accounts e WHERE e.password_secret_id = v.id)
        AND NOT EXISTS (SELECT 1 FROM database_environments d WHERE d.connection_url_secret_id = v.id)
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.totp_secret_id = v.id)
    `;
    assert.equal(orphans[0].n, 0);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

after(async () => {
  await closePlatformDb();
});
