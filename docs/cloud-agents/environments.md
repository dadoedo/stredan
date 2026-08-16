# Cloud Agent environments — how to edit

Cursor resolves environment config in this order (first match wins):

1. **`.cursor/environment.json`** in the repo (locks the dashboard Edit UI)
2. Personal saved environment
3. Team saved environment

Dashboard: [Cloud Agents → Environments](https://cursor.com/dashboard/cloud-agents#environments)

Official docs: [Setup](https://cursor.com/docs/cloud-agent/setup.md) · [Settings](https://cursor.com/docs/cloud-agent/settings.md)

---

## Inventory (as of 2026-08)

| Repo | Mode | Where to edit Start / Install |
|------|------|-------------------------------|
| `dadoedo/stredan` | **Dashboard** | Environment edit UI (Install / Start fields) |
| `dadoedo/anderro` | **Code** | `.cursor/environment.json` + `scripts/cloud-agent-ssh.sh` |
| `dadoedo/geomap` | **Code** | `.cursor/environment.json` + `.cursor/setup-ssh.sh` (+ Dockerfile build) |
| Most other repos (offstudio, pozicto, askdata, …) | **Dashboard** (no `environment.json` on default branch) | Environment edit UI |

If the UI shows: *“This environment is managed by a `.cursor/environment.json` file…”* — **edit the file in git**, not the grayed-out form. Commit + push to the branch agents use (usually default).

---

## Install vs Start (important)

| Script | When it runs | Use for | Do **not** use for |
|--------|--------------|---------|---------------------|
| **Install** | During **Build**; result is snapshotted | `npm ci`, `prisma generate`, apt packages, warming caches | Writing SSH private keys / runtime secrets onto disk as part of the snapshot |
| **Start** | Each agent boot (non-blocking / background-friendly) | Materialize `~/.ssh` from `AGENT_SSH_PRIVATE_KEY`, start docker compose, long-running helpers | Heavy one-time dependency installs (prefer Install) |

**SSH key materialization belongs in Start** (or a script invoked from Start).  
Putting it only in Install risks baking secrets into the Build snapshot and missing updates when the Runtime secret changes.

---

## How to edit — dashboard mode

1. Open [Environments](https://cursor.com/dashboard/cloud-agents#environments) → select the env (e.g. `dadoedo/stredan`).
2. **Configuration → Install Script** / **Start Script** — edit, Save.
3. **Secrets** on the environment (or team): add Runtime secret `AGENT_SSH_PRIVATE_KEY` (full PEM/OPENSSH private key body).
4. Start a **new** Cloud Agent run (or trigger a new Build if Install changed) so changes apply.

Optional UI actions: **Update with Agent**, **New Setup Run**, **Restore** from version history (see environment page).

### Recommended Start pattern (dashboard)

Keep repo-specific install in Install. In Start, either paste a short SSH block (only the Hosts that repo needs) or call a script if one exists in the repo.

Full multi-host template: [ssh.md](./ssh.md#full-start-snippet-all-agent-hosts).

---

## How to edit — code mode (`environment.json`)

Example (Anderro):

```json
{
  "name": "anderro-web",
  "install": "npm install && bash scripts/cloud-agent-gh-pat.sh",
  "start": "bash scripts/cloud-agent-ssh.sh; bash scripts/cloud-agent-gh-pat.sh --mount; bash scripts/dev-bootstrap-web.sh",
  "terminals": [ … ],
  "ports": [ … ]
}
```

Example (Geomap):

```json
{
  "name": "geomap-tier-a",
  "build": { "dockerfile": "Dockerfile", "context": "." },
  "install": "bash .cursor/install.sh",
  "start": "bash .cursor/setup-ssh.sh; bash .cursor/start-services.sh",
  …
}
```

### Per-repo SSH scripts (scoped hosts)

| Repo | Script | Hosts configured |
|------|--------|------------------|
| Anderro | `scripts/cloud-agent-ssh.sh` | `anderro-prod` only |
| Geomap | `.cursor/setup-ssh.sh` | `alldevs-staging`, `stredan-hetzner` (prod) |

Both scripts **no-op successfully** if `AGENT_SSH_PRIVATE_KEY` is missing (log a skip message). They still require the secret to be attached as a **Runtime** secret on that environment (or inherited team secret, depending on Cursor account setup).

### Changing code-managed Start

1. Edit the script and/or `environment.json`.
2. Commit + push to the branch Cloud Agents use.
3. Next agent run picks up the new Start from that commit (Builds use default-branch config for prepare; confirm with a fresh agent if unsure).

---

## Unifying dashboard vs code (policy)

**Preference:** dashboard for simple apps (Stredan, OffStudio, …) — one place for Start + secrets + network.

**Keep code** when the env is complex and versioned with the product (Geomap Dockerfile + service start). Optional later: migrate Anderro to dashboard by copying Install/Start into UI, then deleting `.cursor/environment.json`.

Do **not** half-edit: if `environment.json` exists, dashboard Start edits are ignored.

---

## Secrets checklist

| Secret | Type | Purpose |
|--------|------|---------|
| `AGENT_SSH_PRIVATE_KEY` | Runtime | Private key for `stredan-cursor-agent` ([ssh.md](./ssh.md)) |
| MCP Bearer keys | Cursor Team MCP headers / local mcp config | Access to postgres/email MCP — create in https://mcp.stredan.sk |
| App DB URLs etc. | Env-specific | Only if the agent must talk to DB **without** MCP |

Never commit private keys or `smcp_…` API keys to git.

---

## Smoke test after editing

```bash
# Inside a Cloud Agent terminal after Start has run:
whoami
test -f ~/.ssh/id_ed25519 && echo "key ok"
ssh -o BatchMode=yes <alias> 'whoami; hostname'
# expect: stredan-cursor-agent + expected hostname
```

Aliases depend on which Hosts the Start script wrote — see [ssh.md](./ssh.md).
