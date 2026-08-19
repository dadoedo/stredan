# AI SME Leadgen — Architecture

Operator: **Cursor Cloud Agent / Automations** (daily). Human: evaluate + tweak offers, templates, ICP in **stredan.sk/admin**.

**mcp.stredan.sk is not the agent control board.** It only grants access to Postgres and email. Scheduling, prompts, and runs live in Cursor Automations. The human ops UI is the Stredan admin.

## Goal

High-volume outbound to Slovak SMEs testing **5 offers (A–E)** across **5 send identities (1–5)**. Every judgment step is logged in Postgres (`inputJson` / `outputJson`). No public HTTP API: agents write via **Postgres MCP**.

## Experiment matrix

| Axis | Meaning |
|------|---------|
| Rows **A–E** | Content / opening / cold offer (`Offer` + `EmailTemplate`) |
| Columns **1–5** | Sending identity (`SendAccount` → Email MCP `accountKey`) |

Each send picks a **random active cell** (offer × account) under daily caps. Later we can add more dimensions; v1 is 2D.

Admin (`/admin/matrix`) shows volume and replies per cell. Templates are edited at `/admin/templates` (content only, not bound to a mailbox).

## Stack

| Layer | What |
|-------|------|
| Source data | RPO DB `rpo`, schema `rpo2` (readonly on MCP) |
| App DB | `stredan` Postgres — offers, send accounts, leads, touches, agent_runs |
| Agent access | Team MCP: `postgres.mcp.stredan.sk` + `email.mcp.stredan.sk` |
| Operator | Cursor Automations + playbook `AGENT_PLAYBOOK.md` |
| Ops UI | `stredan.sk/admin` (matrix, templates, leads, sent, runs) |
| Site | `stredan.sk` — agency home + `/about` + `/offers/[slug]` |

## Agent-first vs deterministic (cost)

**Decision: Cloud Agent owns the daily loop.** Cheap bulk SQL is a *tool the agent calls*, not a separate productized ETL you maintain.

| Step | Who | Why |
|------|-----|-----|
| Pull candidate IČO batch from RPO | Agent runs SQL via MCP | Free, fast |
| Website / email / DM discover | Agent (browse + heuristics) | Judgment; write `LeadEnrichment` |
| Score fit × offer A–E | Agent | Soft criteria; log rationale |
| Pick cell (offer × account) | Agent, random among active under cap | Experiment |
| Render template | Agent; `scripts/leadgen-apply-drafts.ts` writes `Touch(draft)` | No send until MODE=SEND |
| Send | Agent via Email MCP | Channel comes from `SendAccount`; not enabled yet |
| Reply triage | Agent | Classify intent → lead + suppression |
| Daily eval | Agent writes `AgentRun` + `ExperimentDaily` | You read in admin |

When volume grows past ~200–500 enrichments/day, add cheap deterministic helpers as MCP/SQL tools the agent uses.

## Daily loop

```text
00  AgentRun(kind=daily-batch) start — branch on MODE
ENRICH_ONLY:
  01  SQL: next N companies from RPO
  02  Upsert Company + Lead(status=sourced)
  03  Enrich + score A–D. No Touch. STOP
DRAFT_ONLY:
  01  SQL: sendable leads already in stredan (scripts/leadgen-sendable.sql)
  02  If 0 rows: STOP (do not enrich)
  03  Cap 40. Pick random active cell per lead. Render cold-1
  04  Writer → Touch(draft). Lead queued. STOP (no Email MCP)
SEND (not enabled):
  05  Email MCP send → Touch(sent) + TouchEvent
  06  Triage replies → ExperimentDaily
07  STOP — human reviews /admin in the morning
```

## Logging (source of truth = DB)

Agents **do not** need a custom HTTP API. They insert/update via Postgres MCP:

- `LeadEnrichment.inputJson` / `outputJson` — unique `(leadId, kind)`
- `LeadScore.inputJson` / `outputJson` — unique `(leadId, offerId)`
- `Lead.skipReason` + `status=skipped` when the firm is not sendable
- `AgentRun.inputJson` / `outputJson` + `summary`
- `Touch` + `TouchEvent` for every send/reply
- `ExperimentDaily` keyed by `(day, offerId, sendAccountId)`

## Compliance (non-optional)

- Log `emailSource` + legal notes in enrichment output
- Honor unsubscribe → `Suppression` + stop
- Prefer publicly listed company emails over guessed personal inboxes
- ORSR/RPO data is public; **email discovery is not automatically “ok to spam”**

## Next infra steps (human)

1. Mailboxes 1–5 on https://mcp.stredan.sk (David fills emails)
2. Map each mailbox key into `/admin/accounts` and set active
3. IMAP folders `Leadgen/A`…`E`, `Leadgen/Replies`
4. Schedule Cursor Automation with the **stub** in `docs/leadgen/AUTOMATION_PROMPT.md` (git is the playbook; do not paste the full prompt into the UI).
5. Dry-run 50 firms, no send. Writer: `scripts/leadgen-apply-enrichment.ts`.
6. Draft already-enriched sendable leads (`MODE=DRAFT_ONLY`). Writer: `scripts/leadgen-apply-drafts.ts`. Still no send.

## Non-goals (v1)

- mcp.stredan.sk as an agent dashboard (that is Cursor Automations)
- Pixel-perfect open tracking for Gmail
- Fully autonomous spend without a daily glance
