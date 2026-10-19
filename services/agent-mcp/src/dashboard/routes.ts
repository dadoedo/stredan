import { ImapFlow } from "imapflow";
import type { NextFunction, Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { sql } from "../db/client.js";
import { audit } from "../audit.js";
import { foreignScopeIds, isSuperadmin } from "../auth/access.js";
import { createApiKey, revokeApiKey } from "../auth/api-keys.js";
import { acceptInvite, createInvite, inviteUrl, peekInvite } from "../auth/invites.js";
import { hashPassword, passwordIssues, verifyPassword } from "../auth/passwords.js";
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
import { generateTotpSecret, loadUserTotpSecret, storeUserTotpSecret, totpQrDataUrl, verifyTotp } from "../auth/totp.js";
import { esc, flashHtml, layout } from "./html.js";
import { buildConnectionUrl, insertVaultSecret, readSecret, secretHint, storeSecret, testPostgresConnection } from "../targets.js";
import type { ApiKeyScope, Permissions, UserSession } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      userSession?: UserSession;
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

function tokenParam(req: Request): string {
  const value = req.params.token;
  const token = Array.isArray(value) ? value[0] : value;
  return typeof token === "string" ? token : "";
}

function idList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : value == null || value === "" ? [] : [value];
  return raw.map((item) => String(item));
}

function messageOf(error: unknown): string {
  if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505") {
    return "That key is already in use";
  }
  return error instanceof Error ? error.message : String(error);
}

function checkAttr(values: Record<string, unknown>, name: string, fallback: boolean, posted: boolean): string {
  if (Object.prototype.hasOwnProperty.call(values, name)) {
    const value = values[name];
    if (value === undefined || value === null || value === "") {
      if (posted) return "";
      return fallback ? "checked" : "";
    }
    const on = value === true || value === "on" || value === "true";
    return on ? "checked" : "";
  }
  if (posted) return "";
  return fallback ? "checked" : "";
}

function invalidAttr(errors: Record<string, string>, name: string): string {
  return errors[name] ? ` aria-invalid="true"` : "";
}

function fieldError(name: string, errors: Record<string, string>, requiredMessage: string): string {
  if (errors[name]) return `<p class="field-error is-visible" id="${name}-error">${esc(errors[name])}</p>`;
  return `<p class="field-error" id="${name}-error">${esc(requiredMessage)}</p>`;
}

function visible(session: UserSession) {
  return { all: isSuperadmin(session), userId: session.userId };
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
  req.userSession = session;
  if (session.pendingTotp && !req.path.startsWith("/login") && req.path !== "/logout" && req.path !== "/enroll-totp") {
    res.redirect(session.totpEnabled ? "/login/totp" : "/enroll-totp");
    return;
  }
  next();
}

function requireSuperadmin(req: Request, res: Response, next: NextFunction): void {
  if (req.userSession?.role !== "superadmin") {
    res.status(403).type("text").send("Forbidden");
    return;
  }
  next();
}

