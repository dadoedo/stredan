# Remote MCP for Cloud Agents (Postgres + Email)

Cloud Agents do **not** load laptop `~/.cursor/mcp.json`. They use **Team / personal Cloud MCP** registered in the Cursor dashboard, pointing at HTTPS Streamable HTTP endpoints.

| Surface | URL |
|---------|-----|
| Admin dashboard | https://mcp.stredan.sk |
| Postgres MCP | https://postgres.mcp.stredan.sk |
| Email MCP | https://email.mcp.stredan.sk |

**Not an agent control board.** Scheduling and runs live in Cursor Automations. This dashboard only stores DB + mailbox credentials for MCP tools. Human ops for leadgen is `stredan.sk/admin`.

Hosted on **`stredan-hetzner`** (`/root/agent-mcp`), behind edge-caddy.  
Deep dive / deploy: [`services/agent-mcp/README.md`](../../services/agent-mcp/README.md).

Historical build brief (issues #1/#2): [`../agent-mcp-platform-brief.md`](../agent-mcp-platform-brief.md).

---

## What agents should do

1. Use MCP tools when they need DB or inbox access (already connected if Team MCP is enabled for the run).
2. Prefer **readonly** queries and read email tools unless the human asks to write/send.
3. To **add/change a database or mailbox**: tell the human to use https://mcp.stredan.sk (or use SSH + ops only if explicitly asked to change platform config via deploy — normal path is the web UI).
4. Do not invent connection strings in git; secrets live encrypted in the MCP platform vault.

---

## Registering MCP in Cursor (humans)

Cursor → [Integrations & MCP](https://cursor.com/dashboard/integrations) (Team) or MCP dropdown on [cursor.com/agents](https://cursor.com/agents).

```json
{
  "mcpServers": {
    "stredan-postgres": {
      "url": "https://postgres.mcp.stredan.sk",
      "headers": { "Authorization": "Bearer smcp_YOUR_KEY" }
    },
    "stredan-email": {
      "url": "https://email.mcp.stredan.sk",
      "headers": { "Authorization": "Bearer smcp_YOUR_KEY" }
    }
  }
}
```

Create/revoke keys in the MCP dashboard (scoped to DB ids / mailbox ids; optional force-readonly). Plaintext key shown once.

Without `Authorization` → **401**.

---

## Tools (summary)

**Postgres:** `list_databases`, `query`, `get_schema`, `list_tables`  
`query`: `database`, optional `environment` (default `default`), `sql`.  
Readonly key/env rejects writes/DDL.

**Email:** `list_accounts`, `list_folders`, `list_messages`, `read_message`, `search_messages`, `send_message`, `reply_message`, `mark_message`, `move_message`  
Readonly account/key blocks send/reply/mark/move.

Some IMAP providers block datacenter IPs — if dashboard “Test IMAP” fails, agents cannot use that mailbox from this host until fixed.

---

## Adding a DB or mailbox

1. Log into https://mcp.stredan.sk (password + TOTP).
2. Create target → paste connection URL / IMAP+SMTP fields → save (secret encrypted; UI shows last-4 only).
3. Use **Test connection**.
4. Ensure API keys used by Cloud Agents include the new target in their scope (or create a new key).
5. No redeploy required for config changes (hot reload from platform DB).

Platform code/deploy changes: see `services/agent-mcp/` + CI on `main`.

---

## MCP vs SSH

| Need | Prefer |
|------|--------|
| SELECT / schema / list tables | Postgres MCP |
| Read/search mail | Email MCP |
| `docker compose`, logs, restart, files on VPS | SSH as `stredan-cursor-agent` ([ssh.md](./ssh.md)) |
| Change which DBs exist for agents | MCP dashboard |
