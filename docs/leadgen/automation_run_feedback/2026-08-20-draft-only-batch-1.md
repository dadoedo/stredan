# Automation run feedback — 2026-08-20 DRAFT_ONLY (batch 1)

**AgentRun ID:** `run_20260820_712611f2`  
**Automation:** daily cron `0 7 * * *` (triggered 2026-08-20 07:02 UTC)  
**Mode:** `DRAFT_ONLY` — cap 40, no RPO pull, no enrich, no send  

---

## Executive summary

**Batch succeeded.** 30 sendable leads from yesterday's ENRICH_ONLY pool were drafted (`Touch.status=draft`, leads → `queued`). No emails sent. 5 sendable leads remain for the next DRAFT_ONLY run (new pool entries without Touch).

---

## Outcomes

| Metric | Value |
|--------|------:|
| Sendable found | 30 |
| Drafted | 30 |
| Leftover sendable | 5 |
| Sent | 0 |

### Cells (offer × account)

| Cell | Count |
|------|------:|
| A×1 | 2 |
| A×3 | 2 |
| B×2 | 1 |
| B×4 | 2 |
| C×1 | 6 |
| C×2 | 7 |
| C×3 | 5 |
| C×4 | 5 |

Mix skews **Offer C (Shadow AI)** — expected for NACE 6910 law firms from enrich batch 1.

---

## Problems encountered

1. **AgentRun schema** — first INSERT used `createdAt`; Prisma model uses `startedAt`.
2. **Draft validation** — IČO `47232366` failed `--check` because `shortCompany()` removed entire company name after legal suffix strip; fixed to only remove `, s. r. o.`.
3. **MCP SQL chunk size** — combined batch files (~11 KB) were hard to pass through MCP; per-draft SQL (~2 KB) executed reliably.

---

## Prompt / process tweak

> Execute generated draft SQL **per lead** or in chunks of **≤5 drafts** via Postgres MCP. Do not rely on single 30-draft SQL file in one MCP call.

---

## Next run

Run `DRAFT_ONLY` again when ready — 5 sendable leads waiting. Do not switch to ENRICH_ONLY unless sendable pool is empty and David requests sourcing.
