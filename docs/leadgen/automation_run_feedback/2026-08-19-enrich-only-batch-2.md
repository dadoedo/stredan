# Automation run feedback — 2026-08-19 ENRICH_ONLY (batch 2)

**AgentRun ID:** `fa2eb21d-8b38-4edd-bc5d-75c9c175dc80`  
**Automation:** daily cron `0 7 * * *` (triggered 2026-08-19 13:49 UTC)  
**Mode:** `ENRICH_ONLY` — cap 50, no email, no Touch  
**Prior art:** [batch 1 feedback](./2026-08-19-enrich-only-batch-1.md) (same day, earlier cron)

---

## Executive summary

**Enrichment research succeeded in ~1 hour. Postgres persistence took ~5 hours.**

All 50 firms were sourced and fully enriched in JSON (four parallel subagent passes, ~21 emails found in research). Only a fraction was written to Postgres incrementally. The agent then spent most of the run generating SQL files, trying broken executor scripts, and recovering from a **bad status update** that marked 18 leads `enriched` without `LeadEnrichment` rows.

After recovery (per-lead SQL via `CallMcpTool` → Postgres MCP `query`), data is **consistent in admin**: 0 hollow enriched leads. Final counts: **37 enriched / 13 skipped / 18 with email**. Wall time **~360 minutes** vs batch 1’s **~129 minutes** for comparable work.

**Root cause:** not search quality — **the write path** (LLM → SQL string → MCP execute) is fragile, was deferred to end-of-run, and had no typed upsert API.

---

## Timeline (approximate)

