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
