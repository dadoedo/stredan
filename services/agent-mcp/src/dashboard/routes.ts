import { ImapFlow } from "imapflow";
import type { NextFunction, Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { sql } from "../db/client.js";
import { audit } from "../audit.js";
import { createApiKey, revokeApiKey } from "../auth/api-keys.js";
import { verifyPassword } from "../auth/passwords.js";
import { loginAllowed, recordLoginAttempt, remainingLoginAttempts } from "../auth/rate-limit.js";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  loadSession,
  promoteSession,
  readSessionCookie,
  setSessionCookie,
} from "../auth/sessions.js";
import { generateTotpSecret, loadAdminTotpSecret, storeAdminTotpSecret, totpQrDataUrl, verifyTotp } from "../auth/totp.js";
import { esc, flashHtml, layout } from "./html.js";
import { buildConnectionUrl, replaceSecret, secretHint, testPostgresConnection } from "../targets.js";
import type { AdminSession, ApiKeyScope, Permissions } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      adminSession?: AdminSession;
    }
  }
}

function clientIp(req: Request): string {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip || "unknown";
}

function asPerm(value: unknown): Permissions {
  return value === "readwrite" ? "readwrite" : "readonly";
}

function bool(value: unknown): boolean {
  return value === "on" || value === "true" || value === true;
}

function idParam(req: Request): string {
  const value = req.params.id;
  const id = Array.isArray(value) ? value[0] : value;
  if (typeof id !== "string" || !id) {
    throw new Error("Missing route id");
  }
  return id;
}

async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = readSessionCookie(req);
  if (!token) {
    res.redirect("/login");
    return;
  }
  const session = await loadSession(token);
  if (!session) {
    clearSessionCookie(res);
    res.redirect("/login");
    return;
  }
  req.adminSession = session;
  if (session.pendingTotp && !req.path.startsWith("/login") && req.path !== "/logout" && req.path !== "/enroll-totp") {
    res.redirect(session.totpEnabled ? "/login/totp" : "/enroll-totp");
    return;
  }
  next();
}

