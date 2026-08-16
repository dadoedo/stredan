# Agent brief: Stredan Agent MCP Platform (DB + Email)

> **Status:** Platform is **shipped**. Live URLs and day-to-day ops:  
> [`docs/cloud-agents/mcp.md`](./cloud-agents/mcp.md) · [`services/agent-mcp/README.md`](../services/agent-mcp/README.md) · [`docs/cloud-agents/README.md`](./cloud-agents/README.md)  
> Tracking: [#1](https://github.com/dadoedo/stredan/issues/1) · [#2](https://github.com/dadoedo/stredan/issues/2)

The sections below are the **original implementation brief** (kept for history / replay). Prefer the cloud-agents docs for current “how to use / edit”.

---

## Prompt (paste / follow exactly)

You are implementing the **Stredan Agent MCP Platform** in repo `dadoedo/stredan`.

**Read first:** this file + GitHub issues #1 and #2. Then implement and deploy until acceptance criteria on both issues are met (or #1 fully done and #2 clearly follow-up if blocked — prefer both in one pass).

### Outcome (non-negotiable)

1. **Web dashboard** at `https://mcp.stredan.sk` — only David logs in (password + TOTP). From the UI he can add/edit/disable **Postgres databases** and **email mailboxes**, manage **API keys** (scoped), and store secrets **encrypted at rest**.
2. **Postgres MCP** (Streamable HTTP) at `https://postgres.mcp.stredan.sk` — multi-DB; tools at least `list_databases`, `query`, `get_schema`; readonly enforcement.
3. **Email MCP** (Streamable HTTP) at `https://email.mcp.stredan.sk` — multi-account; parity with local email MCP tools; per-account readonly.
4. Runs on SSH host **`stredan-hetzner`** (`178.105.3.145`), behind existing **edge-caddy**.
5. **CI/CD on `main`**: push → build/push image(s) → SSH deploy (Geomap-style GitHub Environment).
6. Code lives **in this repo** under `services/agent-mcp/` (do not break marketing Next.js app on `alldevs-hetzner`).

### Why this architecture

Cursor Cloud Agents do **not** see laptop `~/.cursor/mcp.json`. They need dashboard-registered **HTTP** MCP (not SSE). Local reference servers already exist — port them and add HTTP + DB-backed config + dashboard:

| Local reference | Path on David’s machine |
|-----------------|-------------------------|
| Postgres multi-DB MCP | `/home/david/PhpstormProjects/private/postgres-mcp-server` |
| Email multi-account MCP | `/home/david/PhpstormProjects/private/email-mcp-server` |

Supersedes older “My Machines / stdio only” plan in email-mcp `CLOUD_DEPLOYMENT_PLAN.md` for this deliverable.

### Host / DNS / edge (facts)

| Item | Value |
|------|--------|
| Deploy SSH | `stredan-hetzner` → `root@178.105.3.145`, key `~/.ssh/id_ed25519_personal` |
| Edge | `/root/edge/` — Caddy imports `/etc/caddy/sites/*.caddy`; add `agent-mcp.caddy`; `docker exec edge-caddy caddy reload --config /etc/caddy/Caddyfile` |
| Docker network | Join network that can reach `edge-caddy` (inspect how askdata/geomap attach; typically external `web` or project network linked to edge) |
| Marketing stredan.sk | On **`alldevs-hetzner`** (`49.13.94.193`) `/root/stredan` — **do not redeploy/overwrite** |
| DNS needed | `mcp`, `postgres.mcp`, `email.mcp` under `stredan.sk` → `178.105.3.145` (+ AAAA if used). If you cannot change DNS, document exact records and use temporary hosts / ask user — but aim to configure DNS if tooling/access exists |

### Suggested technical design (you may refine, keep constraints)

```text
services/agent-mcp/
  apps/web/          # Dashboard (Next.js or similar) — mcp.stredan.sk
  apps/mcp-postgres/ # Streamable HTTP MCP OR single process with path/host routing
  apps/mcp-email/
  packages/core/     # vault, config repo, api-key auth, shared types
  deploy/            # docker-compose.prod.yml, Caddy snippet, .env.example
  .github/workflows/ # or repo-root workflow path-filtered to services/agent-mcp/**
```

**Single compose stack** on server e.g. `/root/agent-mcp/`:

- `agent-mcp-db` — Postgres for platform metadata
- `agent-mcp-app` — one Node service serving dashboard + both MCP endpoints (simplest ops) **or** split containers behind Caddy

**Secrets vault:** AES-256-GCM; `MASTER_ENCRYPTION_KEY` (32 bytes) only in environment / GH secrets. Store ciphertext + iv/nonce in platform DB. UI never re-displays secrets.

**Admin auth:** bootstrap first admin via env (`ADMIN_EMAIL` + `ADMIN_PASSWORD`) on first boot, then force TOTP enrollment. Sessions: signed httpOnly cookie.

**MCP auth:** `Authorization: Bearer <api_key>`. Keys hashed at rest (like passwords). Key metadata: label, scopes (`db:id`, `email:id`, `readonly` flag).

**Postgres MCP behavior:** load targets from platform DB; pool connections; readonly SQL guard (reject writes). Support URLs to local docker DBs on this host, remote Hetzner, Neon.

**Email MCP behavior:** port imapflow/nodemailer tooling from local server; permissions gate writes.

### CI/CD requirements

Mirror Geomap production workflow ideas:

- Trigger: push `main` (+ `workflow_dispatch`)
- GitHub Environment e.g. `agent-mcp-production`
- Secrets: `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`, `MASTER_ENCRYPTION_KEY`, `ADMIN_PASSWORD` (bootstrap), GHCR login via `GITHUB_TOKEN`
- Vars: `REMOTE_DIR`, image names, public URLs
- Build → `ghcr.io/dadoedo/...` → scp compose → ssh `docker compose pull && up -d`
- Path filters: only `services/agent-mcp/**` (+ workflow file) to avoid coupling with marketing deploys

### Implementation order

1. Scaffold `services/agent-mcp` + local docker compose + platform schema (admin, secrets, targets, api_keys)
2. Dashboard auth (password + TOTP) + DB CRUD + API keys
3. Postgres HTTP MCP wired to vault + scopes
4. Email HTTP MCP + dashboard email CRUD
5. Caddy site + DNS + server bootstrap
6. GitHub Actions deploy; prove green deploy from `main`
7. README: Cursor Team MCP JSON snippets; smoke-test checklist
8. Close out issue checklists in #1 and #2 (comment on issues with URLs + how to register)

### Security checklist

- [ ] No plaintext DB/IMAP passwords in git, logs, or MCP tool results
- [ ] MCP without key → 401
- [ ] Readonly scopes enforced server-side
- [ ] Dashboard not publicly writable; rate-limit login
- [ ] TLS via Caddy only; app binds internal docker network

### Definition of done

- Live: `mcp.stredan.sk`, `postgres.mcp.stredan.sk`, `email.mcp.stredan.sk`
- User can manage DBs + mailboxes in UI
- Cursor can register both MCP URLs with a Bearer key and call tools
- `main` CI deploys successfully
- Issues #1 and #2 acceptance boxes checked (or PR description maps each box)

### Explicit non-goals

- Rebuilding marketing site
- Moving Geomap/AskData stacks
- Per-Cloud-Agent Cursor ACL beyond API key scopes (ACL lives in this platform)

---

## Operator smoke test (after deploy)

```bash
# Dashboard
curl -sI https://mcp.stredan.sk | head

# MCP unauthorized
curl -sI https://postgres.mcp.stredan.sk
# expect 401 without Authorization

# With key (from dashboard): use MCP inspector or Cursor Team MCP
```

Register in Cursor → Dashboard → Integrations & MCP (Team) or cursor.com/agents MCP dropdown:

- URL `https://postgres.mcp.stredan.sk` + header `Authorization: Bearer …`
- URL `https://email.mcp.stredan.sk` + same or scoped key

---

## Issue cross-links

- https://github.com/dadoedo/stredan/issues/1
- https://github.com/dadoedo/stredan/issues/2
