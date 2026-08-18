# RPO: Register právnických osôb

Slovak public company register (data.gov.sk / RPO). Source dump: `~/Downloads/rpo2.sql.gz` (1.1 GB gzip, ~2 GB SQL, dumped from Postgres 14, file dated 2026-05-06).

## What it actually is

Not a lead list. It is the **full legal-entity register**: s.r.o., a.s., živnostníci, obce, spolky, cirkvi, …

| | Count |
|---|---|
| Rows in dump (`rpo2.organizations`) | 2 254 624 |
| Terminated / dissolved | 1 205 355 |
| Sole traders + other forms | 641 146 |
| **Loaded (active companies)** | **380 508** |

Loaded legal forms (active only):

| Code | Form | Count |
|---|---|---|
| 112 | s.r.o. | 370 589 |
| 121 | a.s. | 5 946 |
| 205 | družstvo | 1 935 |
| 113 | k.s. | 1 216 |
| 111 | v.o.s. | 822 |

Almost all loaded rows are **Obchodný register**. Živnostníci (code 101, source register 2) were dropped. `termination` is empty on every loaded row.

Payload is one JSONB document per entity (`data`): IČO, names (with validFrom/validTo), legal form, addresses, NACE (`statisticalCodes.mainActivity`), statutory bodies (konatelia), activities, source register.

Suborganizations exist in the dump (8 785) but almost none belong to kept parents (1 row loaded). Ignore for outreach.

## Where it lives

Dedicated database **`rpo`** on the same Postgres as Stredan (`stredan-db`, alldevs-hetzner, port 5434). Not mixed into Prisma.

- Tunnel: `ssh -fN alldevs-hetzner` → `localhost:5457`
- DB name: `rpo`, schema: `rpo2`
- Size: ~1.4 GB
- Local MCP: database key `rpo` / env `prod` (readonly). Restart the Postgres MCP after config change.

Cloud Agent: **registered** at [mcp.stredan.sk](https://mcp.stredan.sk) as key `rpo` / env `prod` (**readonly**). Same host as `stredan` (`49.13.94.193:15434`), database name `rpo`. Cursor API key `cursor-cloud` has `databases: *`, so no new key is required.

## Useful JSON paths

| Path | Meaning |
|---|---|
| `data.identifiers[].value` | IČO |
| `data.fullNames[]` | Trade name (`validFrom` / `validTo`) |
| `data.legalForms[0].value.code` | `112` s.r.o., `121` a.s. |
| `data.addresses[0].municipality.value` | City (Bratislava is split by mestská časť) |
| `data.statisticalCodes.mainActivity.code` | NACE-like |
| `data.statutoryBodies` | Konatelia, for personalization hints |
| `data.sourceRegister.value.value` | Obchodný register / … |
| `data.termination` | Absent on loaded rows |

## Query notes

Bratislava is **not** one city string. Use prefix:

```sql
WHERE data->'addresses'->0->'municipality'->>'value' LIKE 'Bratislava%'
```

Indexes on the loaded table:

- PK `id`
- GIN on `data->'identifiers'` (IČO lookup)
- btree: legal code, NACE, city, register, first IČO

Example pull for a daily batch:

```sql
SELECT id,
       data->'identifiers'->0->>'value' AS ico,
       data->'fullNames'->0->>'value' AS name,
       data->'addresses'->0->'municipality'->>'value' AS city,
       data->'statisticalCodes'->'mainActivity'->>'code' AS nace
FROM rpo2.organizations
WHERE data->'legalForms'->0->'value'->>'code' = '112'
  AND data->'statisticalCodes'->'mainActivity'->>'code' LIKE '62%'  -- IT, tune
ORDER BY id
LIMIT 50;
```

Upsert slim rows into `stredan.Company` / `Lead` only for firms you actually queue. Do not copy the whole register into the app DB.

## Re-import

```bash
python3 scripts/rpo-import-filter.py ~/Downloads/rpo2.sql.gz \
  | ssh alldevs-hetzner 'docker exec -i stredan-db psql -U stredan -d rpo'
```

Filter keeps legal forms `112, 121, 113, 111, 205`, skips terminated entities, drops full-document GIN (too heavy for the 4 GB VPS). Then recreate expression indexes from this doc.

## Next

1. Add mailboxes 1–5 on mcp.stredan.sk and map them in `/admin/accounts`
2. Pick NACE allowlist for first ICP
3. Dry-run enrich on 50 firms, no send
