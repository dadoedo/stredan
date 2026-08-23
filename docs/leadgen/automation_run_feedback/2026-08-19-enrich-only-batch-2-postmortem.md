# Post-mortem — ENRICH_ONLY batch 2 (stopped after ~13 h)

**AgentRun ID:** `fa2eb21d-8b38-4edd-bc5d-75c9c175dc80`  
**Automation:** daily cron `0 7 * * *`  
**Mode:** `ENRICH_ONLY` — cap 50, no Touch, no send  
**Operator action:** David stopped the Cursor cloud agent after ~13 hours  
**Related:** [batch 1 feedback](./2026-08-19-enrich-only-batch-1.md) (same failure modes, worse on batch 2)

---

## Executive summary

Batch 2 **eventually wrote usable data** to `stredan` prod, but operator wall time was unacceptable (~13 h until manual stop). The dominant cost was **not web research** — it was **getting enrichment rows into Postgres via MCP**.

David’s intuition is correct: **DB write path is the bottleneck.** The agent pattern today is:

1. Research 41–50 leads in parallel (slow but bounded).
2. Merge one giant JSON file (~3.7k lines).
3. Generate one giant SQL file (~3.8k lines, ~290 KB).
4. Retry MCP execution when multi‑statement batches fail/time out.
5. Leave `Lead.status=enriched` rows in admin **before** `LeadEnrichment` / `LeadScore` rows exist (“hollow enriched”).

That last step makes the run *look* done in admin while the agent is still fighting SQL for hours.

**Batch done signal:** `AgentRun.status` + row counts in admin — **not** the Cursor agents list (session can stay `RUNNING` long after DB work).

---

## Two clocks (again)

| Layer | Batch 2 |
|-------|---------|
| **`AgentRun` (Postgres)** | `startedAt` 2026-08-19 13:50 UTC → `finishedAt` 19:50 UTC (**~6 h**) |
| **Cursor cloud session** | Still active when David stopped (**~13 h** perceived) |

The six-hour DB run already included multiple partial-write / recovery cycles. The cloud session continued with subagents, SQL splits, and retries after `AgentRun` was marked `succeeded`.

---

## Timeline (reconstructed)

| Time (UTC) | Event |
|------------|-------|
| 13:50 | Batch 2 `AgentRun` inserted; 50 IČOs sourced from RPO |
| 13:50–~17:00 | Partial enrich: 9 leads fully enriched, **41 still `sourced`** |
| ~17:00 | Wrong artifact: `tmp/enrichment_batch2.json` contained **batch 1 IČOs**, not batch 2 remaining — recovery required |
| 17:39 | Cron re-triggered; agent resumed same `AgentRun` (41 remaining) |
| 17:39–19:50 | Four parallel enrich subagents + merge; SQL generated; MCP apply attempts |
| 19:50 | `AgentRun` updated `status=succeeded` (`enriched: 37`, `with_email: 18` in `outputJson`) |
| 19:50–~06:39+ | Cloud session still `RUNNING`: SQL chunk retries, hollow-lead recovery, user **stop** |

---

## Final data state (verified 2026-08-23)

| Metric | Value |
|--------|------:|
| Leads in batch | 50 |
| `LeadEnrichment` search rows | 48 |
| `LeadEnrichment` people / website | 47 / 47 |
| `LeadContact` with email | 19 |
| `LeadScore` rows | 214 (~4.3 offers × 50) |
| **Hollow** (status enriched/skipped/queued but &lt;3 enrich kinds) | **3** |

### Lead status breakdown

| status | skipReason | count |
|--------|------------|------:|
| queued | — | 17 |
| enriched | — | 16 |
| skipped | no_site | 10 |
| skipped | no_email | 3 |
| enriched | no_email | 2 |
| enriched | no_site | 2 |

The two `enriched` rows with non-null `skipReason` and three hollow rows are symptoms of **status updated before enrichment SQL landed**.

---

## Root cause: DB write architecture

### 1. Bulk-at-end instead of per-lead commits

