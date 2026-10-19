import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, test } from "node:test";
import { hashPassword } from "../src/auth/passwords.js";
import { createSession } from "../src/auth/sessions.js";
import { sql, closePlatformDb } from "../src/db/client.js";
import { migrate } from "../src/db/migrate.js";
import { createApp } from "../src/http/app.js";

const databaseUrl = process.env.DATABASE_URL ?? "";

async function reset(): Promise<void> {
  await sql.unsafe(`
    DROP TABLE IF EXISTS
      audit_log, sessions, user_invites, api_keys, email_accounts,
      database_environments, database_targets, users, admins, vault_secrets
    CASCADE
  `);
  await migrate();
}

after(async () => {
  await closePlatformDb();
});

test("SMTP column defaults change without rewriting existing rows", async () => {
  assert.match(databaseUrl, /agent_mcp_test/, "DATABASE_URL must contain agent_mcp_test");
  await reset();

  await sql`ALTER TABLE email_accounts ALTER COLUMN smtp_port SET DEFAULT 465`;
  await sql`ALTER TABLE email_accounts ALTER COLUMN smtp_secure SET DEFAULT true`;
  await sql`
    INSERT INTO email_accounts (key, name, address, imap_host, smtp_host)
    VALUES ('old-box', 'Old', 'old@example.com', 'imap.example.com', 'smtp.example.com')
  `;

  const before = await sql<{ smtp_port: number; smtp_secure: boolean }[]>`
    SELECT smtp_port, smtp_secure FROM email_accounts WHERE key = 'old-box'
  `;
  assert.equal(before[0].smtp_port, 465);
  assert.equal(before[0].smtp_secure, true);

  await migrate();

  const afterMigrate = await sql<{ smtp_port: number; smtp_secure: boolean }[]>`
    SELECT smtp_port, smtp_secure FROM email_accounts WHERE key = 'old-box'
  `;
  assert.deepEqual(afterMigrate[0], { smtp_port: 465, smtp_secure: true });

  await sql`
    INSERT INTO email_accounts (key, name, address, imap_host, smtp_host)
    VALUES ('new-box', 'New', 'new@example.com', 'imap.example.com', 'smtp.example.com')
  `;
  const created = await sql<{ smtp_port: number; smtp_secure: boolean }[]>`
    SELECT smtp_port, smtp_secure FROM email_accounts WHERE key = 'new-box'
  `;
  assert.deepEqual(created[0], { smtp_port: 587, smtp_secure: false });

  const defaults = await sql<{ column_name: string; column_default: string | null }[]>`
    SELECT column_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_accounts'
      AND column_name IN ('smtp_port', 'smtp_secure')
  `;
  const byName = Object.fromEntries(defaults.map((row) => [row.column_name, row.column_default]));
  assert.equal(byName.smtp_port, "587");
  assert.equal(byName.smtp_secure, "false");
});

test("mailbox form defaults to 587 STARTTLS and still edits a port 465 mailbox", async () => {
  assert.match(databaseUrl, /agent_mcp_test/, "DATABASE_URL must contain agent_mcp_test");
  await reset();

  const passwordHash = await hashPassword("mailbox-user-password-12");
  const user = await sql<{ id: string }[]>`
    INSERT INTO users (email, password_hash, role, totp_enabled)
    VALUES ('mailbox@example.com', ${passwordHash}, 'user', true)
    RETURNING id
  `;
  const token = await createSession(user[0].id, false);
  const app = createApp();
  const server: Server = app.listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  async function authed(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("cookie", `agent_mcp_sid=${token}`);
    return fetch(base + path, { ...init, headers, redirect: "manual" });
  }

  try {
    const fresh = await authed("/email/new");
    assert.equal(fresh.status, 200);
    const html = await fresh.text();
    assert.match(html, /id="smtp_port"[^>]*value="587"/);
    assert.match(html, /Use 587 \+ TLS \(STARTTLS\)\. Port 465 is blocked on this server\./);
    assert.doesNotMatch(html, /id="smtp_secure"[^>]*\schecked/);
    assert.match(html, /id="smtp-465-warn"[^>]*\shidden/);

    const omitted = await authed("/email", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: "default-box",
        name: "Default",
        address: "default@example.com",
        imap_host: "imap.example.com",
        smtp_host: "smtp.example.com",
        password: "secret-password",
      }),
    });
    assert.equal(omitted.status, 302);
    const stored = await sql<{ smtp_port: number; smtp_secure: boolean }[]>`
      SELECT smtp_port, smtp_secure FROM email_accounts WHERE key = 'default-box'
    `;
    assert.deepEqual(stored[0], { smtp_port: 587, smtp_secure: false });

    const legacy = await authed("/email", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: "legacy-465",
        name: "Legacy",
        address: "legacy465@example.com",
        imap_host: "imap.example.com",
        imap_port: "993",
        imap_secure: "on",
        smtp_host: "smtp.example.com",
        smtp_port: "465",
        smtp_secure: "on",
        password: "secret-password",
        permissions: "readwrite",
      }),
    });
    assert.equal(legacy.status, 302);
    const location = legacy.headers.get("location") ?? "";
    assert.match(location, /^\/email\/[0-9a-f-]+\?ok=/);
    const edit = await authed(location.split("?")[0]);
    assert.equal(edit.status, 200);
    const editHtml = await edit.text();
    assert.match(editHtml, /id="smtp_port"[^>]*value="465"/);
    assert.match(editHtml, /id="smtp_secure"[^>]*\schecked/);
    assert.doesNotMatch(editHtml, /id="smtp-465-warn"[^>]*\shidden/);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