| Phase (UTC) | What happened |
|-------------|----------------|
| 13:49 | Cron trigger (batch 2) |
| 13:50 | `AgentRun` inserted (`status=running`) |
| 13:50–14:30 | RPO sourcing (50 IČOs), parallel enrich subagents (batches 0–3 → JSON) |
| 14:30–19:30 | SQL generation (`/workspace/tmp` → 234 artifacts), HTTP/WS MCP executors fail, subagent write retries |
| ~19:00 | **Bad recovery:** `UPDATE Lead SET status='enriched'` on 18 leads **before** enrichment rows exist (“hollow” leads) |
| 19:50 | Hollow leads backfilled via `lead_fix_*.sql` + `CallMcpTool`; `AgentRun` → `succeeded` |
| 20:00+ | [Execute enrichment SQL chunks](https://cursor.com/agents/bc-9b55f42f-29f3-53b1-bfae-c7d51e62219c): Janeček + Baranik status fixes → **37 enriched / 13 skipped** |

---

## Outcomes (verified in prod)

| Metric | Value |
|--------|------:|
| Sourced | 50 |
| Enriched | 37 |
| Skipped | 13 |
| With email (distinct leads) | 18 |
| Hollow enriched (no `LeadEnrichment`) | **0** |
| Sent | 0 |

### Skip reasons (`Lead.notes`)

| Reason | Count |
|--------|------:|
| `no_site` | 9 |
| `no_email` | 4 |

*(13 skipped total; remaining 13 leads are enriched without email.)*

### Row counts vs expected (analytics noise)

| Table | Expected (50 × kinds) | Actual in DB |
|-------|----------------------:|-------------:|
| `LeadEnrichment` | 150 (3 × 50) | ~142 |
| `LeadScore` | 250 (5 × 50) | ~214 |

Partial reruns + missing Prisma unique constraints → duplicate or partial score rows. Lead-level data in admin is usable; analytics aggregates need dedupe or constraints.

---

## Bottlenecks (ranked)

| Rank | Bottleneck | Time impact | Notes |
|------|------------|-------------|-------|
| **1** | **Deferred DB write** | ~5 h | JSON complete early; Postgres flush attempted in bulk at end |
| **2** | **Wrong MCP execution channel** | Hours of retries | `exec_*.mjs` HTTP OIDC → `Unauthorized`; WS port 26054 → timeout. **Only `CallMcpTool` → Postgres MCP `query` works** in cloud VM |
| **3** | **LLM-generated SQL** | High token + error rate | Type errors, mid-chunk splits, `LeadScore_pkey` conflicts on rerun (fixed UUIDs + wrong `ON CONFLICT` target) |
| **4** | **Subagent delegation for writes** | Latency + incomplete runs | Write subagents slower and less reliable than direct `CallMcpTool` |
| **5** | **Bad recovery (status before data)** | Integrity incident | 18 hollow `enriched` leads; extra recovery pass |
| **6** | **No early shutdown / progress** | Operator anxiety | `AgentRun` stayed `running` ~6 h; Cursor session also looked stuck |

**Not a bottleneck:** parallel enrich subagents (~50 firms in JSON in ~1 h). Search/score judgment quality was fine.

---

## What went wrong

### 1. Architecture mismatch: research ≠ persistence

```
RPO source → enrich (JSON in /tmp) → [GAP] → SQL files → MCP execute
```

The automation treated JSON as the deliverable and Postgres as a batch job at the end. There is **no reliable bulk executor** except `CallMcpTool` per chunk.

### 2. Executor sprawl (`/workspace/tmp`)

Evidence of repeated failed write attempts, not productive work:

- **84+** `.sql` files
- **18+** `mcp_call_*.json` payloads
- **26+** `exec_*.mjs` scripts in `services/agent-mcp/`

None of the HTTP/WebSocket paths auth correctly from the cloud agent VM.

### 3. Hollow enriched leads

Recovery SQL ran:

```sql
UPDATE "Lead" SET status = 'enriched' WHERE batchId = '...' AND status = 'sourced'
```

…on 18 leads that still had zero `LeadEnrichment` rows. This turned a write backlog into a **data-integrity** problem.

### 4. Idempotency gaps

- `scripts/leadgen-write-enrichment.py` uses `ON CONFLICT ("leadId", "offerId")` but Prisma schema has **no** `@@unique` on those columns — only indexes.
- Reruns hit **`LeadScore_pkey`** duplicate errors (fixed UUID in INSERT, conflict on wrong key).
- Batch 1 had the same class of problem (421 score rows vs 250 expected).

### 5. Same lessons as batch 1, not applied in time

Batch 1 feedback already flagged SQL pipeline as biggest time sink. Batch 2 repeated the pattern at larger scale (6 h vs 2 h).

---

## What went well

1. **Parallel enrich** — four subagents (13+13+13+11 firms) produced complete JSON quickly.
2. **Enrichment rules** — SAK second pass, IČO collision checks, no invented emails (mostly).
3. **Recovery** — per-lead `lead_fix_*.sql` via `CallMcpTool` closed the hollow-lead gap.
4. **ENRICH_ONLY discipline** — no Touch, no Email MCP send.
5. **`COPY.md` now in repo** — scoring/enrich prompts available (was missing during batch 1).

---

## Recommendations (priority order)

### P0 — Before next cron (prompt + minimal engineering)

1. **Write incrementally** — after each lead (or each subagent batch of ~10): persist via Postgres MCP **before** moving on. JSON is backup, not source of truth.
2. **One write path only** — `CallMcpTool` → `query`. Ban HTTP/WS `exec_*.mjs` from automation prompt.
3. **Never flip status before rows** — order: `LeadEnrichment` → `LeadContact` → `LeadScore` → `UPDATE Lead.status` last.
4. **Wire existing script** — `python3 scripts/leadgen-write-enrichment.py <agentRunId> enrichment.json` → 5 MCP chunks. Pass `RUN_ID` as argv (not inline `NULL`).
5. **Shutdown `AgentRun` immediately** when counts match; update `outputJson.phase` every 10 leads.

### P1 — Schema + idempotency (small PR to app)

6. **Prisma unique constraints:**
   - `LeadEnrichment`: `@@unique([leadId, kind])`
   - `LeadScore`: `@@unique([leadId, offerId])`
   - `LeadContact`: `@@unique([leadId, email])` (where email not null — or partial unique in migration)
7. **Dedupe batch 1 + batch 2** score/enrichment duplicates if analytics matter.

### P2 — Kill SQL generation (recommended proper fix)

8. **New MCP tool: `upsert_lead_enrichment`** on `postgres.mcp.stredan.sk`:
   - Input: JSON payload (enrichments, contacts, scores, lead status, company website)
   - Server: Prisma/pg transaction, validation, upsert, status last
   - Agent calls tool per lead — no SQL strings

### P3 — Observability + pool quality

9. **`AgentRun.outputJson` progress** — `{ phase, enriched_so_far, last_ico, write_errors[] }`.
10. **Operator playbook line** — batch done = `AgentRun.status=succeeded` in admin; Cursor agent may still show RUNNING.
11. **RPO pre-filters** — dissolved, `it_internal`, zero-revenue shells (from batch 1 feedback).

---

## Options considered (trade-offs)

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A. Prompt only** (“write after each lead via CallMcpTool”) | Zero deploy; stops worst mistakes | Agent can still generate bad SQL; doesn’t remove failure mode | **Do** — necessary, not sufficient |
| **B. Prompt + `leadgen-write-enrichment.py`** | Structured JSON→SQL; deterministic UUIDs | Still SQL batch + MCP; schema validation weak | **Do now** — best ROI this week |
| **C. MCP tool `upsert_lead_enrichment`** | Typed JSON in; same auth as today; no app deploy | Requires `agent-mcp` change | **Do next sprint** — proper fix |
| **D. Internal REST on stredan.sk** | Prisma-native; callable outside Cursor | New auth surface; breaks “no HTTP API” doc | **Optional later** if non-agent clients need writes |
| **E. Keep raw SQL MCP `query`** | Flexible; already deployed | Proven 6 h failure mode; high token cost | **Reads only** — cap checks, RPO pulls, verification |
| **F. More subagents for writes** | Parallelism | Added latency; incomplete runs in batch 2 | **Avoid** |

**Recommendation:** **A + B immediately**, **C within one sprint**. Deprecate write use of raw `query` tool once C ships.

---

## Prompt tweak (from `outputJson.tweak`)

> Write enrichment to DB **incrementally per lead** via Postgres MCP `CallMcpTool`. **Never** bulk-`UPDATE Lead.status` before `LeadEnrichment` rows exist. Shutdown `AgentRun` immediately when counts match.

Also retain batch 1 tweak for NACE 6910 SAK second pass before `no_email`.

---

## Subagents / recovery passes

| Task | Outcome |
|------|---------|
| Enrich batch 0–3 (parallel) | 50 firms in JSON; ~21 emails in research |
| SQL chunk executors (HTTP/WS) | Failed — Unauthorized / timeout |
| `lead_fix_0`–`17` via `CallMcpTool` | 17/18 OK; 1 LeadScore PK conflict (enrichment OK) |
| [Execute enrichment SQL chunks](https://cursor.com/agents/bc-9b55f42f-29f3-53b1-bfae-c7d51e62219c) | Janeček + Baranik status → 37 enriched |

---

## Conclusion

Batch 2 confirms batch 1’s diagnosis at higher severity: **enrichment is not the bottleneck; Postgres persistence is.** Prompt changes reduce risk but do not fix the structural gap. The durable fix is a **typed write path** (MCP upsert tool or internal API), plus Prisma unique constraints and incremental writes.

See [README](./README.md) for cross-run consolidated actions.
