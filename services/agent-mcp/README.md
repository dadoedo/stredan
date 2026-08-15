# Stredan Agent MCP Platform

Remote **Streamable HTTP** MCP servers for Cursor Cloud Agents, plus a private dashboard to manage Postgres targets, mailboxes, and API keys.

| Surface | URL |
|---------|-----|
| Dashboard | https://mcp.stredan.sk |
| Postgres MCP | https://postgres.mcp.stredan.sk |
| Email MCP | https://email.mcp.stredan.sk |

Host: `stredan-hetzner` (`178.105.3.145`), edge-caddy, compose in `/root/agent-mcp`. Marketing `stredan.sk` stays on `alldevs-hetzner`.

## Dashboard

Single admin (`ADMIN_EMAIL`). Sign-in is password then TOTP (forced on first login). Sessions are httpOnly cookies.

You can:

- Add / edit / disable Postgres databases (URL or host fields). Passwords encrypted at rest (AES-256-GCM). Last-4 hint only after save.
- Add / edit / disable IMAP/SMTP mailboxes the same way.
- Create scoped Bearer API keys (which DBs / mailboxes, optional force-readonly). Plaintext shown once.
- Test Postgres and IMAP connectivity.
- Read an audit log of admin actions.

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

`MASTER_ENCRYPTION_KEY` is 32 bytes (64 hex chars). It never lives in git. Changing it makes existing ciphertext unreadable.

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
| `ADMIN_EMAIL` | Bootstrap admin |
| `ADMIN_PASSWORD` | Bootstrap password |

### Environment variables

| Variable | Default |
|----------|---------|
| `REMOTE_DIR` | `/root/agent-mcp` |
| `COMPOSE_FILE` | `deploy/docker-compose.prod.yml` |
| `APP_URL` | `https://mcp.stredan.sk` |
| `IMAGE_TAG` | `prod` |

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
