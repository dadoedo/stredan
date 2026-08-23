# Leadgen automation run feedback

Post-mortems from daily cron runs. Use to tune prompts and infra — not to add more agent autonomy.

## Runs

| Date | Mode | AgentRun | Wall time | Outcome | Doc |
|------|------|----------|-----------|---------|-----|
| 2026-08-19 | ENRICH_ONLY batch 1 | `6c267879-c38e-4b05-9f15-1d1c1774959f` | ~129 min | 50 enriched, 21 email | [batch 1](./2026-08-19-enrich-only-batch-1.md) |
| 2026-08-19 | ENRICH_ONLY batch 2 | `fa2eb21d-8b38-4edd-bc5d-75c9c175dc80` | ~6–13 h | 37 enriched, 18 email | [batch 2 post-mortem](./2026-08-19-enrich-only-batch-2-postmortem.md) |
| 2026-08-20 | DRAFT_ONLY | `run_20260820_712611f2` | ~89 min | 30 drafts | [draft batch 1](./2026-08-20-draft-only-batch-1.md) |
| 2026-08-23 | review | — | — | pipeline state + P0 fixes | [pipeline review](./2026-08-23-pipeline-review.md) |

**Batch done** = `AgentRun.status = succeeded` in [stredan.sk/admin](https://stredan.sk/admin). Cursor cloud session may still show RUNNING.

---

## Root cause (batch 1 + 2 + DRAFT_ONLY 20.8.)

**Postgres write path**, not research quality:

1. Deferred bulk SQL at end of run instead of per-lead commits.
2. Raw MCP `query` with multi-KB multi-statement strings (fails/timeouts).
3. `Lead.status` updated before `LeadEnrichment` rows (hollow enriched).
4. Parallel subagents without a single write coordinator.

---

## Fixes shipped (2026-08-23)

| Fix | Where |
|-----|--------|
| MCP `upsert_lead_enrichment` (one lead / one transaction) | `services/agent-mcp` |
| `Lead.status` written **last** in writer | `leadgen-enrichment-sql.ts` |
| `--apply` direct DB writes | `scripts/leadgen-apply-enrichment.ts` |
| Score invariant (email ⇒ must have A–D scores) | same |
| Playbook: write after each lead, ban bulk SQL | `AGENT_PLAYBOOK.md`, `ENRICHMENT_JSON.md` |

**Deploy agent-mcp** after merge for cloud agents to get `upsert_lead_enrichment`.

---

## Still open (P1+)

- Admin filter: hollow enriched (`status=enriched` but &lt;3 enrichment kinds).
- Deterministic `/kontakt` + SAK helpers (speed, not write path).
- Parallel enrich capped at 2×25 with serial writer.
