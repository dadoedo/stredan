# Stredan Agent MCP Platform

Remote **Streamable HTTP** MCP servers for Cursor Cloud Agents, plus a private dashboard to manage Postgres targets, mailboxes, and API keys.

| Surface | URL |
|---------|-----|
| Dashboard | https://mcp.stredan.sk |
| Postgres MCP | https://postgres.mcp.stredan.sk |
| Email MCP | https://email.mcp.stredan.sk |

Host: `stredan-hetzner` (`178.105.3.145`), edge-caddy, compose in `/root/agent-mcp`. Marketing `stredan.sk` stays on `alldevs-hetzner`.

## Dashboard

Sign-in is email + password, then TOTP (forced on first login). Sessions are httpOnly cookies.

The first account is the superadmin (`ADMIN_EMAIL` + `ADMIN_PASSWORD` on an empty `users` table). A superadmin invites everyone else from **Users**. The invite is a one-time link (`PUBLIC_DASHBOARD_URL/invite/...`, 7 days). The invitee sets a password (at least 12 characters, with a letter and a number) and enrolls TOTP. Invited accounts are role `user`.

Isolation:

- A user sees and edits only their own databases, mailboxes, and API keys. They can add and test those, and create keys scoped to them.
- A key can only reference its owner's resources. Wildcard scope (`*`) means every database or mailbox that owner has, not other tenants.
- A superadmin sees every tenant in the dashboard (and can revoke any key) but a key they create is still limited to resources they own.
- One `MASTER_ENCRYPTION_KEY` encrypts every secret. There is no per-user key.

You can:

- Add / edit / disable Postgres databases (URL or host fields). Passwords encrypted at rest (AES-256-GCM). Last-4 hint only after save.
- Add / edit / disable IMAP/SMTP mailboxes the same way.
- Create scoped Bearer API keys (which of your DBs / mailboxes, optional force-readonly). Plaintext shown once.
- Test Postgres and IMAP connectivity.
- Read an audit log of your actions. Tool calls record key id, owner, tool, target, time, and success. Superadmin sees everyone's log.

## Cursor Team MCP

