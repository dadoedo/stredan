# Draft JSON → SQL

`MODE=DRAFT_ONLY` writes `Touch.status=draft`. It does **not** send. It does **not** enrich new firms.

```bash
npx tsx scripts/leadgen-apply-drafts.ts tmp/drafts-<AgentRunId>.json --check
npx tsx scripts/leadgen-apply-drafts.ts tmp/drafts-<AgentRunId>.json --out tmp/drafts-<AgentRunId>.sql
```

Execute the `.sql` via Postgres MCP (`stredan` / `prod`). One cold Touch per lead (`NOT EXISTS` any Touch). Reruns skip leads that already have a Touch.

## Array of drafts

```json
[
  {
    "ico": "45389551",
    "email": "bratislava@anssk.sk",
    "offerCode": "C",
    "accountCode": "1",
    "templateKey": "cold-1",
    "subject": "Firemné AI, nie súkromné účty",
    "bodyText": "Dobrý deň, Milan,\n\nľudia už verejné AI používajú. ...\n",
    "personalization": {
      "salutation": "Dobrý deň, Milan,",
      "company": "ANS Accounting",
      "hook": "Vo vašom odbore to zvyčajne začína pri faktúrach, DPH a pretáčaní dokladov z mailu do Pohody.",
      "landing": "https://stredan.sk/offers/shadow-ai",
      "firstName": "Milan"
    }
  }
]
```

## Who gets drafted

Query: `scripts/leadgen-sendable.sql`. Already in `stredan`, not a new RPO pull:

- `LeadContact.email` present
- `Lead.skipReason` IS NULL
- status not in (`suppressed`, `won`, `lost`, `skipped`, `contacted`)
- no existing `Touch`
- not in `Suppression`
- at least one offer A–D with `LeadScore` `send=true` **or** `score >= 50`

Cap: **40** drafts this run (same number as the send cap). Leftovers stay for the next DRAFT_ONLY run.

If the sendable query returns **0 rows**, the agent stops. It does **not** enrich a new batch.

## Cell pick

Random active offer among that lead's sendable A–D × random active `SendAccount` with `mcpAccountKey`, still under `dailyCap` (today's `draft` + `sent` Touches). Offer E is not cold.

## Writer checks

`--check` rejects leftover `{{tokens}}`, ChatGPT/Claude/Gemini, em dash, missing landing URL, salutation that is not `Dobrý deň…`, offer E, duplicate IČO.
