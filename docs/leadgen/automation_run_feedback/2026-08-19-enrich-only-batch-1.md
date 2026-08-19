# Automation run feedback — 2026-08-19 ENRICH_ONLY (batch 1)

**AgentRun ID:** `6c267879-c38e-4b05-9f15-1d1c1774959f`  
**Cursor cloud agent:** [Lead enrichment scoring](https://cursor.com/agents/bc-ae62464c-0f6a-4251-a1d9-3f6140e18ba9)  
**Automation:** daily cron `0 7 * * *` (triggered 2026-08-19 09:39 UTC)  
**Mode:** `ENRICH_ONLY` — cap 50, no email, no Touch  

---

## Executive summary

The **operational batch succeeded**: 50 firms sourced from RPO, enriched, scored A–D, written to `stredan` prod. No emails sent.

What looked “stuck” was almost certainly the **Cursor cloud agent session** (still `RUNNING` in the agents UI), not the **AgentRun row** in Postgres. Those are two different lifecycles. David did **not** interfere too soon — the DB run finished at **11:49 UTC** (~129 min after start); the cloud session stayed open for follow-up messages and subagent completions.

---

## Two different “runs” (source of confusion)

| Layer | What it tracks | Final state |
|-------|----------------|-------------|
| **`AgentRun` (stredan DB)** | Daily batch job: source → enrich → score → shutdown | `succeeded`, `finishedAt` 2026-08-19 11:49:22 UTC |
| **Cursor cloud agent session** | VM + conversation for this automation invocation | Still `RUNNING` in Cursor UI after batch work completed |

The playbook shutdown step (`UPDATE AgentRun SET status=succeeded`) **did run** and is visible in admin. The cloud agent does not auto-close when that happens — it closes when the agent ends its turn and no further user/automation messages arrive.

**Recommendation:** Treat `AgentRun.status` + `outputJson` in [stredan.sk/admin](https://stredan.sk/admin) as the source of truth for “is the batch done?” — not the Cursor agents list.

---

## Timeline (approximate)

| Phase | What happened |
|-------|----------------|
| 09:39 | Cron trigger |
| 09:40 | `AgentRun` inserted (`status=running`) |
| 09:40–10:30 | RPO sourcing (50 IČOs), partial manual enrich (~12 leads) |
| 10:30–11:30 | Subagent bulk enrich (50 JSON), SQL generation, multiple MCP batch executions |
| 11:30–11:49 | Gap closed (remaining leads → `enriched`), `AgentRun` shutdown |
| 11:49+ | User follow-ups; cloud session remains `RUNNING` |

**Wall time:** ~129 minutes DB run; perceived “3+ hours” likely includes Cursor session still open + cron offset / timezone.

---

## Outcomes (from `outputJson` + verification)

| Metric | Value |
|--------|------:|
| Sourced | 50 |
| Enriched | 50 |
| With email (distinct leads) | 21 |
| Sent | 0 |

### Skip reasons (`Lead.notes`)

| Reason | Count | Notes |
|--------|------:|-------|
| `no_email` | 16 | Mostly accounting shells; registry-only |
| `no_site` | 15 | Often still had email via SAK/aggregator (law firms) |
| `shell` | 1 | SLOVAKIA HOLDING — zrušená 11/2025 |
| `it_internal` | 1 | ADP SK — payroll/vendor entity, not cold ICP |
| `bad_ico` | 0 | — |

### Score averages (all 50 leads, offers A–E)

| Offer | Avg | Max | Interpretation |
|-------|----:|----:|----------------|
| A (Audit) | 29 | 84 | Accounting firms with web+email score high |
| B (Pilot) | 28 | 60 | Weak unless clear repeated workflow |
| C (Shadow AI) | 50 | 88 | **Best cold fit for lawyers** (6910) |
| D (Integration) | 24 | 55 | Secondary unless known stack |
| E (Custom) | 18 | 85 | Correctly low for cold; high only on strong web+email leads |

### Strongest enrichments (site + email)

- **Accounting:** ANS Accounting (`anssk.sk`), Lukáčik & Partners, REMCO, IKOMAT, LIPNOR, REZFIN
- **Law:** Beňová, Fiľo & Partners, ŠKODLER, BAK & Partners, AK H.I.F. (SAK email, no site)

### Correct exclusions / collision handling

- Ortex SK `47908556` ≠ Ortex `44465637` — wrong-entity hits ignored
- MJ audit `46747354` ≠ `mjaudit.sk` (other IČO)
- EY Law — Big4, not cold ICP
- ADP SK — `it_internal`
- Generic names (“Váš účtovník”, Bandie vs bandi.sk) — IČO check before email

---

## What went well

1. **RPO → Company/Lead sourcing** — clean 50 from `outreach_candidates`, no dupes vs existing Company/Suppression.
2. **Enrichment schema** — `LeadEnrichment` (search/people/website), `LeadContact`, `LeadScore` with SK rationale; visible in admin JSON.
3. **Rules mostly held** — no invented emails, konateľ from RPO copied to `people[]`, aggregators not stored as `Company.website`.
4. **Law-firm second pass** — SAK yielded AK H.I.F. email where Finstat alone failed.
5. **ENRICH_ONLY discipline** — no Touch, no Email MCP send.

---

## Problems encountered

### 1. SQL batch pipeline (biggest time sink)

- First generator emitted **Python dict literals** into `LeadScore.score` instead of integers → Postgres rejects.
- Batch files split **mid-statement** → partial execution failures.
- Missing **`ON CONFLICT DO NOTHING`** on reruns → duplicate-key rollbacks.
- **Three subagent rounds** executed overlapping SQL (`sql_batch_*`, `b2_*`, fixed chunks) → **duplicate rows** in DB.

**Evidence:** Expected ~150 enrichments / ~250 scores; actual **264 enrichments / 421 scores / 28 contact rows** (21 distinct leads with email). Data is correct on leads but noisy for analytics.

### 2. Late `AgentRun` shutdown

- Run stayed `status=running` for ~129 minutes while enrichment SQL was retried.
- David had no early “batch complete” signal except polling admin or waiting for chat summary.

### 3. Missing `COPY.md` in repo

- Playbook references `docs/leadgen/COPY.md` (§8 enrich, §9 score); file not in repo. Agent used `OFFERS.md` + playbook only → inconsistent scoring prompts between subagents.

### 4. `/tmp` artifacts not durable

- `enrichment_results.json`, SQL batches lived on VM `/tmp` / `/workspace/tmp` — lost on snapshot rotation; recovery required regeneration.

### 5. UI vs DB status gap

- Cursor agents page shows cloud session `RUNNING` after DB `succeeded` → operator anxiety (“3 hours, broken?”).

---

## Recommended improvements (priority order)

### P0 — Before next cron

1. **Single idempotent writer script** (in repo, not ad-hoc `/tmp`):
   - Read enrichment JSON → emit SQL with integer scores, `ON CONFLICT (id) DO NOTHING`, one statement per line.
   - Run via Postgres MCP in fixed chunks (e.g. 10 leads = ~100 statements), log row counts after each chunk.
2. **Shutdown immediately after counts match** — `UPDATE AgentRun` as soon as `enriched=50` and scores exist; don’t wait for doc/chat.
3. **Add `docs/leadgen/COPY.md`** — enrich/score prompts, voice, skip_reason enum (referenced by playbook but missing).

### P1 — Process / pool quality

4. **RPO pool filter** — pre-exclude dissolved companies (SLOVAKIA HOLDING), `it_internal` patterns (ADP at Bajkalská), zero-revenue shells if Finstat available in RPO metadata.
5. **Law firm enrich SOP** — mandatory order: IČO → SAK → own site `/kontakt` → then `no_email`; never mark `no_email` on 6910 without SAK pass.
6. **Name collision checklist** in enrich prompt — always log `hit.ico` vs `our.ico` in `search` outputJson.

### P2 — Observability

7. **Progress fields on `AgentRun.outputJson`** during run: `{phase, enriched_so_far, last_ico, errors[]}` updated every N leads.
8. **Dedupe constraint or cleanup** — unique `(leadId, kind)` on `LeadEnrichment` and `(leadId, offerId)` on `LeadScore` to prevent rerun duplication; or nightly dedupe job.
9. **Operator doc line in playbook** — “Batch done = `AgentRun.status` succeeded; Cursor agent may still show RUNNING.”

### P3 — Speed (target: 50 enrich in &lt;60 min)

10. **Parallel enrich subagents** — split 50 into 2×25 with non-overlapping IČO lists; single merge + one SQL write pass.
11. **Deterministic helpers** (per COST.md) — MX check, sitemap `/kontakt` fetch as small MCP tools the agent calls before free-form search.
12. **Skip re-enrich** — if lead already has 3 enrichments + 5 scores from partial run, don’t regenerate.

---

## Prompt tweak for next run (from `outputJson.tweak`)

> For NACE **6910** (law): require **second pass** — SAK registry + own-site `/kontakt` — before setting `skip_reason=no_email`. Finstat-only is not sufficient for lawyers.

---

## Subagents used this run

| Task | Outcome |
|------|---------|
| Enrich 50 Slovak leads | JSON for 50 firms; 19 emails found in research |
| Enrich 38 remaining leads | Filled gap after partial first pass |
| Run 39 SQL batches | Fixed score types; closed enriched count to 50 |
| Execute SQL batches (b2_*) | 37 files, no errors; final 50 enriched |

---

## Conclusion

**Batch 1 was a successful dry run** for enrich+score pipeline quality, not for operator latency. The data in admin is usable for David’s inspection. The main fixes are **engineering** (one SQL writer, idempotent writes, early shutdown signal) and **documentation** (`COPY.md`, run-status clarification) — not more agent autonomy.

Next run should reuse lessons from this file and delete duplicate `LeadScore`/`LeadEnrichment` rows for this batch if analytics noise matters.
