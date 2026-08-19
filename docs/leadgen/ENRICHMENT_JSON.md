# Enrichment JSON → SQL

The daily agent **must not** hand-write `INSERT` for scores/enrichments. Research into JSON, then:

```bash
npx tsx scripts/leadgen-apply-enrichment.ts tmp/enrichment-<AgentRunId>.json \
  --run-id <AgentRunId> \
  --out tmp/enrichment-<AgentRunId>.sql

# optional type check only
npx tsx scripts/leadgen-apply-enrichment.ts tmp/enrichment-<AgentRunId>.json --check
```

Execute the `.sql` via Postgres MCP (`stredan` / `prod`) in the printed `MCP CHUNK` blocks (~10 leads). Statements are idempotent (`ON CONFLICT DO UPDATE`).

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

## Rules the script enforces

| Field | Rule |
|-------|------|
| `ico` | 8 digits |
| `skip_reason` | `no_site` \| `no_email` \| `shell` \| `it_internal` \| `bad_ico` \| `null` |
| `search.hits[].type` | `aggregator` \| `own_site` \| `social` \| `registry` \| `other` |
| `scores.A–D.score` | **JSON integer** 0–100 (not a Python dict, not `"78"`) |
| Offer E | omitted in ENRICH_ONLY |

`leadId` / `companyId` default to `ldry_<ico>` / `cmp_<ico>` if omitted.

`skip_reason` set → SQL sets `Lead.status=skipped` and `Lead.skipReason`. Otherwise `enriched`.
