# Leadgen automation run feedback

Post-mortems from daily cron ENRICH_ONLY runs. Use these to tune prompts, infra, and schema — not to add more agent autonomy.

## Runs

| Date | Batch | AgentRun | Wall time | Enriched | With email | Doc |
|------|-------|----------|-----------|----------|------------|-----|
| 2026-08-19 | 1 | `6c267879-c38e-4b05-9f15-1d1c1774959f` | ~129 min | 50 | 21 | [batch 1](./2026-08-19-enrich-only-batch-1.md) |
| 2026-08-19 | 2 | `fa2eb21d-8b38-4edd-bc5d-75c9c175dc80` | ~360 min | 37 | 18 | [batch 2](./2026-08-19-enrich-only-batch-2.md) |

**Operator signal:** batch done = `AgentRun.status = succeeded` in [stredan.sk/admin](https://stredan.sk/admin). Cursor cloud agent session may still show RUNNING.

---

## Consolidated bottlenecks (both runs)

1. **Deferred DB write** — enrich all → JSON first, flush Postgres later.
2. **LLM-generated SQL** — type errors, partial chunks, duplicate rows on rerun.
3. **No typed upsert API** — only raw Postgres MCP `query` for writes today.
4. **Broken executor scripts** — HTTP OIDC / WS MCP fail in cloud VM; `CallMcpTool` only.
5. **Late or missing `AgentRun` shutdown** — no progress fields during run.

Enrichment/search quality and parallel subagents were **not** the bottleneck.

---

## Consolidated recommendations

### Do before next cron

| # | Action | Owner |
|---|--------|-------|
| 1 | Prompt: write after each lead (or 10-lead chunk) via `CallMcpTool`; never status-before-rows | `AUTOMATION_PROMPT.md` |
| 2 | Wire `scripts/leadgen-write-enrichment.py <runId> *.json` → 5 MCP chunks | Playbook + automation |
| 3 | Ban `exec_*.mjs` HTTP/WS paths from automation instructions | Prompt |
| 4 | Shutdown `AgentRun` + `outputJson` progress every 10 leads | Prompt |

### Do in app / agent-mcp (next sprint)

| # | Action | Owner |
|---|--------|-------|
| 5 | Prisma `@@unique` on `(leadId, kind)`, `(leadId, offerId)`, `(leadId, email)` | `schema.prisma` |
| 6 | MCP tool `upsert_lead_enrichment` (JSON → transaction) | `services/agent-mcp` |
| 7 | Optional: `POST /api/internal/leads/enrich` if non-Cursor clients need writes | `stredan` app |

### Process / pool (P1)

- SAK mandatory second pass for NACE 6910 before `no_email`.
- RPO pre-filter: dissolved, `it_internal`, obvious shells.
- IČO collision logging in `search` outputJson.

---

## Write-path options (summary)

| Option | When |
|--------|------|
| Prompt + incremental `CallMcpTool` | This week — stop bleeding |
| `leadgen-write-enrichment.py` | This week — structured SQL |
| MCP `upsert_lead_enrichment` | **Recommended proper fix** |
| Internal REST API | If agents aren’t the only writer |

Raw SQL MCP `query` should remain for **reads** (RPO, caps, verification), not bulk lead writes.