Cursor → Dashboard → Integrations & MCP (or [cursor.com/agents](https://cursor.com/agents) MCP dropdown).

Postgres:

```json
{
  "mcpServers": {
    "stredan-postgres": {
      "url": "https://postgres.mcp.stredan.sk",
      "headers": {
        "Authorization": "Bearer smcp_YOUR_KEY"
      }
    }
  }
}
```

Email:

```json
{
  "mcpServers": {
    "stredan-email": {
      "url": "https://email.mcp.stredan.sk",
      "headers": {
        "Authorization": "Bearer smcp_YOUR_KEY"
      }
    }
  }
}
```

Requests without `Authorization` return **401**.

### Postgres tools

`list_databases`, `query`, `get_schema`, `list_tables`

`query` arguments: `database` (key), optional `environment` (default `default`), `sql`.

Readonly API keys and readonly database environments reject `INSERT` / `UPDATE` / `DELETE` / DDL.

### Email tools

`list_accounts`, `list_folders`, `list_messages`, `read_message`, `search_messages`, `send_message`, `reply_message`, `mark_message`, `move_message`

Readonly accounts (or readonly keys) reject send / reply / mark / move. Read tools stay available.

Some IMAP providers block datacenter IPs; if Test IMAP fails from the dashboard, the mailbox still cannot be used from this host until the provider allows it.

## Secrets

`MASTER_ENCRYPTION_KEY` is 32 bytes (64 hex chars), shared by every tenant. It never lives in git. Changing it makes existing ciphertext unreadable. Do not rotate it as part of the tenancy upgrade.

`.env` on the server is created on first CI deploy from GitHub Environment secrets and is **not** overwritten later. Rotate by editing `/root/agent-mcp/.env` (and the matching GitHub secrets if you re-bootstrap).

Template: [`deploy/.env.example`](./deploy/.env.example).

## CI/CD

Push to `main` under `services/agent-mcp/**` (or this workflow file) → GitHub Environment `agent-mcp-production` → GHCR `ghcr.io/dadoedo/agent-mcp` → SSH deploy.

### Environment secrets

| Secret | Purpose |
|--------|---------|
| `PRODUCTION_HOST` | `178.105.3.145` |
| `PRODUCTION_USER` | `root` |
| `PRODUCTION_SSH_KEY` | Deploy private key |
| `POSTGRES_PASSWORD` | Platform DB password (first boot) |
| `MASTER_ENCRYPTION_KEY` | AES key (first boot) |
| `SESSION_SECRET` | Cookie signing (first boot) |
| `ADMIN_EMAIL` | Bootstrap superadmin, and the owner assigned to pre-tenancy rows |
| `ADMIN_PASSWORD` | Bootstrap password (only when `users` is empty) |

### Environment variables

| Variable | Default |
|----------|---------|
| `REMOTE_DIR` | `/root/agent-mcp` |
| `COMPOSE_FILE` | `deploy/docker-compose.prod.yml` |
| `APP_URL` | `https://mcp.stredan.sk` |
| `IMAGE_TAG` | `prod` |

## Tenancy migration

`migrate()` runs on process start before the server listens. It is idempotent (`CREATE` / `ADD COLUMN IF NOT EXISTS`, then a data backfill). No manual SQL.

On each boot the backfill:

1. Copies each legacy `admins` row into `users` as `superadmin` (same id, password hash, and TOTP secret). A later boot does not overwrite a password or TOTP that already exists on `users`.
2. Sets `ADMIN_EMAIL` to `superadmin` when that user exists.
3. Assigns every `email_accounts`, `database_targets`, `api_keys`, and `vault_secrets` row with a null `owner_id` to that superadmin (or, if `ADMIN_EMAIL` is not a user yet, the earliest superadmin).
4. Reattaches `sessions` and old audit rows to the matching user. API key hashes and scope JSON are not rewritten.

Existing `smcp_` keys keep working. After the backfill they belong to the superadmin, so a `*` scope still sees the databases and mailboxes that were moved with them. Mailboxes and databases created later by invited users stay out of those keys.

Confirm `ADMIN_EMAIL` in `/root/agent-mcp/.env` matches the current admin email before the first boot of this version. A mismatch does not drop data: legacy admins are still copied as superadmins, and unowned rows go to the earliest superadmin when `ADMIN_EMAIL` has no user yet.

Invites need `PUBLIC_DASHBOARD_URL` (already set in production) so the one-time link points at the dashboard. No new environment variables.

## Local

```bash
cd services/agent-mcp
cp deploy/.env.example .env
# fill MASTER_ENCRYPTION_KEY, SESSION_SECRET, ADMIN_PASSWORD, POSTGRES_PASSWORD
# COOKIE_SECURE=false
npm install
docker compose -f deploy/docker-compose.yml up --build
# dashboard http://127.0.0.1:3010
```

Or `DATABASE_URL=postgres://… npm run dev` against a local Postgres.

`npm test` applies the schema to a database whose name contains `agent_mcp_test` (default `postgres://agentmcp:agentmcp@127.0.0.1:5432/agent_mcp_test`) and checks tenant isolation. `npm run typecheck` covers `src` and `test`.

## DNS

A records (no CNAME to apex) pointing at `178.105.3.145`:

| Name | Type | Value |
|------|------|--------|
| `mcp` | A | `178.105.3.145` |
| `postgres.mcp` | A | `178.105.3.145` |
| `email.mcp` | A | `178.105.3.145` |

HostCreators WebAdmin (NS for `stredan.sk`). `rd.stredan.sk` is the existing pattern.

## Reachability of target databases

The MCP container can open TCP to Neon, other Hetzner hosts, and published host ports via `host.docker.internal`. Example for a DB published on the same machine at `127.0.0.1:5433`:

`postgres://user:pass@host.docker.internal:5433/dbname`