export function dashboardRouter(): Router {
  const router = createRouter();

  router.get("/login", (req, res) => {
    if (req.adminSession && !req.adminSession.pendingTotp) {
      res.redirect("/databases");
      return;
    }
    res.type("html").send(
      layout({
        title: "Sign in",
        body: `
          <div class="login">
            <h1>Sign in</h1>
            <p class="lede">Password, then authenticator app. Single operator.</p>
            ${req.query.error ? flashHtml("error", String(req.query.error)) : ""}
            <form class="card" method="post" action="/login">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" autocomplete="username" required />
              <label for="password">Password</label>
              <input id="password" name="password" type="password" autocomplete="current-password" required />
              <div class="actions"><button type="submit">Continue</button></div>
            </form>
          </div>`,
      })
    );
  });

  router.post("/login", async (req, res) => {
    const ip = clientIp(req);
    if (!loginAllowed(ip)) {
      res.status(429).type("html").send(
        layout({
          title: "Sign in",
          body: flashHtml("error", "Too many attempts. Try again in 15 minutes."),
        })
      );
      return;
    }
    recordLoginAttempt(ip);
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const rows = await sql<{ id: string; email: string; password_hash: string; totp_enabled: boolean }[]>`
      SELECT id, email, password_hash, totp_enabled FROM admins WHERE email = ${email}
    `;
    const admin = rows[0];
    if (!admin || !(await verifyPassword(password, admin.password_hash))) {
      res.redirect(`/login?error=${encodeURIComponent("Invalid email or password. " + remainingLoginAttempts(ip) + " attempts left.")}`);
      return;
    }
    const token = await createSession(admin.id, true);
    setSessionCookie(res, token, true);
    await audit(admin.id, "login.password");
    res.redirect(admin.totp_enabled ? "/login/totp" : "/enroll-totp");
  });

  router.get("/login/totp", requireSession, async (req, res) => {
    res.type("html").send(
      layout({
        title: "Authenticator",
        session: req.adminSession,
        body: `
          <div class="login">
            <h1>Authenticator</h1>
            <p class="lede">Enter the 6-digit code from your authenticator app.</p>
            ${req.query.error ? flashHtml("error", String(req.query.error)) : ""}
            <form class="card" method="post" action="/login/totp">
              <label for="code">TOTP code</label>
              <input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" required pattern="[0-9 ]{6,8}" />
              <div class="actions"><button type="submit">Verify</button></div>
            </form>
          </div>`,
      })
    );
  });

  router.post("/login/totp", requireSession, async (req, res) => {
    const session = req.adminSession!;
    const secret = await loadAdminTotpSecret(session.adminId);
    const code = String(req.body.code ?? "");
    if (!secret || !verifyTotp(secret, code)) {
      res.redirect(`/login/totp?error=${encodeURIComponent("Invalid authenticator code.")}`);
      return;
    }
    await promoteSession(session.id);
    await audit(session.adminId, "login.totp");
    const token = readSessionCookie(req);
    if (token) setSessionCookie(res, token, false);
    res.redirect("/databases");
  });

  router.get("/enroll-totp", requireSession, async (req, res) => {
    const session = req.adminSession!;
    if (session.totpEnabled) {
      res.redirect("/login/totp");
      return;
    }
    const generated = generateTotpSecret();
    res.cookie("agent_mcp_totp_tmp", generated.base32, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE !== "false",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });
    const qr = await totpQrDataUrl(generated.uri);
    res.type("html").send(
      layout({
        title: "Enroll TOTP",
        session,
        body: `
          <div class="login">
            <h1>Protect this console</h1>
            <p class="lede">Scan with an authenticator app, then enter a code to finish enrollment. The secret is stored encrypted and never shown again.</p>
            <div class="card">
              <img alt="TOTP QR code" src="${qr}" width="220" height="220" />
              <p class="muted">If you cannot scan, use this secret:</p>
              <div class="secret">${esc(generated.base32)}</div>
              <form method="post" action="/enroll-totp">
                <label for="code">First code</label>
                <input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" required />
                <div class="actions"><button type="submit">Enable TOTP</button></div>
              </form>
            </div>
          </div>`,
      })
    );
  });

  router.post("/enroll-totp", requireSession, async (req, res) => {
    const session = req.adminSession!;
    const pending = String(req.cookies?.agent_mcp_totp_tmp ?? "");
    const code = String(req.body.code ?? "");
    if (!pending || !verifyTotp(pending, code)) {
      res.redirect("/enroll-totp");
      return;
    }
    await storeAdminTotpSecret(session.adminId, pending);
    await promoteSession(session.id);
    await audit(session.adminId, "totp.enrolled");
    res.clearCookie("agent_mcp_totp_tmp", { path: "/" });
    const token = readSessionCookie(req);
    if (token) setSessionCookie(res, token, false);
    res.redirect("/databases");
  });

  router.post("/logout", async (req, res) => {
    const token = readSessionCookie(req);
    if (token) await destroySession(token);
    clearSessionCookie(res);
    res.redirect("/login");
  });

  router.get("/", requireSession, (_req, res) => res.redirect("/databases"));

  router.get("/databases", requireSession, async (req, res) => {
    const dbs = await sql<{
      id: string;
      key: string;
      name: string;
      enabled: boolean;
      env_count: number;
    }[]>`
      SELECT t.id, t.key, t.name, t.enabled, count(e.id)::int AS env_count
      FROM database_targets t
      LEFT JOIN database_environments e ON e.database_id = t.id
      GROUP BY t.id
      ORDER BY t.key
    `;
    const rows = dbs
      .map(
        (db) => `<tr>
          <td><a href="/databases/${db.id}">${esc(db.key)}</a></td>
          <td>${esc(db.name)}</td>
          <td>${db.env_count}</td>
          <td>${db.enabled ? '<span class="badge ok">on</span>' : '<span class="badge">off</span>'}</td>
        </tr>`
      )
      .join("");
    res.type("html").send(
      layout({
        title: "Databases",
        session: req.adminSession,
        active: "databases",
        body: `
          <h1>Postgres targets</h1>
          <p class="lede">Connection secrets are encrypted at rest. After save, only a last-4 hint is shown.</p>
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          <p><a class="btn" href="/databases/new">Add database</a></p>
          <div class="card" style="padding:0 8px">
            <table>
              <thead><tr><th>Key</th><th>Name</th><th>Envs</th><th>Status</th></tr></thead>
              <tbody>${rows || '<tr><td colspan="4" class="muted">None yet.</td></tr>'}</tbody>
            </table>
          </div>`,
      })
    );
  });

  router.get("/databases/new", requireSession, (req, res) => {
    res.type("html").send(
      layout({
        title: "Add database",
        session: req.adminSession,
        active: "databases",
        body: databaseForm({}),
      })
    );
  });

  router.post("/databases", requireSession, async (req, res) => {
    try {
      const saved = await upsertDatabase(req, null);
      await audit(req.adminSession!.adminId, "database.create", "database", saved.id, { key: saved.key });
      res.redirect(`/databases/${saved.id}?ok=${encodeURIComponent("Saved.")}`);
    } catch (error) {
      res.status(400).type("html").send(
        layout({
          title: "Add database",
          session: req.adminSession,
          active: "databases",
          body: flashHtml("error", error instanceof Error ? error.message : String(error)) + databaseForm(req.body),
        })
      );
    }
  });

  router.get("/databases/:id", requireSession, async (req, res) => {
    const db = await loadDatabase(idParam(req));
    if (!db) {
      res.status(404).send("Not found");
      return;
    }
    res.type("html").send(
      layout({
        title: db.key,
        session: req.adminSession,
        active: "databases",
        body: `
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          ${req.query.error ? flashHtml("error", String(req.query.error)) : ""}
          ${databaseForm(db, db.id)}
          <hr class="sep" />
          <form method="post" action="/databases/${db.id}/test">
            <button class="ghost" type="submit">Test connection</button>
          </form>
          <form method="post" action="/databases/${db.id}/toggle" style="margin-top:8px">
            <button class="ghost" type="submit">${db.enabled ? "Disable" : "Enable"}</button>
          </form>`,
      })
    );
  });

  router.post("/databases/:id", requireSession, async (req, res) => {
    try {
      const saved = await upsertDatabase(req, idParam(req));
      await audit(req.adminSession!.adminId, "database.update", "database", saved.id);
      res.redirect(`/databases/${saved.id}?ok=${encodeURIComponent("Updated.")}`);
    } catch (error) {
      res.redirect(`/databases/${idParam(req)}?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
    }
  });

  router.post("/databases/:id/toggle", requireSession, async (req, res) => {
    await sql`UPDATE database_targets SET enabled = NOT enabled, updated_at = now() WHERE id = ${idParam(req)}`;
    await audit(req.adminSession!.adminId, "database.toggle", "database", idParam(req));
    res.redirect(`/databases/${idParam(req)}?ok=${encodeURIComponent("Status updated.")}`);
  });

  router.post("/databases/:id/test", requireSession, async (req, res) => {
    const envRows = await sql<{ connection_url_secret_id: string | null }[]>`
      SELECT connection_url_secret_id FROM database_environments
      WHERE database_id = ${idParam(req)}
      ORDER BY name LIMIT 1
    `;
    const secretId = envRows[0]?.connection_url_secret_id;
    if (!secretId) {
      res.redirect(`/databases/${idParam(req)}?error=${encodeURIComponent("No connection stored yet.")}`);
      return;
    }
    const { readSecret } = await import("../targets.js");
    const url = await readSecret(secretId);
    const result = await testPostgresConnection(url);
    if (result.ok) {
      res.redirect(`/databases/${idParam(req)}?ok=${encodeURIComponent("Connection succeeded.")}`);
    } else {
      res.redirect(`/databases/${idParam(req)}?error=${encodeURIComponent(result.error)}`);
    }
  });

  router.get("/email", requireSession, async (req, res) => {
    const accounts = await sql<{
      id: string;
      key: string;
      name: string;
      address: string;
      permissions: string;
      enabled: boolean;
    }[]>`
      SELECT id, key, name, address, permissions, enabled FROM email_accounts ORDER BY key
    `;
    const rows = accounts
      .map(
        (a) => `<tr>
          <td><a href="/email/${a.id}">${esc(a.key)}</a></td>
          <td>${esc(a.address)}</td>
          <td><span class="badge">${esc(a.permissions)}</span></td>
          <td>${a.enabled ? '<span class="badge ok">on</span>' : '<span class="badge">off</span>'}</td>
        </tr>`
      )
      .join("");
    res.type("html").send(
      layout({
        title: "Email",
        session: req.adminSession,
        active: "email",
        body: `
          <h1>Mailboxes</h1>
          <p class="lede">IMAP/SMTP passwords are encrypted. Datacenter IPs are sometimes blocked by providers — test after save.</p>
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          <p><a class="btn" href="/email/new">Add mailbox</a></p>
          <div class="card" style="padding:0 8px">
            <table>
              <thead><tr><th>Key</th><th>Address</th><th>Perms</th><th>Status</th></tr></thead>
              <tbody>${rows || '<tr><td colspan="4" class="muted">None yet.</td></tr>'}</tbody>
            </table>
          </div>`,
      })
    );
  });

  router.get("/email/new", requireSession, (req, res) => {
    res.type("html").send(layout({ title: "Add mailbox", session: req.adminSession, active: "email", body: emailForm({}) }));
  });

  router.post("/email", requireSession, async (req, res) => {
    try {
      const saved = await upsertEmail(req, null);
      await audit(req.adminSession!.adminId, "email.create", "email", saved.id, { key: saved.key });
      res.redirect(`/email/${saved.id}?ok=${encodeURIComponent("Saved.")}`);
    } catch (error) {
      res.status(400).type("html").send(
        layout({
          title: "Add mailbox",
          session: req.adminSession,
          active: "email",
          body: flashHtml("error", error instanceof Error ? error.message : String(error)) + emailForm(req.body),
        })
      );
    }
  });

  router.get("/email/:id", requireSession, async (req, res) => {
    const account = await loadEmail(idParam(req));
    if (!account) {
      res.status(404).send("Not found");
      return;
    }
    res.type("html").send(
      layout({
        title: account.key,
        session: req.adminSession,
        active: "email",
        body: `
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          ${req.query.error ? flashHtml("error", String(req.query.error)) : ""}
          ${emailForm(account, account.id)}
          <hr class="sep" />
          <form method="post" action="/email/${account.id}/test"><button class="ghost" type="submit">Test IMAP</button></form>
          <form method="post" action="/email/${account.id}/toggle" style="margin-top:8px">
            <button class="ghost" type="submit">${account.enabled ? "Disable" : "Enable"}</button>
          </form>`,
      })
    );
  });

  router.post("/email/:id", requireSession, async (req, res) => {
    try {
      const saved = await upsertEmail(req, idParam(req));
      await audit(req.adminSession!.adminId, "email.update", "email", saved.id);
      res.redirect(`/email/${saved.id}?ok=${encodeURIComponent("Updated.")}`);
    } catch (error) {
      res.redirect(`/email/${idParam(req)}?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
    }
  });

  router.post("/email/:id/toggle", requireSession, async (req, res) => {
    await sql`UPDATE email_accounts SET enabled = NOT enabled, updated_at = now() WHERE id = ${idParam(req)}`;
    await audit(req.adminSession!.adminId, "email.toggle", "email", idParam(req));
    res.redirect(`/email/${idParam(req)}?ok=${encodeURIComponent("Status updated.")}`);
  });

  router.post("/email/:id/test", requireSession, async (req, res) => {
    const account = await loadEmail(idParam(req));
    if (!account?.password_secret_id) {
      res.redirect(`/email/${idParam(req)}?error=${encodeURIComponent("No password stored.")}`);
      return;
    }
    const { readSecret } = await import("../targets.js");
    const password = await readSecret(account.password_secret_id);
    try {
      const client = new ImapFlow({
        host: account.imap_host,
        port: account.imap_port,
        secure: account.imap_secure,
        auth: { user: account.imap_user?.trim() || account.address, pass: password },
        logger: false,
      });
      client.on("error", () => {});
      await client.connect();
      await client.logout().catch(() => {});
      res.redirect(`/email/${idParam(req)}?ok=${encodeURIComponent("IMAP connection succeeded.")}`);
    } catch (error) {
      res.redirect(`/email/${idParam(req)}?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
    }
  });

  router.get("/keys", requireSession, async (req, res) => {
    const keys = await sql<{
      id: string;
      label: string;
      key_prefix: string;
      scopes: unknown;
      revoked_at: Date | null;
      last_used_at: Date | null;
      created_at: Date;
    }[]>`
      SELECT id, label, key_prefix, scopes, revoked_at, last_used_at, created_at
      FROM api_keys ORDER BY created_at DESC
    `;
    const dbs = await sql<{ id: string; key: string }[]>`SELECT id, key FROM database_targets ORDER BY key`;
    const emails = await sql<{ id: string; key: string }[]>`SELECT id, key FROM email_accounts ORDER BY key`;
    const rows = keys
      .map((k) => {
        const scopes = (k.scopes ?? {}) as { readonly?: boolean };
        return `<tr>
          <td>${esc(k.label)}</td>
          <td class="muted">${esc(k.key_prefix)}…</td>
          <td>${scopes.readonly ? '<span class="badge warn">readonly</span>' : '<span class="badge">readwrite</span>'}</td>
          <td>${k.revoked_at ? '<span class="badge danger">revoked</span>' : '<span class="badge ok">active</span>'}</td>
          <td class="muted">${k.last_used_at ? new Date(k.last_used_at).toISOString() : "never"}</td>
          <td>${k.revoked_at ? "" : `<form method="post" action="/keys/${k.id}/revoke"><button class="danger" type="submit">Revoke</button></form>`}</td>
        </tr>`;
      })
      .join("");
    const dbChecks = dbs.map((d) => `<div class="check"><input type="checkbox" name="db" value="${esc(d.id)}" /><label>${esc(d.key)}</label></div>`).join("");
    const emailChecks = emails
      .map((e) => `<div class="check"><input type="checkbox" name="email" value="${esc(e.id)}" /><label>${esc(e.key)}</label></div>`)
      .join("");
    res.type("html").send(
      layout({
        title: "API keys",
        session: req.adminSession,
        active: "keys",
        body: `
          <h1>API keys</h1>
          <p class="lede">Bearer tokens for Cursor Team MCP. Hashed at rest. The plaintext is shown once.</p>
          ${req.query.created ? flashHtml("warn", "Copy this key now. It will not be shown again.") + `<div class="secret">${esc(String(req.query.created))}</div>` : ""}
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          <div class="card">
            <h2>Create key</h2>
            <form method="post" action="/keys">
              <label>Label</label>
              <input name="label" required placeholder="Cursor Cloud Agents" />
              <div class="check"><input type="checkbox" name="readonly" /><label>Force readonly (even if a target is readwrite)</label></div>
              <div class="check"><input type="checkbox" name="all_db" checked /><label>All databases</label></div>
              <div class="check"><input type="checkbox" name="all_email" checked /><label>All mailboxes</label></div>
              <p class="muted">Or pick specific targets (uncheck “all” first):</p>
              <div class="grid grid-2">
                <div><strong>Databases</strong>${dbChecks || '<p class="muted">None</p>'}</div>
                <div><strong>Email</strong>${emailChecks || '<p class="muted">None</p>'}</div>
              </div>
              <div class="actions"><button type="submit">Create key</button></div>
            </form>
          </div>
          <h2>Existing</h2>
          <div class="card" style="padding:0 8px">
            <table>
              <thead><tr><th>Label</th><th>Prefix</th><th>Mode</th><th>Status</th><th>Last used</th><th></th></tr></thead>
              <tbody>${rows || '<tr><td colspan="6" class="muted">None yet.</td></tr>'}</tbody>
            </table>
          </div>`,
      })
    );
  });

  router.post("/keys", requireSession, async (req, res) => {
    const label = String(req.body.label ?? "").trim();
    if (!label) {
      res.redirect("/keys");
      return;
    }
    const scopes: ApiKeyScope = {
      databases: bool(req.body.all_db) ? "*" : [].concat(req.body.db || []),
      emails: bool(req.body.all_email) ? "*" : [].concat(req.body.email || []),
      readonly: bool(req.body.readonly),
    };
    const created = await createApiKey(label, scopes);
    await audit(req.adminSession!.adminId, "apikey.create", "api_key", created.id, { label });
    res.redirect(`/keys?created=${encodeURIComponent(created.plaintext)}`);
  });

  router.post("/keys/:id/revoke", requireSession, async (req, res) => {
    await revokeApiKey(idParam(req));
    await audit(req.adminSession!.adminId, "apikey.revoke", "api_key", idParam(req));
    res.redirect(`/keys?ok=${encodeURIComponent("Key revoked.")}`);
  });

  router.get("/audit", requireSession, async (req, res) => {
    const rows = await sql<{ action: string; entity_type: string | null; created_at: Date; email: string | null }[]>`
      SELECT a.action, a.entity_type, a.created_at, adm.email
      FROM audit_log a
      LEFT JOIN admins adm ON adm.id = a.admin_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `;
    const body = rows
      .map(
        (r) => `<tr>
          <td class="muted">${esc(new Date(r.created_at).toISOString())}</td>
          <td>${esc(r.email)}</td>
          <td>${esc(r.action)}</td>
          <td class="muted">${esc(r.entity_type)}</td>
        </tr>`
      )
      .join("");
    res.type("html").send(
      layout({
        title: "Audit",
        session: req.adminSession,
        active: "audit",
        body: `
          <h1>Audit log</h1>
          <div class="card" style="padding:0 8px">
            <table>
              <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Entity</th></tr></thead>
              <tbody>${body || '<tr><td colspan="4" class="muted">Empty.</td></tr>'}</tbody>
            </table>
          </div>`,
      })
    );
  });

  return router;
}

function databaseForm(values: Record<string, unknown>, id?: string): string {
  const action = id ? `/databases/${id}` : "/databases";
  return `
    <h1>${id ? "Edit database" : "Add database"}</h1>
    <form class="card" method="post" action="${action}">
      <div class="row">
        <div>
          <label>Key</label>
          <input name="key" required value="${esc(values.key)}" placeholder="app-prod" ${id ? "readonly" : ""} />
        </div>
        <div>
          <label>Name</label>
          <input name="name" required value="${esc(values.name)}" />
        </div>
      </div>
      <label>Notes</label>
      <textarea name="notes">${esc(values.notes)}</textarea>
      <h2>Environment</h2>
      <div class="row">
        <div>
          <label>Environment name</label>
          <input name="env_name" value="${esc(values.env_name ?? "default")}" />
        </div>
        <div>
          <label>Permissions</label>
          <select name="permissions">
            <option value="readonly" ${values.permissions !== "readwrite" ? "selected" : ""}>readonly</option>
            <option value="readwrite" ${values.permissions === "readwrite" ? "selected" : ""}>readwrite</option>
          </select>
        </div>
      </div>
      <label>Connection URL (optional if host fields are set)</label>
      <input name="connection_url" type="password" autocomplete="off" placeholder="${values.secret_hint ? "stored " + esc(values.secret_hint) + " — paste to replace" : "postgres://user:pass@host:5432/db"}" />
      <div class="row-3">
        <div><label>Host</label><input name="host" value="${esc(values.host)}" /></div>
        <div><label>Port</label><input name="port" type="number" value="${esc(values.port ?? 5432)}" /></div>
        <div><label>Database</label><input name="database_name" value="${esc(values.database_name)}" /></div>
      </div>
      <div class="row">
        <div><label>Username</label><input name="username" value="${esc(values.username)}" /></div>
        <div><label>Password</label><input name="password" type="password" autocomplete="new-password" placeholder="${values.secret_hint ? "leave blank to keep" : ""}" /></div>
      </div>
      <div class="check"><input type="checkbox" name="ssl" ${values.ssl === false ? "" : "checked"} /><label>SSL</label></div>
      <div class="actions"><button type="submit">Save</button><a class="btn ghost" href="/databases">Cancel</a></div>
    </form>`;
}

function emailForm(values: Record<string, unknown>, id?: string): string {
  const action = id ? `/email/${id}` : "/email";
  return `
    <h1>${id ? "Edit mailbox" : "Add mailbox"}</h1>
    <form class="card" method="post" action="${action}">
      <div class="row">
        <div><label>Key</label><input name="key" required value="${esc(values.key)}" ${id ? "readonly" : ""} /></div>
        <div><label>Name</label><input name="name" required value="${esc(values.name)}" /></div>
      </div>
      <label>Address</label>
      <input name="address" type="email" required value="${esc(values.address)}" />
      <div class="row-3">
        <div><label>IMAP host</label><input name="imap_host" required value="${esc(values.imap_host)}" /></div>
        <div><label>IMAP port</label><input name="imap_port" type="number" value="${esc(values.imap_port ?? 993)}" /></div>
        <div><label>SMTP host</label><input name="smtp_host" required value="${esc(values.smtp_host)}" /></div>
      </div>
      <div class="row">
        <div><label>IMAP user (blank = address)</label><input name="imap_user" value="${esc(values.imap_user)}" placeholder="defaults to address" /></div>
        <div><label>SMTP user (blank = address)</label><input name="smtp_user" value="${esc(values.smtp_user)}" placeholder="resend, or leave blank" /></div>
      </div>
      <div class="row">
        <div><label>SMTP port</label><input name="smtp_port" type="number" value="${esc(values.smtp_port ?? 465)}" /></div>
        <div>
          <label>Permissions</label>
          <select name="permissions">
            <option value="readwrite" ${values.permissions !== "readonly" ? "selected" : ""}>readwrite</option>
            <option value="readonly" ${values.permissions === "readonly" ? "selected" : ""}>readonly</option>
          </select>
        </div>
      </div>
      <div class="check"><input type="checkbox" name="imap_secure" ${values.imap_secure === false ? "" : "checked"} /><label>IMAP TLS</label></div>
      <div class="check"><input type="checkbox" name="smtp_secure" ${values.smtp_secure === false ? "" : "checked"} /><label>SMTP TLS</label></div>
      <label>Password ${values.secret_hint ? `(stored ${esc(values.secret_hint)})` : ""}</label>
      <input name="password" type="password" autocomplete="new-password" ${id ? "" : "required"} placeholder="${id ? "leave blank to keep" : ""}" />
      <div class="check"><input type="checkbox" name="append_to_sent" ${values.append_to_sent === false ? "" : "checked"} /><label>Append sent copies to IMAP Sent folder</label></div>
      <label>Sent folder</label>
      <input name="sent_folder" value="${esc(values.sent_folder ?? "Sent")}" />
      <label>Notes</label>
      <textarea name="notes">${esc(values.notes)}</textarea>
      <div class="actions"><button type="submit">Save</button><a class="btn ghost" href="/email">Cancel</a></div>
    </form>`;
}

async function loadDatabase(id: string) {
  const rows = await sql<{
    id: string;
    key: string;
    name: string;
    notes: string | null;
    enabled: boolean;
  }[]>`SELECT id, key, name, notes, enabled FROM database_targets WHERE id = ${id}`;
  const db = rows[0];
  if (!db) return null;
  const env = (
    await sql<{
      name: string;
      host: string | null;
      port: number | null;
      database_name: string | null;
      username: string | null;
      ssl: boolean;
      permissions: string;
      secret_hint: string | null;
    }[]>`
      SELECT name, host, port, database_name, username, ssl, permissions, secret_hint
      FROM database_environments WHERE database_id = ${id} ORDER BY name LIMIT 1
    `
  )[0];
  return {
    ...db,
    env_name: env?.name ?? "default",
    host: env?.host,
    port: env?.port,
    database_name: env?.database_name,
    username: env?.username,
    ssl: env?.ssl,
    permissions: env?.permissions,
    secret_hint: env?.secret_hint,
  };
}

async function loadEmail(id: string) {
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
    secret_hint: string | null;
    permissions: string;
    append_to_sent: boolean;
    sent_folder: string;
    notes: string | null;
    enabled: boolean;
  }[]>`SELECT * FROM email_accounts WHERE id = ${id}`;
  return rows[0] ?? null;
}

async function upsertDatabase(req: Request, id: string | null): Promise<{ id: string; key: string }> {
  const key = String(req.body.key ?? "").trim();
  const name = String(req.body.name ?? "").trim();
  if (!key || !name) throw new Error("Key and name are required");
  const envName = String(req.body.env_name ?? "default").trim() || "default";
  const password = String(req.body.password ?? "");
  const connectionUrlField = String(req.body.connection_url ?? "");

  let targetId = id;
  if (!targetId) {
    const inserted = await sql<{ id: string }[]>`
      INSERT INTO database_targets (key, name, notes)
      VALUES (${key}, ${name}, ${String(req.body.notes ?? "") || null})
      RETURNING id
    `;
    targetId = inserted[0].id;
  } else {
    await sql`
      UPDATE database_targets
      SET name = ${name}, notes = ${String(req.body.notes ?? "") || null}, updated_at = now()
      WHERE id = ${targetId}
    `;
  }

  const existing = await sql<{ id: string; connection_url_secret_id: string | null }[]>`
    SELECT id, connection_url_secret_id FROM database_environments
    WHERE database_id = ${targetId} AND name = ${envName}
  `;

  let url: string | null = null;
  if (connectionUrlField) {
    url = connectionUrlField;
  } else if (password || !existing[0]) {
    url = buildConnectionUrl({
      host: String(req.body.host ?? "") || undefined,
      port: Number(req.body.port || 5432),
      database: String(req.body.database_name ?? "") || undefined,
      username: String(req.body.username ?? "") || undefined,
      password: password || undefined,
      ssl: bool(req.body.ssl),
    });
  }

  let secretId = existing[0]?.connection_url_secret_id ?? null;
  let hint = existing.length ? (await sql<{ secret_hint: string | null }[]>`SELECT secret_hint FROM database_environments WHERE id = ${existing[0].id}`)[0]?.secret_hint : null;
  if (url) {
    secretId = await replaceSecret(secretId, url);
    hint = secretHint(url);
  }
  if (!secretId) throw new Error("A connection URL or host credentials are required");

  if (existing[0]) {
    await sql`
      UPDATE database_environments SET
        host = ${String(req.body.host ?? "") || null},
        port = ${Number(req.body.port || 5432)},
        database_name = ${String(req.body.database_name ?? "") || null},
        username = ${String(req.body.username ?? "") || null},
        ssl = ${bool(req.body.ssl)},
        connection_url_secret_id = ${secretId},
        secret_hint = ${hint},
        permissions = ${asPerm(req.body.permissions)},
        updated_at = now()
      WHERE id = ${existing[0].id}
    `;
  } else {
    await sql`
      INSERT INTO database_environments (
        database_id, name, host, port, database_name, username, ssl,
        connection_url_secret_id, secret_hint, permissions
      ) VALUES (
        ${targetId}, ${envName},
        ${String(req.body.host ?? "") || null},
        ${Number(req.body.port || 5432)},
        ${String(req.body.database_name ?? "") || null},
        ${String(req.body.username ?? "") || null},
        ${bool(req.body.ssl)},
        ${secretId}, ${hint}, ${asPerm(req.body.permissions)}
      )
    `;
  }
  return { id: targetId, key };
}

async function upsertEmail(req: Request, id: string | null): Promise<{ id: string; key: string }> {
  const key = String(req.body.key ?? "").trim();
  const name = String(req.body.name ?? "").trim();
  const address = String(req.body.address ?? "").trim();
  const password = String(req.body.password ?? "");
  if (!key || !name || !address) throw new Error("Key, name, and address are required");

  let secretId: string | null = null;
  let hint: string | null = null;
  if (id) {
    const existing = await sql<{ password_secret_id: string | null; secret_hint: string | null }[]>`
      SELECT password_secret_id, secret_hint FROM email_accounts WHERE id = ${id}
    `;
    secretId = existing[0]?.password_secret_id ?? null;
    hint = existing[0]?.secret_hint ?? null;
  }
  if (password) {
    secretId = await replaceSecret(secretId, password);
    hint = secretHint(password);
  }
  if (!secretId) throw new Error("Password is required");

  const fields = {
    key,
    name,
    address,
    imap_host: String(req.body.imap_host ?? "").trim(),
    imap_port: Number(req.body.imap_port || 993),
    imap_secure: bool(req.body.imap_secure),
    smtp_host: String(req.body.smtp_host ?? "").trim(),
    smtp_port: Number(req.body.smtp_port || 465),
    smtp_secure: bool(req.body.smtp_secure),
    imap_user: String(req.body.imap_user ?? "").trim() || null,
    smtp_user: String(req.body.smtp_user ?? "").trim() || null,
    permissions: asPerm(req.body.permissions === "readonly" ? "readonly" : "readwrite"),
    append_to_sent: bool(req.body.append_to_sent),
    sent_folder: String(req.body.sent_folder ?? "Sent") || "Sent",
    notes: String(req.body.notes ?? "") || null,
  };

  if (!id) {
    const inserted = await sql<{ id: string }[]>`
      INSERT INTO email_accounts (
        key, name, address, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure,
        imap_user, smtp_user,
        password_secret_id, secret_hint, permissions, append_to_sent, sent_folder, notes
      ) VALUES (
        ${fields.key}, ${fields.name}, ${fields.address}, ${fields.imap_host}, ${fields.imap_port}, ${fields.imap_secure},
        ${fields.smtp_host}, ${fields.smtp_port}, ${fields.smtp_secure},
        ${fields.imap_user}, ${fields.smtp_user},
        ${secretId}, ${hint}, ${fields.permissions},
        ${fields.append_to_sent}, ${fields.sent_folder}, ${fields.notes}
      ) RETURNING id
    `;
    return { id: inserted[0].id, key };
  }

  await sql`
    UPDATE email_accounts SET
      name = ${fields.name},
      address = ${fields.address},
      imap_host = ${fields.imap_host},
      imap_port = ${fields.imap_port},
      imap_secure = ${fields.imap_secure},
      smtp_host = ${fields.smtp_host},
      smtp_port = ${fields.smtp_port},
      smtp_secure = ${fields.smtp_secure},
      imap_user = ${fields.imap_user},
      smtp_user = ${fields.smtp_user},
      password_secret_id = ${secretId},
      secret_hint = ${hint},
      permissions = ${fields.permissions},
      append_to_sent = ${fields.append_to_sent},
      sent_folder = ${fields.sent_folder},
      notes = ${fields.notes},
      updated_at = now()
    WHERE id = ${id}
  `;
  return { id, key };
}
