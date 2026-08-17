# RPO data handoff

## File found

- Path: `/home/david/Downloads/rpo2.sql.gz` (~1.1 GB)
- Format: PostgreSQL dump, schema `rpo2`
- Tables: `rpo2.organizations`, `rpo2.suborganizations`
- Payload: `data jsonb` per organization (names, IČO, addresses, activities, legal forms, statutory bodies, NACE/statisticalCodes, termination, …)

## Useful JSON paths (from sample rows)

| Path | Meaning |
|------|---------|
| `data.identifiers[].value` | IČO |
| `data.fullNames[].value` | Trade name (check validFrom/validTo) |
| `data.legalForms[].value.code` | Legal form code (e.g. 112 ≈ s.r.o. — verify against codelist) |
| `data.addresses[].municipality.value` | City |
| `data.statisticalCodes.mainActivity.code` | NACE-like code |
| `data.termination` | If set → inactive |
| `data.sourceRegister.value.value` | Obchodný / živnostenský register |
| `data.statutoryBodies` | Konatelia / names for personalization hints |

## Recommended load

1. Dedicated DB `rpo` (or schema on side DB), **not** mixed into Prisma app migrations.
2. `gunzip -c rpo2.sql.gz | psql $RPO_URL`
3. Indexes on JSON expressions used in filters (IČO, legal form, termination, NACE).
4. Register DB in MCP as readonly for agents initially.
5. Agent upserts slim rows into `stredan.Company` / `Lead` only for contacted/queued firms.

## Next session with David

- Confirm legal form codes for s.r.o. / a.s.
- Pick NACE allowlist for first ICP
- Sample 50 companies manually with agent enrich dry-run (no send)
