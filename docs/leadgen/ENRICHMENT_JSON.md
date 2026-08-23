# Enrichment JSON → DB write

Research into JSON. **Write one lead at a time** — never bulk SQL at end of run (see [batch 2 post-mortem](./automation_run_feedback/2026-08-19-enrich-only-batch-2-postmortem.md)).

## Primary path (cloud agent): Postgres MCP `upsert_lead_enrichment`

After each lead (or each ~10-lead research mini-batch), call **one** MCP tool per lead:

```json
{
  "database": "stredan",
  "environment": "prod",
  "agentRunId": "<AgentRunId>",
  "lead": { "ico": "45389551", "name": "...", "search": { ... }, "scores": { ... } }
}
```

The server runs a single transaction: `LeadEnrichment` → `LeadContact` → `LeadScore` → **`Lead.status` last**. Idempotent upserts. No SQL strings from the agent.

**Do not** use raw `query` for enrichment writes. `query` is for reads (RPO, caps, verification).

Ban from automation: `exec_*.mjs`, HTTP/WS MCP executors, bulk `UPDATE Lead SET status` before rows exist.

## Local / CI fallback: `--apply`

When `DATABASE_URL` or `LEADGEN_DATABASE_URL` is available on the VM:

```bash
npx tsx scripts/leadgen-apply-enrichment.ts tmp/enrichment-<AgentRunId>.json \
  --run-id <AgentRunId> \
  --apply
```

One transaction per lead (`--chunk` defaults to 1 with `--apply`).

## Legacy fallback (avoid): SQL file + MCP `query`

Only if `upsert_lead_enrichment` is unavailable. **One statement per `query` call** (≤8 KB). Never multi-lead chunks.

```bash
npx tsx scripts/leadgen-apply-enrichment.ts tmp/enrichment-<AgentRunId>.json \
  --run-id <AgentRunId> \
  --chunk 1 \
  --out tmp/enrichment-<AgentRunId>.sql
```

Execute **one SQL statement at a time** via Postgres MCP `query`.

Type check only:

```bash
npx tsx scripts/leadgen-apply-enrichment.ts tmp/enrichment-<AgentRunId>.json --check
```

Scores-only backfill:

```bash
npx tsx scripts/leadgen-apply-enrichment.ts tmp/scores.json --scores-only --apply
```

## Array of leads

```json
[
  {
    "ico": "45389551",
    "leadId": "ldry_45389551",
    "companyId": "cmp_45389551",
    "name": "ANS Accounting, s. r. o.",
    "city": "Bratislava",
    "nace": "6920",
    "konatel": "Ing. Milan Šaran",
    "notes": "Účtovníctvo; web anssk.sk",
    "skip_reason": null,
    "website": "https://www.anssk.sk",
    "search": {
      "queries": ["45389551", "ANS Accounting Bratislava"],
      "hits": [
        {
          "url": "https://www.anssk.sk",
          "type": "own_site",
          "title": "ANS SK",
          "snippet": "účtovníctvo Bratislava",
          "hitIco": "45389551",
          "icoMatch": true
        }
      ]
    },
    "people": [
      { "fullName": "Ing. Milan Šaran", "firstName": "Milan", "role": "konatel", "source": "rpo" }
    ],
    "website_enrichment": {
      "website": "https://www.anssk.sk",
      "emails": [{ "email": "bratislava@anssk.sk", "url": "https://www.anssk.sk", "context": "kontakt" }],
      "skip_reason": null,
      "sakChecked": false,
      "evucChecked": false
    },
    "contacts": [
      {
        "fullName": "Ing. Milan Šaran",
        "role": "konateľ",
        "email": "bratislava@anssk.sk",
        "emailSource": "own_site",
        "isPrimary": true,
        "confidence": 0.92
      }
    ],
    "scores": {
      "A": { "score": 78, "send": true, "why_sk": "Účtovná firma, citlivé doklady.", "hook_id": "69-ucto", "risks": [] },
      "B": { "score": 48, "send": false, "why_sk": "Nie je jasný jeden opakovaný workflow." },
      "C": { "score": 70, "send": true, "why_sk": "Účto — ľudia skúšajú verejné AI na dokladoch.", "hook_id": "69-ucto" },
      "D": { "score": 40, "send": false, "why_sk": "Stack neznámy." }
    }
  }
]
```

## Rules the writer enforces

| Field | Rule |
|-------|------|
| `ico` | 8 digits |
| `skip_reason` | `no_site` \| `no_email` \| `shell` \| `it_internal` \| `bad_ico` \| `null` |
| `search.hits[].type` | `aggregator` \| `own_site` \| `social` \| `registry` \| `other` |
| `scores.A–D.score` | **JSON integer** 0–100 (not a Python dict, not `"78"`) |
| Offer E | omitted in ENRICH_ONLY |
| enriched + email | must have ≥1 score A–D, or set `skip_reason` |

`leadId` / `companyId` default to `ldry_<ico>` / `cmp_<ico>` if omitted.

`skip_reason` set → `Lead.status=skipped` and `Lead.skipReason`. Otherwise `enriched`. Status is written **after** enrichment rows.
