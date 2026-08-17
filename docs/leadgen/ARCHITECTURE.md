# AI SME Leadgen — Architecture

Operator: Cursor Cloud Agent (daily). Human: evaluate + tweak offers/templates/ICP.

## Goal

High-volume outbound to Slovak SMEs testing **5 offers (A–E)** in parallel, with every judgment step logged in Postgres (`inputJson` / `outputJson`).

## Stack (already mostly exists)

| Layer | What |
|-------|------|
| Source data | `~/Downloads/rpo2.sql.gz` → Register právnických osôb (schema `rpo2.organizations`, JSONB) |
| App DB | `stredan` Postgres — offers, leads, touches, agent_runs |
| Agent access | Team MCP: `postgres.mcp.stredan.sk` + `email.mcp.stredan.sk` |
| Outreach | Email MCP accounts: Gmail (personal), Resend (SMTP/API), optional SMTP |
| Site | `stredan.sk` — agency home + `/about` + `/offers/[slug]` |

## Agent-first vs deterministic (cost)

**Decision: Cloud Agent owns the daily loop.** Cheap bulk SQL is a *tool the agent calls*, not a separate productized ETL you maintain.

| Step | Who | Why |
|------|-----|-----|
| Pull candidate IČO batch from RPO | Agent runs SQL via MCP | Free, fast, 1.1G dump is not something to “LLM” |
| Website / email / DM discover | Agent (browse + heuristics) | Judgment; coding every scraper is costlier to build/maintain |
| Score fit × offer A–E | Agent | Soft criteria; log rationale |
| Pick template + personalize | Agent | Locked templates, free vars only |
| Send | Agent via Email MCP | Channels: `gmail` / `resend` / `smtp` |
| Reply triage | Agent | Classify intent → update lead + suppression |
| Daily eval summary | Agent writes `AgentRun` + `ExperimentDaily` | You read in morning |

**Cost intuition (order of magnitude):**

- SQL select 500 s.r.o. from RPO: ~$0
- Agent enrich+score+draft 50 leads/day: Cursor agent minutes (dominated by browsing), not Clay/Apollo seats
- Building + hosting a full deterministic enrich stack (Hunter, scrapers, queues): higher fixed cost unless volume >> thousands/day

When volume grows past ~200–500 enrichments/day, add cheap deterministic helpers (MX check, `info@` pattern, sitemap fetch) **as MCP/SQL tools the agent uses** — still agent-orchestrated.

## Daily loop

```text
00  AgentRun(kind=daily-batch) start
01  SQL: next N companies from RPO filters (active s.r.o., NACE allowlist, city, not suppressed)
02  Upsert Company + Lead(status=sourced)
03  For each lead (cap N):
      enrich → LeadEnrichment rows
      score per active offers → LeadScore
      assign offer (experiment allocation)
      render template → Touch(status=queued|sent)
04  Send via Email MCP (respect channel caps / warmup)
05  Triage new replies in offer folders
06  Roll ExperimentDaily + AgentRun summary
07  STOP — human reviews dashboard / SQL in morning
```

## Experiment allocation

Round-robin or weighted by current interested-rate:

- Start: equal weight A–E
- After ≥30 replies total: upweight winners, keep 10–20% exploration on losers

Always store `offerId` + `templateId` + `channel` on every `Touch`.

## Compliance (non-optional)

- Log `emailSource` + legal notes in enrichment output
- Honor unsubscribe → `Suppression` + stop
- Prefer publicly listed company emails / website contact forms over guessed personal inboxes when unsure
- ORSR/RPO data is public; **email discovery is not automatically “ok to spam”** — keep volume + relevance disciplined

## Next infra steps (human)

1. Import `rpo2.sql.gz` into a Postgres reachable by MCP (dedicated DB recommended, not marketing app tables)
2. Register that DB + Resend mailbox in https://mcp.stredan.sk
3. Create IMAP folders per offer/channel (e.g. `Leadgen/A-Audit`, `Leadgen/Replies`)
4. Schedule Cloud Agent daily with playbook: `docs/leadgen/AGENT_PLAYBOOK.md`
5. `prisma db push` + `npm run seed:leadgen`

## Non-goals (v1)

- Full custom CRM product in this repo
- Pixel-perfect open tracking for Gmail (Resend webhooks later)
- Fully autonomous spend without daily human glance
