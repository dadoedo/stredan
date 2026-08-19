-- One-shot hardening for stredan leadgen tables.
-- Safe to re-run. Deploy does not prisma db push; apply on prod via Postgres MCP.
-- After this: unique (Lead.companyId), (LeadEnrichment.leadId, kind),
-- (LeadScore.leadId, offerId), (LeadContact.leadId, email).

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "skipReason" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_skipReason_idx" ON "Lead" ("skipReason");

UPDATE "Lead"
SET "skipReason" = lower(substring(notes FROM 'skip_reason=([a-z_]+)'))
WHERE "skipReason" IS NULL
  AND notes ~ 'skip_reason=[a-z_]+';

UPDATE "LeadContact" SET email = NULL WHERE email = '';

-- Collapse extra Lead rows per company before unique (companyId).
-- Keep the furthest pipeline status, then newest. Re-point children first
-- so touches/enrichments/scores are not lost to ON DELETE CASCADE.
-- Real table (not TEMP) so statement-at-a-time MCP sessions still see it.
DROP TABLE IF EXISTS _leadgen_lead_keep;
CREATE TABLE _leadgen_lead_keep AS
SELECT DISTINCT ON ("companyId") id AS keep_id, "companyId"
FROM "Lead"
ORDER BY "companyId",
  CASE status
    WHEN 'won' THEN 10
    WHEN 'meeting' THEN 9
    WHEN 'replied' THEN 8
    WHEN 'contacted' THEN 7
    WHEN 'queued' THEN 6
    WHEN 'scored' THEN 5
    WHEN 'enriched' THEN 4
    WHEN 'skipped' THEN 3
    WHEN 'enriching' THEN 2
    WHEN 'sourced' THEN 1
    ELSE 0
  END DESC,
  "updatedAt" DESC,
  id DESC;

UPDATE "LeadEnrichment" e SET "leadId" = k.keep_id
FROM "Lead" l JOIN _leadgen_lead_keep k ON k."companyId" = l."companyId"
WHERE e."leadId" = l.id AND e."leadId" <> k.keep_id;

UPDATE "LeadScore" s SET "leadId" = k.keep_id
FROM "Lead" l JOIN _leadgen_lead_keep k ON k."companyId" = l."companyId"
WHERE s."leadId" = l.id AND s."leadId" <> k.keep_id;

UPDATE "LeadContact" c SET "leadId" = k.keep_id
FROM "Lead" l JOIN _leadgen_lead_keep k ON k."companyId" = l."companyId"
WHERE c."leadId" = l.id AND c."leadId" <> k.keep_id;

UPDATE "Touch" t SET "leadId" = k.keep_id
FROM "Lead" l JOIN _leadgen_lead_keep k ON k."companyId" = l."companyId"
WHERE t."leadId" = l.id AND t."leadId" <> k.keep_id;

DELETE FROM "Lead" l
WHERE l.id NOT IN (SELECT keep_id FROM _leadgen_lead_keep);

DROP TABLE IF EXISTS _leadgen_lead_keep;

DELETE FROM "LeadEnrichment" a
WHERE a.id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON ("leadId", kind) id
    FROM "LeadEnrichment"
    ORDER BY "leadId", kind, "createdAt" DESC, id DESC
  ) kept
);

DELETE FROM "LeadScore" a
WHERE a.id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON ("leadId", "offerId") id
    FROM "LeadScore"
    ORDER BY "leadId", "offerId", "createdAt" DESC, id DESC
  ) kept
);

DELETE FROM "LeadContact" a
WHERE a.email IS NOT NULL
  AND a.id NOT IN (
    SELECT id FROM (
      SELECT DISTINCT ON ("leadId", email) id
      FROM "LeadContact"
      WHERE email IS NOT NULL
      ORDER BY "leadId", email, "isPrimary" DESC, "createdAt" DESC, id DESC
    ) kept
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Lead_companyId_key'
  ) THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_key" UNIQUE ("companyId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LeadEnrichment_leadId_kind_key'
  ) THEN
    ALTER TABLE "LeadEnrichment" ADD CONSTRAINT "LeadEnrichment_leadId_kind_key" UNIQUE ("leadId", kind);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LeadScore_leadId_offerId_key'
  ) THEN
    ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_leadId_offerId_key" UNIQUE ("leadId", "offerId");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LeadContact_leadId_email_key'
  ) THEN
    ALTER TABLE "LeadContact" ADD CONSTRAINT "LeadContact_leadId_email_key" UNIQUE ("leadId", email);
  END IF;
END $$;

DROP INDEX IF EXISTS "LeadScore_leadId_offerId_idx";