Playbook says: enrich ~10 leads → `leadgen-apply-enrichment.ts` → MCP chunk → repeat.

In practice the agent:

- Accumulates **all 41** leads into one JSON.
- Emits **one SQL file** with ~659 statements (~290 KB).
- Attempts to push **35–72 KB chunks** through Postgres MCP in a single `query` call.

Each lead generates ~16 statements (Company, Lead, 3× LeadEnrichment, 0–1 LeadContact, 4× LeadScore). At 41 leads that is **~650 round-trips worth of work** packaged into a few giant strings.

### 2. MCP Postgres is a poor bulk loader

Observed behaviour (batch 1, batch 2, and **DRAFT_ONLY 2026-08-20** — same pattern):

| Batch size | Result |
|------------|--------|
| ~290 KB / 659 stmts (41 leads) | Not reliably applied in one call |
| ~68 KB / 156 stmts (10 leads) | Failures / timeouts |
| ~35 KB / ~80 stmts (5 leads) | Still fragile |
| ~7 KB / 15 stmts (1 lead) | **Works** |

**DRAFT_ONLY 2026-08-20** (`run_20260820_712611f2`): 30 drafts took **~89 min** because ~11 KB multi-draft MCP batches failed; **per-draft ~2 KB SQL succeeded**. Same root cause.

`outputJson.top_failures` on batch 2 explicitly lists:

- *“DB write backlog: 18 leads marked enriched before enrichment rows written”*
- *“HTTP/WS MCP executors fail (Unauthorized/timeout) — use CallMcpTool directly”*

### 3. Hollow enriched rows

When `UPDATE "Lead" SET status='enriched'` runs (or is applied out of order) before `LeadEnrichment` inserts:

- Admin shows green **enriched** leads with empty JSON panels.
- Agent thinks progress is done; operator sees broken records.
- Recovery requires re-running enrichment SQL or manual cleanup.

Batch 2 `outputJson.tweak` already captured the fix:

> Write enrichment to DB **incrementally per lead** via Postgres MCP; **never** bulk-update `Lead.status` before `LeadEnrichment` rows exist.

### 4. Parallel subagents without a single write coordinator

Batch 2 launched **4 enrich subagents** (11+11+11+8 leads) plus a merge agent. Good for research latency; bad for writes:

- Overlapping JSON merges
- Duplicate SQL generation (`enrichment_batch_*`, `mcp_batch_*`, `sql_chunk_*`)
- No single queue serializing MCP applies
- Wrong batch file (`enrichment_batch2.json` = batch 1 IČOs) wasted a recovery cycle

### 5. Session lifecycle ≠ job lifecycle

Same as batch 1: `AgentRun.status=succeeded` does not close the Cursor VM. Subagents, SQL retries, and chat turns keep the session alive → **13 h “still running”** while operator waits.

---

## What was *not* the main cost

| Factor | Impact |
|--------|--------|
| RPO sourcing (50 IČOs) | Minutes |
| Web search per lead (IČO, SAK pass for 6910) | Tens of minutes with parallel subagents |
| Scoring A–D in JSON | Cheap (in-memory) |
| **`leadgen-apply-enrichment.ts --check`** | Seconds |
| **MCP SQL apply for 41 leads** | **Hours** (retries, splits, hollow recovery) |

Research quality was acceptable (19 emails, SAK passes on law firms). **Latency was an integration problem.**

---

## Comparison to batch 1

| | Batch 1 | Batch 2 |
|---|---------|---------|
| Wall time (DB) | ~129 min | ~360 min |
| Operator stop | No (session lingered) | **Yes (~13 h)** |
| Sourced → enriched gap | Closed in one session | **41 leads stuck `sourced` for hours** |
| Hollow enriched | Some duplicate rows | **18 leads** per `outputJson` |
| SQL writer | Ad-hoc fixes | Repo script exists but **apply path still manual MCP** |
| Subagent rounds | 3+ overlapping | 4 parallel + merge + resume |

