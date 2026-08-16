# Cloud Agents — operator guide

Canonical docs for **Cursor Cloud Agents** across Stredan / AllDevs / Anderro / related prods.

**Start here if you are an agent** (or a human updating ops):

| Doc | What it covers |
|-----|----------------|
| [environments.md](./environments.md) | Dashboard vs `.cursor/environment.json`, Install vs Start, how to edit, secrets |
| [ssh.md](./ssh.md) | `stredan-cursor-agent` identity, host inventory, add/rotate keys, per-repo snippets |
| [mcp.md](./mcp.md) | Remote Postgres + Email MCP URLs, dashboard, API keys, how agents should use them |
| [../infrastructure.md](../infrastructure.md) | Marketing `stredan.sk` on **alldevs-hetzner** (separate from MCP host) |
| [../../services/agent-mcp/README.md](../../services/agent-mcp/README.md) | Agent MCP platform deep dive (deploy, tools, vault) |

## Mental model (3 layers)

```text
1. Cursor dashboard (team/user)
   - Team MCP: postgres.mcp.stredan.sk, email.mcp.stredan.sk
   - Secrets: AGENT_SSH_PRIVATE_KEY, MCP keys live in MCP dashboard not git
   - Environments: Install / Start / network / builds

2. Per-repo environment
   - Dashboard-managed (e.g. stredan) OR
   - Code-managed via .cursor/environment.json (anderro, geomap)

3. Target servers
   - SSH as user stredan-cursor-agent (sudo + docker)
   - DBs/mail via MCP (preferred) or SSH + docker when needed
```

## What lives where

| Concern | Where |
|---------|--------|
| Marketing site `stredan.sk` | `alldevs-hetzner` `/root/stredan` |
| Agent MCP + dashboard | `stredan-hetzner` `/root/agent-mcp` → `*.mcp.stredan.sk` |
| GeoMap prod | `stredan-hetzner` (geomap containers + edge) |
| GeoMap / OffStudio staging | `alldevs-staging` |
| Anderro prod | `anderro-prod` |
| Amber/BMA/Foodient/Viralsky/SkySnail DBs | `hetzner-prod` |
| Pozicto prod | `pozicto-prod` |
| OffStudio / Stredan marketing / AllBook style stacks | `alldevs-hetzner` |
| ClientUp | **out of scope** for agent SSH |

## Default preferences for agents

1. Prefer **MCP** for SQL and email (`list_*` / `query` / read tools) over ad-hoc tunnels.
2. Use **SSH** for docker/compose, logs, one-off server ops — always as `stredan-cursor-agent`, never paste personal keys.
3. Prod writes: only when the human explicitly asks; prefer readonly keys/roles.
4. Do not commit secrets, private keys, or plaintext connection strings.