export function dashboardRouter(): Router {
  const router = createRouter();

  router.get("/login", (req, res) => {
    if (req.userSession && !req.userSession.pendingTotp) {
      res.redirect("/databases");
      return;
    }
    const loginError = req.query.error ? String(req.query.error) : "";
    res.type("html").send(
      layout({
        title: "Sign in",
        body: `
          <div class="login">
            <h1>Sign in</h1>
            <p class="lede">Password, then authenticator app.</p>
            ${loginError ? flashHtml("error", loginError) : ""}
            <form class="card" method="post" action="/login">
              <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" autocomplete="username" required ${loginError ? 'aria-invalid="true"' : ""} aria-describedby="email-error" />
                ${fieldError("email", loginError ? { email: "Check the email and password, then try again." } : {}, "Enter your email.")}
              </div>
              <div class="field">
                <label for="password">Password</label>
                <input id="password" name="password" type="password" autocomplete="current-password" required ${loginError ? 'aria-invalid="true"' : ""} aria-describedby="password-error" />
                ${fieldError("password", {}, "Enter your password.")}
              </div>
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
          body: `
            <div class="login">
              <h1>Sign in</h1>
              ${flashHtml("error", "Too many attempts. Try again in 15 minutes.")}
            </div>`,
        })
      );
      return;
    }
    recordLoginAttempt(ip);
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const rows = await sql<{ id: string; email: string; password_hash: string; totp_enabled: boolean }[]>`
      SELECT id, email, password_hash, totp_enabled FROM users WHERE email = ${email}
    `;
    const admin = rows[0];
    if (!admin || !(await verifyPassword(password, admin.password_hash))) {
      res.redirect(`/login?error=${encodeURIComponent("Invalid email or password. " + remainingLoginAttempts(ip) + " attempts left.")}`);
      return;
    }
    const token = await createSession(admin.id, true);
    setSessionCookie(res, token, true);
    await audit(admin.id, "login.password", "user", admin.id);
    res.redirect(admin.totp_enabled ? "/login/totp" : "/enroll-totp");
  });

  router.get("/login/totp", requireSession, async (req, res) => {
    res.type("html").send(
      layout({
        title: "Authenticator",
        session: req.userSession,
        body: `
          <div class="login">
            <h1>Authenticator</h1>
            <p class="lede">Enter the 6-digit code from your authenticator app.</p>
            ${req.query.error ? flashHtml("error", String(req.query.error)) : ""}
            <form class="card" method="post" action="/login/totp">
              <div class="field">
                <label for="code">TOTP code</label>
                <input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" required pattern="[0-9 ]{6,8}" ${req.query.error ? 'aria-invalid="true"' : ""} aria-describedby="code-help code-error" />
                <p class="help" id="code-help">Six digits. Spaces are fine.</p>
                ${fieldError("code", req.query.error ? { code: "That code was not accepted." } : {}, "Enter the 6-digit code.")}
              </div>
              <div class="actions"><button type="submit">Verify</button></div>
            </form>
          </div>`,
      })
    );
  });

  router.post("/login/totp", requireSession, async (req, res) => {
    const session = req.userSession!;
    const secret = await loadUserTotpSecret(session.userId);
    const code = String(req.body.code ?? "");
    if (!secret || !verifyTotp(secret, code)) {
      res.redirect(`/login/totp?error=${encodeURIComponent("Invalid authenticator code.")}`);
      return;
    }
    await promoteSession(session.id);
    await audit(session.userId, "login.totp", "user", session.userId);
    const token = readSessionCookie(req);
    if (token) setSessionCookie(res, token, false);
    res.redirect("/databases");
  });

  router.get("/enroll-totp", requireSession, async (req, res) => {
    const session = req.userSession!;
    if (session.totpEnabled) {
      res.redirect("/login/totp");
      return;
    }
    const generated = generateTotpSecret(session.email);
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
              <img class="qr" alt="TOTP QR code" src="${qr}" width="220" height="220" />
              <p class="help">If you cannot scan, type this secret into the app:</p>
              <div class="secret">${esc(generated.base32)}</div>
              <form method="post" action="/enroll-totp">
                <div class="field">
                  <label for="code">First code</label>
                  <input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" required pattern="[0-9 ]{6,8}" aria-describedby="code-error" />
                  ${fieldError("code", {}, "Enter the first code from your app.")}
                </div>
                <div class="actions"><button type="submit">Enable TOTP</button></div>
              </form>
            </div>
          </div>`,
      })
    );
  });

  router.post("/enroll-totp", requireSession, async (req, res) => {
    const session = req.userSession!;
    const pending = String(req.cookies?.agent_mcp_totp_tmp ?? "");
    const code = String(req.body.code ?? "");
    if (!pending || !verifyTotp(pending, code)) {
      res.redirect("/enroll-totp");
      return;
    }
    await storeUserTotpSecret(session.userId, pending);
    await promoteSession(session.id);
    await audit(session.userId, "totp.enrolled", "user", session.userId);
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
    const session = req.userSession!;
    const scope = visible(session);
    const dbs = await sql<{
      id: string;
      key: string;
      name: string;
      enabled: boolean;
      env_count: number;
      owner_email: string | null;
    }[]>`
      SELECT t.id, t.key, t.name, t.enabled, count(e.id)::int AS env_count, u.email AS owner_email
      FROM database_targets t
      LEFT JOIN database_environments e ON e.database_id = t.id
      LEFT JOIN users u ON u.id = t.owner_id
      WHERE (${scope.all} OR t.owner_id = ${scope.userId})
      GROUP BY t.id, u.email
      ORDER BY t.key
    `;
    const rows = dbs
      .map(
        (db) => `<tr>
          <td><a href="/databases/${db.id}">${esc(db.key)}</a></td>
          <td>${esc(db.name)}</td>
          <td>${db.env_count}</td>
          ${scope.all ? `<td class="muted">${esc(db.owner_email)}</td>` : ""}
          <td>${db.enabled ? '<span class="badge ok">on</span>' : '<span class="badge">off</span>'}</td>
        </tr>`
      )
      .join("");
    const cols = scope.all ? 5 : 4;
    res.type("html").send(
      layout({
        title: "Databases",
        session,
        active: "databases",
        body: `
          <div class="page-head">
            <div>
              <h1>Postgres targets</h1>
              <p class="lede">Connection secrets are encrypted at rest with the platform key. After save, only a last-4 hint is shown. You only see databases you own${scope.all ? ". As superadmin you also see every tenant." : "."}</p>
            </div>
            <a class="btn" href="/databases/new">Add database</a>
          </div>
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          <div class="table-wrap">
            <table>
              <thead><tr><th>Key</th><th>Name</th><th>Envs</th>${scope.all ? "<th>Owner</th>" : ""}<th>Status</th></tr></thead>
              <tbody>${rows || `<tr><td colspan="${cols}" class="empty">No databases yet. Add one to query it from Cursor.</td></tr>`}</tbody>
            </table>
          </div>`,
      })
    );
  });

  router.get("/databases/new", requireSession, (req, res) => {
    res.type("html").send(
      layout({
        title: "Add database",
        session: req.userSession,
        active: "databases",
        body: databaseForm({}),
      })
    );
  });

  router.post("/databases", requireSession, async (req, res) => {
    try {
      const saved = await upsertDatabase(req, null);
      await audit(req.userSession!.userId, "database.create", "database", saved.id, { key: saved.key });
      res.redirect(`/databases/${saved.id}?ok=${encodeURIComponent("Saved.")}`);
    } catch (error) {
      res.status(400).type("html").send(
        layout({
          title: "Add database",
          session: req.userSession,
          active: "databases",
          body: flashHtml("error", messageOf(error)) + databaseForm(req.body, undefined, true, messageOf(error)),
        })
      );
    }
  });

  router.get("/databases/:id", requireSession, async (req, res) => {
    const db = await loadDatabase(idParam(req), req.userSession!);
    if (!db) {
      res.status(404).send("Not found");
      return;
    }
    res.type("html").send(
      layout({
        title: db.key,
        session: req.userSession,
        active: "databases",
        body: `
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          ${req.query.error ? flashHtml("error", String(req.query.error)) : ""}
          ${databaseForm(db, db.id)}
          <div class="toolbar">
            <form method="post" action="/databases/${db.id}/test">
              <button class="ghost" type="submit">Test connection</button>
            </form>
            <form method="post" action="/databases/${db.id}/toggle">
              <button class="${db.enabled ? "danger" : "ghost"}" type="submit">${db.enabled ? "Disable" : "Enable"}</button>
            </form>
          </div>`,
      })
    );
  });

  router.post("/databases/:id", requireSession, async (req, res) => {
    const existing = await loadDatabase(idParam(req), req.userSession!);
    if (!existing) {
      res.status(404).type("text").send("Not found");
      return;
    }
    try {
      const saved = await upsertDatabase(req, idParam(req));
      await audit(req.userSession!.userId, "database.update", "database", saved.id);
      res.redirect(`/databases/${saved.id}?ok=${encodeURIComponent("Updated.")}`);
    } catch (error) {
      res.redirect(`/databases/${idParam(req)}?error=${encodeURIComponent(messageOf(error))}`);
    }
  });

  router.post("/databases/:id/toggle", requireSession, async (req, res) => {
    const session = req.userSession!;
    const scope = visible(session);
    const updated = await sql`
      UPDATE database_targets SET enabled = NOT enabled, updated_at = now()
      WHERE id = ${idParam(req)} AND (${scope.all} OR owner_id = ${scope.userId})
    `;
    if (updated.count === 0) {
      res.status(404).type("text").send("Not found");
      return;
    }
    await audit(session.userId, "database.toggle", "database", idParam(req));
    res.redirect(`/databases/${idParam(req)}?ok=${encodeURIComponent("Status updated.")}`);
  });

  router.post("/databases/:id/test", requireSession, async (req, res) => {
    const session = req.userSession!;
    const db = await loadDatabase(idParam(req), session);
    if (!db) {
      res.status(404).type("text").send("Not found");
      return;
    }
    if (!db.connection_url_secret_id || !db.owner_id) {
      res.redirect(`/databases/${idParam(req)}?error=${encodeURIComponent("No connection stored yet.")}`);
      return;
    }
    const url = await readSecret(db.connection_url_secret_id, db.owner_id);
    const result = await testPostgresConnection(url);
    await audit(session.userId, "database.test", "database", db.id, { ok: result.ok });
    if (result.ok) {
      res.redirect(`/databases/${idParam(req)}?ok=${encodeURIComponent("Connection succeeded.")}`);
    } else {
      res.redirect(`/databases/${idParam(req)}?error=${encodeURIComponent(result.error)}`);
    }
  });

  router.get("/email", requireSession, async (req, res) => {
    const session = req.userSession!;
    const scope = visible(session);
    const accounts = await sql<{
      id: string;
      key: string;
      name: string;
      address: string;
      permissions: string;
      enabled: boolean;
      owner_email: string | null;
    }[]>`
      SELECT e.id, e.key, e.name, e.address, e.permissions, e.enabled, u.email AS owner_email
      FROM email_accounts e
      LEFT JOIN users u ON u.id = e.owner_id
      WHERE (${scope.all} OR e.owner_id = ${scope.userId})
      ORDER BY e.key
    `;
    const rows = accounts
      .map(
        (a) => `<tr>
          <td><a href="/email/${a.id}">${esc(a.key)}</a></td>
          <td>${esc(a.address)}</td>
          ${scope.all ? `<td class="muted">${esc(a.owner_email)}</td>` : ""}
          <td><span class="badge">${esc(a.permissions)}</span></td>
          <td>${a.enabled ? '<span class="badge ok">on</span>' : '<span class="badge">off</span>'}</td>
        </tr>`
      )
      .join("");
    res.type("html").send(
      layout({
        title: "Email",
        session: req.userSession,
        active: "email",
        body: `
          <div class="page-head">
            <div>
              <h1>Mailboxes</h1>
              <p class="lede">IMAP and SMTP passwords are encrypted. Use port 587 with STARTTLS. Port 465 is blocked on this server. Test IMAP after save — some providers block datacenter IPs.</p>
            </div>
            <a class="btn" href="/email/new">Add mailbox</a>
          </div>
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          <div class="table-wrap">
            <table>
              <thead><tr><th>Key</th><th>Address</th>${scope.all ? "<th>Owner</th>" : ""}<th>Permissions</th><th>Status</th></tr></thead>
              <tbody>${rows || `<tr><td colspan="${scope.all ? 5 : 4}" class="empty">No mailboxes yet. Add one to read and send mail from Cursor.</td></tr>`}</tbody>
            </table>
          </div>`,
      })
    );
  });

  router.get("/email/new", requireSession, (req, res) => {
    res.type("html").send(layout({ title: "Add mailbox", session: req.userSession, active: "email", body: emailForm({}) }));
  });

  router.post("/email", requireSession, async (req, res) => {
    try {
      const saved = await upsertEmail(req, null);
      await audit(req.userSession!.userId, "email.create", "email", saved.id, { key: saved.key });
      res.redirect(`/email/${saved.id}?ok=${encodeURIComponent("Saved.")}`);
    } catch (error) {
      res.status(400).type("html").send(
        layout({
          title: "Add mailbox",
          session: req.userSession,
          active: "email",
          body: flashHtml("error", messageOf(error)) + emailForm(req.body, undefined, true, messageOf(error)),
        })
      );
    }
  });

  router.get("/email/:id", requireSession, async (req, res) => {
    const account = await loadEmail(idParam(req), req.userSession!);
    if (!account) {
      res.status(404).send("Not found");
      return;
    }
    res.type("html").send(
      layout({
        title: account.key,
        session: req.userSession,
        active: "email",
        body: `
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          ${req.query.error ? flashHtml("error", String(req.query.error)) : ""}
          ${emailForm(account, account.id)}
          <div class="toolbar">
            <form method="post" action="/email/${account.id}/test"><button class="ghost" type="submit">Test IMAP</button></form>
            <form method="post" action="/email/${account.id}/toggle">
              <button class="${account.enabled ? "danger" : "ghost"}" type="submit">${account.enabled ? "Disable" : "Enable"}</button>
            </form>
          </div>`,
      })
    );
  });

  router.post("/email/:id", requireSession, async (req, res) => {
    const existing = await loadEmail(idParam(req), req.userSession!);
    if (!existing) {
      res.status(404).type("text").send("Not found");
      return;
    }
    try {
      const saved = await upsertEmail(req, idParam(req));
      await audit(req.userSession!.userId, "email.update", "email", saved.id);
      res.redirect(`/email/${saved.id}?ok=${encodeURIComponent("Updated.")}`);
    } catch (error) {
      res.redirect(`/email/${idParam(req)}?error=${encodeURIComponent(messageOf(error))}`);
    }
  });

  router.post("/email/:id/toggle", requireSession, async (req, res) => {
    const session = req.userSession!;
    const scope = visible(session);
    const updated = await sql`
      UPDATE email_accounts SET enabled = NOT enabled, updated_at = now()
      WHERE id = ${idParam(req)} AND (${scope.all} OR owner_id = ${scope.userId})
    `;
    if (updated.count === 0) {
      res.status(404).type("text").send("Not found");
      return;
    }
    await audit(session.userId, "email.toggle", "email", idParam(req));
    res.redirect(`/email/${idParam(req)}?ok=${encodeURIComponent("Status updated.")}`);
  });

  router.post("/email/:id/test", requireSession, async (req, res) => {
    const session = req.userSession!;
    const account = await loadEmail(idParam(req), session);
    if (!account) {
      res.status(404).type("text").send("Not found");
      return;
    }
    if (!account.password_secret_id || !account.owner_id) {
      res.redirect(`/email/${idParam(req)}?error=${encodeURIComponent("No password stored.")}`);
      return;
    }
    const password = await readSecret(account.password_secret_id, account.owner_id);
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
      await audit(session.userId, "email.test", "email", account.id, { ok: true });
      res.redirect(`/email/${idParam(req)}?ok=${encodeURIComponent("IMAP connection succeeded.")}`);
    } catch (error) {
      await audit(session.userId, "email.test", "email", account.id, { ok: false });
      res.redirect(`/email/${idParam(req)}?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
    }
  });

  router.get("/keys", requireSession, async (req, res) => {
    const session = req.userSession!;
    const scope = visible(session);
    const keys = await sql<{
      id: string;
      label: string;
      key_prefix: string;
      scopes: unknown;
      revoked_at: Date | null;
      last_used_at: Date | null;
      created_at: Date;
      owner_email: string | null;
    }[]>`
      SELECT k.id, k.label, k.key_prefix, k.scopes, k.revoked_at, k.last_used_at, k.created_at, u.email AS owner_email
      FROM api_keys k
      LEFT JOIN users u ON u.id = k.owner_id
      WHERE (${scope.all} OR k.owner_id = ${scope.userId})
      ORDER BY k.created_at DESC
    `;
    const dbs = await sql<{ id: string; key: string }[]>`
      SELECT id, key FROM database_targets WHERE owner_id = ${session.userId} ORDER BY key
    `;
    const emails = await sql<{ id: string; key: string }[]>`
      SELECT id, key FROM email_accounts WHERE owner_id = ${session.userId} ORDER BY key
    `;
    const rows = keys
      .map((k) => {
        const scopes = (k.scopes ?? {}) as { readonly?: boolean };
        return `<tr>
          <td>${esc(k.label)}</td>
          ${scope.all ? `<td class="muted">${esc(k.owner_email)}</td>` : ""}
          <td class="muted">${esc(k.key_prefix)}…</td>
          <td>${scopes.readonly ? '<span class="badge warn">readonly</span>' : '<span class="badge">readwrite</span>'}</td>
          <td>${k.revoked_at ? '<span class="badge danger">revoked</span>' : '<span class="badge ok">active</span>'}</td>
          <td class="muted">${k.last_used_at ? new Date(k.last_used_at).toISOString() : "never"}</td>
          <td>${k.revoked_at ? "" : `<form method="post" action="/keys/${k.id}/revoke"><button class="danger" type="submit">Revoke</button></form>`}</td>
        </tr>`;
      })
      .join("");
    const dbChecks = dbs
      .map(
        (d) =>
          `<div class="check"><input id="db-${esc(d.id)}" type="checkbox" name="db" value="${esc(d.id)}" /><label for="db-${esc(d.id)}">${esc(d.key)}</label></div>`
      )
      .join("");
    const emailChecks = emails
      .map(
        (e) =>
          `<div class="check"><input id="mail-${esc(e.id)}" type="checkbox" name="email" value="${esc(e.id)}" /><label for="mail-${esc(e.id)}">${esc(e.key)}</label></div>`
      )
      .join("");
    const colSpan = scope.all ? 7 : 6;
    res.type("html").send(
      layout({
        title: "API keys",
        session,
        active: "keys",
        body: `
          <div class="page-head">
            <div>
              <h1>API keys</h1>
              <p class="lede">Bearer tokens for Cursor Team MCP. Hashed at rest. The plaintext is shown once. A key can only reference databases and mailboxes you own. “All” means every resource you own, not other users'.</p>
            </div>
          </div>
          ${req.query.created ? flashHtml("warn", "Copy this key now. It will not be shown again.") + `<div class="secret">${esc(String(req.query.created))}</div>` : ""}
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          ${req.query.error ? flashHtml("error", String(req.query.error)) : ""}
          <div class="card">
            <h2>Create key</h2>
            <form method="post" action="/keys">
              <div class="field">
                <label for="label">Label</label>
                <input id="label" name="label" required placeholder="Cursor Cloud Agents" aria-describedby="label-help label-error" />
                <p class="help" id="label-help">A name you will recognize in the table below.</p>
                ${fieldError("label", {}, "Enter a label.")}
              </div>
              <div class="check"><input id="readonly" type="checkbox" name="readonly" /><label for="readonly">Force readonly (even if a target is readwrite)</label></div>
              <div class="check"><input id="all_db" type="checkbox" name="all_db" checked /><label for="all_db">All of your databases</label></div>
              <div class="check"><input id="all_email" type="checkbox" name="all_email" checked /><label for="all_email">All of your mailboxes</label></div>
              <p class="help">Or pick specific targets. Uncheck “all” first, or the specific boxes are ignored.</p>
              <div class="grid grid-2">
                <fieldset><legend>Databases</legend>${dbChecks || '<p class="help">None yet.</p>'}</fieldset>
                <fieldset><legend>Email</legend>${emailChecks || '<p class="help">None yet.</p>'}</fieldset>
              </div>
              <div class="actions"><button type="submit">Create key</button></div>
            </form>
          </div>
          <h2 class="section-title">Existing keys</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Label</th>${scope.all ? "<th>Owner</th>" : ""}<th>Prefix</th><th>Mode</th><th>Status</th><th>Last used</th><th>Action</th></tr></thead>
              <tbody>${rows || `<tr><td colspan="${colSpan}" class="empty">No API keys yet.</td></tr>`}</tbody>
            </table>
          </div>`,
      })
    );
  });

  router.post("/keys", requireSession, async (req, res) => {
    const session = req.userSession!;
    const label = String(req.body.label ?? "").trim();
    if (!label) {
      res.redirect("/keys");
      return;
    }
    const scopes: ApiKeyScope = {
      databases: bool(req.body.all_db) ? "*" : idList(req.body.db),
      emails: bool(req.body.all_email) ? "*" : idList(req.body.email),
      readonly: bool(req.body.readonly),
    };
    try {
      const problem = await foreignScopeIds(session.userId, scopes);
      if (problem) {
        res.redirect(`/keys?error=${encodeURIComponent(problem)}`);
        return;
      }
    } catch {
      res.redirect(`/keys?error=${encodeURIComponent("A key can only reference its owner's databases and mailboxes")}`);
      return;
    }
    const created = await createApiKey(label, scopes, session.userId);
    await audit(session.userId, "apikey.create", "api_key", created.id, { label });
    res.redirect(`/keys?created=${encodeURIComponent(created.plaintext)}`);
  });

  router.post("/keys/:id/revoke", requireSession, async (req, res) => {
    const session = req.userSession!;
    const scope = visible(session);
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM api_keys
      WHERE id = ${idParam(req)} AND (${scope.all} OR owner_id = ${scope.userId})
    `;
    if (!rows[0]) {
      res.status(404).type("text").send("Not found");
      return;
    }
    await revokeApiKey(idParam(req));
    await audit(session.userId, "apikey.revoke", "api_key", idParam(req));
    res.redirect(`/keys?ok=${encodeURIComponent("Key revoked.")}`);
  });

  router.get("/audit", requireSession, async (req, res) => {
    const session = req.userSession!;
    const scope = visible(session);
    const rows = await sql<{
      action: string;
      entity_type: string | null;
      created_at: Date;
      email: string | null;
      tool: string | null;
      target: string | null;
      success: boolean | null;
    }[]>`
      SELECT a.action, a.entity_type, a.created_at, u.email, a.tool, a.target, a.success
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE (
        ${scope.all}
        OR a.user_id = ${scope.userId}
        OR a.api_key_id IN (SELECT id FROM api_keys WHERE owner_id = ${scope.userId})
      )
      ORDER BY a.created_at DESC
      LIMIT 200
    `;
    const body = rows
      .map((r) => {
        const outcome = r.success === true ? "ok" : r.success === false ? "fail" : "";
        return `<tr>
          <td class="muted">${esc(new Date(r.created_at).toISOString())}</td>
          <td>${esc(r.email)}</td>
          <td>${esc(r.action)}</td>
          <td class="muted">${esc(r.tool)}</td>
          <td class="muted">${esc(r.target)}</td>
          <td>${outcome ? `<span class="badge ${outcome === "ok" ? "ok" : "danger"}">${outcome}</span>` : ""}</td>
          <td class="muted">${esc(r.entity_type)}</td>
        </tr>`;
      })
      .join("");
    res.type("html").send(
      layout({
        title: "Audit",
        session,
        active: "audit",
        body: `
          <div class="page-head">
            <div>
              <h1>Audit log</h1>
              <p class="lede">${scope.all ? "Every user action and API-key tool call." : "Your dashboard actions and tool calls made with your API keys."}</p>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Tool</th><th>Target</th><th>Result</th><th>Entity</th></tr></thead>
              <tbody>${body || '<tr><td colspan="7" class="empty">No audit events yet.</td></tr>'}</tbody>
            </table>
          </div>`,
      })
    );
  });

  router.get("/users", requireSession, requireSuperadmin, async (req, res) => {
    const users = await sql<{ id: string; email: string; role: string; totp_enabled: boolean; created_at: Date }[]>`
      SELECT id, email, role, totp_enabled, created_at FROM users ORDER BY created_at
    `;
    const invites = await sql<{ email: string; expires_at: Date; created_at: Date }[]>`
      SELECT email, expires_at, created_at FROM user_invites
      WHERE accepted_at IS NULL AND expires_at > now()
      ORDER BY created_at DESC
    `;
    const userRows = users
      .map(
        (u) => `<tr>
          <td>${esc(u.email)}</td>
          <td><span class="badge">${esc(u.role)}</span></td>
          <td>${u.totp_enabled ? '<span class="badge ok">on</span>' : '<span class="badge warn">pending</span>'}</td>
          <td class="muted">${esc(new Date(u.created_at).toISOString())}</td>
        </tr>`
      )
      .join("");
    const inviteRows = invites
      .map(
        (i) => `<tr>
          <td>${esc(i.email)}</td>
          <td class="muted">${esc(new Date(i.expires_at).toISOString())}</td>
        </tr>`
      )
      .join("");
    res.type("html").send(
      layout({
        title: "Users",
        session: req.userSession,
        active: "users",
        body: `
          <div class="page-head">
            <div>
              <h1>Users</h1>
              <p class="lede">Invite a person with a one-time link. They choose a password and enroll an authenticator. Each user only sees their own mailboxes, databases, and keys.</p>
            </div>
          </div>
          ${req.query.invite ? flashHtml("warn", "Copy this invite link now. It will not be shown again.") + `<div class="secret">${esc(String(req.query.invite))}</div>` : ""}
          ${req.query.ok ? flashHtml("ok", String(req.query.ok)) : ""}
          ${req.query.error ? flashHtml("error", String(req.query.error)) : ""}
          <div class="card">
            <h2>Invite</h2>
            <form method="post" action="/users/invites">
              <div class="field">
                <label for="invite-email">Email</label>
                <input id="invite-email" name="email" type="email" required placeholder="name@company.com" aria-describedby="invite-email-help invite-email-error" ${req.query.error ? 'aria-invalid="true"' : ""} />
                <p class="help" id="invite-email-help">The link expires in 7 days and works once.</p>
                ${fieldError("invite-email", req.query.error ? { "invite-email": String(req.query.error) } : {}, "Enter an email address.")}
              </div>
              <div class="actions"><button type="submit">Create invite link</button></div>
            </form>
          </div>
          <h2 class="section-title">Accounts</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Email</th><th>Role</th><th>TOTP</th><th>Created</th></tr></thead>
              <tbody>${userRows || '<tr><td colspan="4" class="empty">No accounts yet.</td></tr>'}</tbody>
            </table>
          </div>
          <h2 class="section-title">Pending invites</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Email</th><th>Expires</th></tr></thead>
              <tbody>${inviteRows || '<tr><td colspan="2" class="empty">No pending invites.</td></tr>'}</tbody>
            </table>
          </div>`,
      })
    );
  });

  router.post("/users/invites", requireSession, requireSuperadmin, async (req, res) => {
    const session = req.userSession!;
    try {
      const created = await createInvite(String(req.body.email ?? ""), session.userId);
      await audit(session.userId, "user.invite", "user_invite", undefined, {
        email: String(req.body.email ?? "").trim().toLowerCase(),
      });
      res.redirect(`/users?invite=${encodeURIComponent(inviteUrl(created.token))}`);
    } catch (error) {
      res.redirect(`/users?error=${encodeURIComponent(messageOf(error))}`);
    }
  });

  router.get("/invite/:token", async (req, res) => {
    const invite = await peekInvite(tokenParam(req));
    if (!invite) {
      res.status(404).type("html").send(
        layout({
          title: "Invite",
          body: `<div class="login"><h1>Invite unavailable</h1><p class="lede">This link is invalid, expired, or already used.</p>${flashHtml("error", "Ask a superadmin for a new invite link.")}</div>`,
        })
      );
      return;
    }
    res.type("html").send(layout({ title: "Accept invite", body: inviteForm(invite.email, tokenParam(req), req.query.error ? String(req.query.error) : "") }));
  });

  router.post("/invite/:token", async (req, res) => {
    const token = tokenParam(req);
    const invite = await peekInvite(token);
    if (!invite) {
      res.status(404).type("html").send(
        layout({
          title: "Invite",
          body: `<div class="login"><h1>Invite unavailable</h1><p class="lede">This link is invalid, expired, or already used.</p>${flashHtml("error", "Ask a superadmin for a new invite link.")}</div>`,
        })
      );
      return;
    }
    const password = String(req.body.password ?? "");
    const confirm = String(req.body.confirm ?? "");
    const issue = passwordIssues(password);
    if (issue || password !== confirm) {
      const message = issue ?? "Passwords do not match";
      res.status(400).type("html").send(layout({ title: "Accept invite", body: inviteForm(invite.email, token, message) }));
      return;
    }
    const accepted = await acceptInvite(token, await hashPassword(password));
    if (!accepted) {
      res.status(404).type("html").send(
        layout({
          title: "Invite",
          body: `<div class="login"><h1>Invite unavailable</h1><p class="lede">This link is invalid, expired, or already used.</p>${flashHtml("error", "Ask a superadmin for a new invite link.")}</div>`,
        })
      );
      return;
    }
    const existing = readSessionCookie(req);
    if (existing) await destroySession(existing);
    const sessionToken = await createSession(accepted.userId, true);
    setSessionCookie(res, sessionToken, true);
    await audit(accepted.userId, "invite.accept", "user", accepted.userId);
    res.redirect("/enroll-totp");
  });

  return router;
}

function inviteForm(email: string, token: string, error: string): string {
  const passwordError = error && error !== "Passwords do not match" ? error : "";
  const confirmError = error === "Passwords do not match" ? error : "";
  return `
    <div class="login">
      <h1>Join</h1>
      <p class="lede">Set a password for ${esc(email)}, then enroll an authenticator on the next screen. This link works once.</p>
      ${error ? flashHtml("error", error) : ""}
      <form class="card" method="post" action="/invite/${esc(token)}">
        <div class="field">
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="new-password" required minlength="12" ${passwordError ? 'aria-invalid="true"' : ""} aria-describedby="password-help password-error" />
          <p class="help" id="password-help">At least 12 characters, with a letter and a number.</p>
          ${fieldError("password", passwordError ? { password: passwordError } : {}, "Enter a password of at least 12 characters.")}
        </div>
        <div class="field">
          <label for="confirm">Confirm password</label>
          <input id="confirm" name="confirm" type="password" autocomplete="new-password" required minlength="12" ${confirmError ? 'aria-invalid="true"' : ""} aria-describedby="confirm-error" />
          ${fieldError("confirm", confirmError ? { confirm: confirmError } : {}, "Confirm the password.")}
        </div>
        <div class="actions"><button type="submit">Continue</button></div>
      </form>
    </div>
    <script>
      (function () {
        var form = document.querySelector('form[action^="/invite/"]');
        if (!form) return;
        form.addEventListener("submit", function (event) {
          var mismatch = form.password.value !== form.confirm.value;
          form.confirm.setCustomValidity(mismatch ? "Passwords do not match" : "");
          if (mismatch) {
            event.preventDefault();
            form.confirm.reportValidity();
          }
        });
        form.confirm.addEventListener("input", function () { form.confirm.setCustomValidity(""); });
      })();
    </script>`;
}

function databaseFieldErrors(message: string): Record<string, string> {
  if (!message) return {};
  if (message === "That key is already in use") return { key: message };
  if (message === "Key and name are required") return { key: message, name: message };
  if (message === "A connection URL or host credentials are required") return { connection_url: message };
  return {};
}

function databaseForm(values: Record<string, unknown>, id?: string, posted = false, error = ""): string {
  const action = id ? `/databases/${id}` : "/databases";
  const errors = databaseFieldErrors(error);
  return `
    <div class="page-head">
      <div>
        <h1>${id ? "Edit database" : "Add database"}</h1>
        <p class="lede">Save a Postgres target. The password or connection URL is encrypted and only a last-4 hint is shown afterwards.</p>
      </div>
    </div>
    <form class="card" method="post" action="${action}">
      <h2>Target</h2>
      <div class="row">
        <div class="field">
          <label for="key">Key</label>
          <input id="key" name="key" required value="${esc(values.key)}" placeholder="app-prod" ${id ? "readonly" : ""} ${invalidAttr(errors, "key")} aria-describedby="key-help key-error" />
          <p class="help" id="key-help">${id ? "The key cannot be changed after create." : "Used by agents to choose this database. Unique to your account."}</p>
          ${fieldError("key", errors, "Enter a key.")}
        </div>
        <div class="field">
          <label for="name">Name</label>
          <input id="name" name="name" required value="${esc(values.name)}" ${invalidAttr(errors, "name")} aria-describedby="name-error" />
          ${fieldError("name", errors, "Enter a name.")}
        </div>
      </div>
      <div class="field">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes">${esc(values.notes)}</textarea>
      </div>
      <h2 class="section-title">Environment</h2>
      <div class="row">
        <div class="field">
          <label for="env_name">Environment name</label>
          <input id="env_name" name="env_name" value="${esc(values.env_name ?? "default")}" aria-describedby="env_name-help" />
          <p class="help" id="env_name-help">Agents ask for this name. Most targets only need default.</p>
        </div>
        <div class="field">
          <label for="permissions">Permissions</label>
          <select id="permissions" name="permissions">
            <option value="readonly" ${values.permissions !== "readwrite" ? "selected" : ""}>readonly</option>
            <option value="readwrite" ${values.permissions === "readwrite" ? "selected" : ""}>readwrite</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="connection_url">Connection URL</label>
        <input id="connection_url" name="connection_url" type="password" autocomplete="off" placeholder="${values.secret_hint ? "stored " + esc(values.secret_hint) + " — paste to replace" : "postgres://user:pass@host:5432/db"}" ${invalidAttr(errors, "connection_url")} aria-describedby="connection_url-help connection_url-error" />
        <p class="help" id="connection_url-help">Optional when host, database, username, and password are set.</p>
        ${fieldError("connection_url", errors, "Enter a connection URL or host credentials.")}
      </div>
      <div class="row-3">
        <div class="field"><label for="host">Host</label><input id="host" name="host" value="${esc(values.host)}" /></div>
        <div class="field"><label for="port">Port</label><input id="port" name="port" type="number" min="1" max="65535" value="${esc(values.port ?? 5432)}" /></div>
        <div class="field"><label for="database_name">Database</label><input id="database_name" name="database_name" value="${esc(values.database_name)}" /></div>
      </div>
      <div class="row">
        <div class="field"><label for="username">Username</label><input id="username" name="username" value="${esc(values.username)}" autocomplete="off" /></div>
        <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password" placeholder="${values.secret_hint ? "leave blank to keep" : ""}" /></div>
      </div>
      <div class="check"><input id="ssl" type="checkbox" name="ssl" ${checkAttr(values, "ssl", true, posted)} /><label for="ssl">Require SSL</label></div>
      <div class="actions"><button type="submit">Save</button><a class="btn ghost" href="/databases">Cancel</a></div>
    </form>`;
}

function emailFieldErrors(message: string): Record<string, string> {
  if (!message) return {};
  if (message === "That key is already in use") return { key: message };
  if (message === "Password is required") return { password: message };
  if (message === "Key, name, and address are required") return { key: message, name: message, address: message };
  return {};
}

function emailForm(values: Record<string, unknown>, id?: string, posted = false, error = ""): string {
  const action = id ? `/email/${id}` : "/email";
  const errors = emailFieldErrors(error);
  const smtpPort = values.smtp_port === undefined || values.smtp_port === "" ? 587 : values.smtp_port;
  const portBlocked = String(smtpPort) === "465";
  return `
    <div class="page-head">
      <div>
        <h1>${id ? "Edit mailbox" : "Add mailbox"}</h1>
        <p class="lede">Use 587 + TLS (STARTTLS). Port 465 is blocked on this server.</p>
      </div>
    </div>
    <form class="card" method="post" action="${action}">
      <h2>Mailbox</h2>
      <div class="row">
        <div class="field">
          <label for="key">Key</label>
          <input id="key" name="key" required value="${esc(values.key)}" ${id ? "readonly" : ""} ${invalidAttr(errors, "key")} aria-describedby="key-help key-error" />
          <p class="help" id="key-help">${id ? "The key cannot be changed after create." : "Agents use this key to pick the mailbox."}</p>
          ${fieldError("key", errors, "Enter a key.")}
        </div>
        <div class="field">
          <label for="name">Name</label>
          <input id="name" name="name" required value="${esc(values.name)}" ${invalidAttr(errors, "name")} aria-describedby="name-error" />
          ${fieldError("name", errors, "Enter a name.")}
        </div>
      </div>
      <div class="field">
        <label for="address">Address</label>
        <input id="address" name="address" type="email" required value="${esc(values.address)}" ${invalidAttr(errors, "address")} aria-describedby="address-error" autocomplete="off" />
        ${fieldError("address", errors, "Enter an email address.")}
      </div>
      <h2 class="section-title">Incoming mail (IMAP)</h2>
      <div class="row-3">
        <div class="field">
          <label for="imap_host">IMAP host</label>
          <input id="imap_host" name="imap_host" required value="${esc(values.imap_host)}" aria-describedby="imap_host-error" />
          ${fieldError("imap_host", {}, "Enter the IMAP host.")}
        </div>
        <div class="field">
          <label for="imap_port">IMAP port</label>
          <input id="imap_port" name="imap_port" type="number" min="1" max="65535" value="${esc(values.imap_port ?? 993)}" />
        </div>
        <div class="field">
          <label for="imap_user">IMAP user</label>
          <input id="imap_user" name="imap_user" value="${esc(values.imap_user)}" placeholder="defaults to address" aria-describedby="imap_user-help" />
          <p class="help" id="imap_user-help">Leave blank to sign in as the address above.</p>
        </div>
      </div>
      <div class="check"><input id="imap_secure" type="checkbox" name="imap_secure" ${checkAttr(values, "imap_secure", true, posted)} /><label for="imap_secure">IMAP implicit TLS</label></div>
      <h2 class="section-title">Outgoing mail (SMTP)</h2>
      <div class="row">
        <div class="field">
          <label for="smtp_host">SMTP host</label>
          <input id="smtp_host" name="smtp_host" required value="${esc(values.smtp_host)}" aria-describedby="smtp_host-error" />
          ${fieldError("smtp_host", {}, "Enter the SMTP host.")}
        </div>
        <div class="field">
          <label for="smtp_user">SMTP user</label>
          <input id="smtp_user" name="smtp_user" value="${esc(values.smtp_user)}" placeholder="resend, or leave blank" aria-describedby="smtp_user-help" />
          <p class="help" id="smtp_user-help">Leave blank to sign in as the address above.</p>
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label for="smtp_port">SMTP port</label>
          <input id="smtp_port" name="smtp_port" type="number" min="1" max="65535" required value="${esc(smtpPort)}" aria-describedby="smtp_port-help smtp-465-warn smtp_port-error" />
          <p class="help" id="smtp_port-help">Use 587 + TLS (STARTTLS). Port 465 is blocked on this server.</p>
          <div class="flash warn field-warn" id="smtp-465-warn" role="status" ${portBlocked ? "" : "hidden"}>Port 465 is blocked on this server. Use 587 with STARTTLS and leave SMTP secure unchecked.</div>
          ${fieldError("smtp_port", {}, "Enter an SMTP port.")}
        </div>
        <div class="field">
          <label for="permissions">Permissions</label>
          <select id="permissions" name="permissions">
            <option value="readwrite" ${values.permissions !== "readonly" ? "selected" : ""}>readwrite</option>
            <option value="readonly" ${values.permissions === "readonly" ? "selected" : ""}>readonly</option>
          </select>
          <p class="help">Readonly blocks send, reply, mark, and move.</p>
        </div>
      </div>
      <div class="check">
        <input id="smtp_secure" type="checkbox" name="smtp_secure" ${checkAttr(values, "smtp_secure", false, posted)} />
        <label for="smtp_secure">SMTP secure (implicit TLS)</label>
      </div>
      <p class="help">Leave SMTP secure unchecked for STARTTLS on port 587. Check it only when the provider requires implicit TLS.</p>
      <h2 class="section-title">Password and sent mail</h2>
      <div class="field">
        <label for="password">Password ${values.secret_hint ? `(stored ${esc(values.secret_hint)})` : ""}</label>
        <input id="password" name="password" type="password" autocomplete="new-password" ${id ? "" : "required"} placeholder="${id ? "leave blank to keep" : ""}" ${invalidAttr(errors, "password")} aria-describedby="password-error" />
        ${fieldError("password", errors, "Enter the mailbox password.")}
      </div>
      <div class="check"><input id="append_to_sent" type="checkbox" name="append_to_sent" ${checkAttr(values, "append_to_sent", true, posted)} /><label for="append_to_sent">Append sent copies to the IMAP Sent folder</label></div>
      <div class="field">
        <label for="sent_folder">Sent folder</label>
        <input id="sent_folder" name="sent_folder" value="${esc(values.sent_folder ?? "Sent")}" />
      </div>
      <div class="field">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes">${esc(values.notes)}</textarea>
      </div>
      <div class="actions"><button type="submit">Save</button><a class="btn ghost" href="/email">Cancel</a></div>
    </form>
    <script>
      (function () {
        var port = document.getElementById("smtp_port");
        var warn = document.getElementById("smtp-465-warn");
        if (!port || !warn) return;
        var sync = function () { warn.hidden = String(port.value).trim() !== "465"; };
        port.addEventListener("input", sync);
        sync();
      })();
    </script>`;
}

async function loadDatabase(id: string, session: UserSession) {
  const scope = visible(session);
  const rows = await sql<{
    id: string;
    key: string;
    name: string;
    notes: string | null;
    enabled: boolean;
    owner_id: string | null;
  }[]>`
    SELECT id, key, name, notes, enabled, owner_id
    FROM database_targets
    WHERE id = ${id} AND (${scope.all} OR owner_id = ${scope.userId})
  `;
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
      connection_url_secret_id: string | null;
    }[]>`
      SELECT name, host, port, database_name, username, ssl, permissions, secret_hint, connection_url_secret_id
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
    connection_url_secret_id: env?.connection_url_secret_id ?? null,
  };
}

async function loadEmail(id: string, session: UserSession) {
  const scope = visible(session);
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
    owner_id: string | null;
  }[]>`
    SELECT * FROM email_accounts
    WHERE id = ${id} AND (${scope.all} OR owner_id = ${scope.userId})
  `;
  return rows[0] ?? null;
}

async function upsertDatabase(req: Request, id: string | null): Promise<{ id: string; key: string }> {
  const session = req.userSession!;
  const scope = visible(session);
  const key = String(req.body.key ?? "").trim();
  const name = String(req.body.name ?? "").trim();
  if (!key || !name) throw new Error("Key and name are required");
  const envName = String(req.body.env_name ?? "default").trim() || "default";
  const password = String(req.body.password ?? "");
  const connectionUrlField = String(req.body.connection_url ?? "");

  let targetId = id;
  let ownerId = session.userId;
  if (!targetId) {
    const inserted = await sql<{ id: string }[]>`
      INSERT INTO database_targets (key, name, notes, owner_id)
      VALUES (${key}, ${name}, ${String(req.body.notes ?? "") || null}, ${ownerId})
      RETURNING id
    `;
    targetId = inserted[0].id;
  } else {
    const existingOwner = await sql<{ owner_id: string | null }[]>`
      SELECT owner_id FROM database_targets
      WHERE id = ${targetId} AND (${scope.all} OR owner_id = ${scope.userId})
    `;
    if (!existingOwner[0]?.owner_id) throw new Error("Not found");
    ownerId = existingOwner[0].owner_id;
    const updated = await sql`
      UPDATE database_targets
      SET name = ${name}, notes = ${String(req.body.notes ?? "") || null}, updated_at = now()
      WHERE id = ${targetId} AND owner_id = ${ownerId}
    `;
    if (updated.count === 0) throw new Error("Not found");
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
  let envWritten = false;
  if (url) {
    hint = secretHint(url);
    const oldSecretId = secretId;
    if (existing[0] && oldSecretId) {
      await sql.begin(async (tx) => {
        const newSecretId = await insertVaultSecret(tx, url, ownerId);
        await tx`
          UPDATE database_environments SET
            host = ${String(req.body.host ?? "") || null},
            port = ${Number(req.body.port || 5432)},
            database_name = ${String(req.body.database_name ?? "") || null},
            username = ${String(req.body.username ?? "") || null},
            ssl = ${bool(req.body.ssl)},
            connection_url_secret_id = ${newSecretId},
            secret_hint = ${hint},
            permissions = ${asPerm(req.body.permissions)},
            updated_at = now()
          WHERE id = ${existing[0].id}
        `;
        await tx`DELETE FROM vault_secrets WHERE id = ${oldSecretId}`;
        secretId = newSecretId;
      });
      envWritten = true;
    } else {
      secretId = await storeSecret(url, ownerId);
    }
  }
  if (!secretId) throw new Error("A connection URL or host credentials are required");

  if (!envWritten) {
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
  }
  return { id: targetId, key };
}

async function upsertEmail(req: Request, id: string | null): Promise<{ id: string; key: string }> {
  const session = req.userSession!;
  const scope = visible(session);
  const key = String(req.body.key ?? "").trim();
  const name = String(req.body.name ?? "").trim();
  const address = String(req.body.address ?? "").trim();
  const password = String(req.body.password ?? "");
  if (!key || !name || !address) throw new Error("Key, name, and address are required");

  let secretId: string | null = null;
  let hint: string | null = null;
  let ownerId = session.userId;
  if (id) {
    const existing = await sql<{ password_secret_id: string | null; secret_hint: string | null; owner_id: string | null }[]>`
      SELECT password_secret_id, secret_hint, owner_id FROM email_accounts
      WHERE id = ${id} AND (${scope.all} OR owner_id = ${scope.userId})
    `;
    if (!existing[0]?.owner_id) throw new Error("Not found");
    secretId = existing[0].password_secret_id;
    hint = existing[0].secret_hint;
    ownerId = existing[0].owner_id;
  }

  const fields = {
    key,
    name,
    address,
    imap_host: String(req.body.imap_host ?? "").trim(),
    imap_port: Number(req.body.imap_port || 993),
    imap_secure: bool(req.body.imap_secure),
    smtp_host: String(req.body.smtp_host ?? "").trim(),
    smtp_port: Number(req.body.smtp_port || 587),
    smtp_secure: bool(req.body.smtp_secure),
    imap_user: String(req.body.imap_user ?? "").trim() || null,
    smtp_user: String(req.body.smtp_user ?? "").trim() || null,
    permissions: asPerm(req.body.permissions === "readonly" ? "readonly" : "readwrite"),
    append_to_sent: bool(req.body.append_to_sent),
    sent_folder: String(req.body.sent_folder ?? "Sent") || "Sent",
    notes: String(req.body.notes ?? "") || null,
  };

  if (password) {
    hint = secretHint(password);
    const oldSecretId = secretId;
    if (id && oldSecretId) {
      await sql.begin(async (tx) => {
        const newSecretId = await insertVaultSecret(tx, password, ownerId);
        const updated = await tx`
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
            password_secret_id = ${newSecretId},
            secret_hint = ${hint},
            permissions = ${fields.permissions},
            append_to_sent = ${fields.append_to_sent},
            sent_folder = ${fields.sent_folder},
            notes = ${fields.notes},
            updated_at = now()
          WHERE id = ${id} AND owner_id = ${ownerId}
        `;
        if (updated.count === 0) throw new Error("Not found");
        await tx`DELETE FROM vault_secrets WHERE id = ${oldSecretId}`;
        secretId = newSecretId;
      });
      return { id, key };
    }
    secretId = await storeSecret(password, ownerId);
  }
  if (!secretId) throw new Error("Password is required");

  if (!id) {
    const inserted = await sql<{ id: string }[]>`
      INSERT INTO email_accounts (
        key, name, address, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure,
        imap_user, smtp_user,
        password_secret_id, secret_hint, permissions, append_to_sent, sent_folder, notes, owner_id
      ) VALUES (
        ${fields.key}, ${fields.name}, ${fields.address}, ${fields.imap_host}, ${fields.imap_port}, ${fields.imap_secure},
        ${fields.smtp_host}, ${fields.smtp_port}, ${fields.smtp_secure},
        ${fields.imap_user}, ${fields.smtp_user},
        ${secretId}, ${hint}, ${fields.permissions},
        ${fields.append_to_sent}, ${fields.sent_folder}, ${fields.notes}, ${ownerId}
      ) RETURNING id
    `;
    return { id: inserted[0].id, key };
  }

  const updated = await sql`
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
    WHERE id = ${id} AND owner_id = ${ownerId}
  `;
  if (updated.count === 0) throw new Error("Not found");
  return { id, key };
}