Batch 2 did not introduce a new failure mode — it **amplified** batch 1’s SQL/MCP bottleneck on a **partially written** run.

---

## Recommended fixes (priority)

### P0 — Stop the bleeding (before next ENRICH_ONLY)

1. **One lead = one MCP call** (or one transaction ≤5 KB): generate SQL with `--chunk 1` and apply immediately after each lead (or each pair). Target: ≤15 statements / ≤8 KB per MCP `query`.
2. **Never set `Lead.status=enriched` in a separate step** — only via `leadgen-apply-enrichment.ts` statement order (Lead update after enrichments in same batch). Add playbook hard rule.
3. **Progress gate on row counts**, not status: after each MCP chunk, `SELECT COUNT(*) FROM "LeadEnrichment" WHERE "agentRunId"=…` — do not advance `enriched_so_far` until search+people+website exist for that IČO.
4. **Single write coordinator** — parallel subagents may research, but **one serial MCP applier** (no concurrent SQL files).
5. **Resume logic** — if `Lead` has 3 enrichments + 4 scores, skip re-research; if `sourced` with 0 enrichments, continue. Do not re-source from RPO.

### P1 — Engineering (remove agent from the hot path)

6. **`scripts/leadgen-apply-enrichment.ts --apply-via-mcp`** (or small Node script using same DB URL MCP uses): loop statements locally instead of giant MCP strings. Agent produces JSON only; script writes DB. *This is the real fix.*
7. **Idempotent chunk manifest** — `tmp/enrichment-<runId>.manifest.json` listing `{ico, appliedAt, statements}` so reruns skip applied leads.
8. **Admin “hollow enriched” detector** — filter `status=enriched AND NOT EXISTS (3 enrich kinds)` for operator sanity.

### P2 — Observability

9. **`AgentRun.outputJson` every chunk:** `{phase, enriched_so_far, last_ico, mcp_bytes, mcp_errors[]}`.
10. **Playbook line (bold):** “Batch done = `AgentRun.status` succeeded **and** hollow count = 0; Cursor RUNNING is irrelevant.”

### P3 — Research speed (secondary)

11. Deterministic `/kontakt` fetch + SAK lookup helpers (see `COST.md`).
12. Cap parallel enrich subagents at 2×25 with frozen IČO lists — only if P0/P1 are done.

---

## Prompt / process tweak

From batch 2 `outputJson.tweak` (keep):

> Write enrichment to DB incrementally per lead via Postgres MCP `CallDynamicTool`; never bulk-update `Lead.status` before `LeadEnrichment` rows exist. Shutdown `AgentRun` immediately when counts match.

Add:

> After generating SQL, **do not** attempt chunks &gt;8 KB. If an MCP query fails, halve chunk size before retrying. Log `last_ico` on every failure.

---

## Conclusion

Batch 2 data is **mostly usable** (48/50 searched, 19 emails, scores present), but the run was **operationally failed** on latency. David was right to stop it.

**Primary cause:** treating Postgres MCP as a bulk SQL pipe for hundreds of multi-line statements.  
**Secondary causes:** parallel subagents without write coordination, hollow status updates, conflating Cursor session time with batch completion.

Until writes move to a **local script or ≤8 KB per-lead MCP calls**, expect **multi-hour** runs regardless of research parallelism. Batch 1 post-mortem P0 items remain open; batch 2 proves they are blocking production cron.

---

## Appendix — artifact sizes (batch 2 resume, 41 leads)

| File | Size | Notes |
|------|-----:|-------|
| `enrichment-fa2eb21d-….json` | ~120 KB | 41 leads merged |
| `enrichment-fa2eb21d.sql` | ~290 KB | 659 statements |
| `sql_chunk_*.sql` (×5) | 7–72 KB | 10-lead splits — too large |
| `mcp_batch_*.sql` (×9) | 7–37 KB | 5-lead splits — better |
| Single-lead test (`47998334`) | ~7 KB | **Applied successfully** |
