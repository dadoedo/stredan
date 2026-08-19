/**
 * Turn draft JSON into idempotent SQL for Postgres MCP.
 *
 *   npx tsx scripts/leadgen-apply-drafts.ts tmp/drafts-<runId>.json --check
 *   npx tsx scripts/leadgen-apply-drafts.ts tmp/drafts-<runId>.json --out tmp/drafts-<runId>.sql
 *
 * Does not connect to the database. Does not send mail.
 * One cold Touch per lead: INSERT is skipped if any Touch already exists.
 * Lead status → queued only from sourced/enriching/enriched/skipped/scored.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OFFER_CODES = ["A", "B", "C", "D"] as const;
const ACCOUNT_CODES = ["1", "2", "3", "4", "5"] as const;
const ICO_RE = /^\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BANNED = /ChatGPT|Claude|Gemini|\u2014|\{\{[a-z_]+}}/i;

type OfferCode = (typeof OFFER_CODES)[number];
type AccountCode = (typeof ACCOUNT_CODES)[number];

type DraftIn = {
  ico: string;
  email: string;
  offerCode: OfferCode;
  accountCode: AccountCode;
  templateKey?: string;
  subject: string;
  bodyText: string;
  personalization: {
    salutation: string;
    company: string;
    hook: string | null;
    landing: string;
    firstName?: string | null;
  };
};

function usage(message?: string): never {
  if (message) console.error(message);
  console.error(
    "Usage: npx tsx scripts/leadgen-apply-drafts.ts <file.json> [--chunk N] [--check] [--out file.sql]",
  );
  process.exit(1);
}

function sqlStr(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  const raw = JSON.stringify(value);
  if (raw.includes("$lg$")) throw new Error("JSON contains dollar-quote delimiter $lg$");
  return `$lg$${raw}$lg$::jsonb`;
}

function parseArgs(argv: string[]) {
  const flags: Record<string, string | boolean> = {};
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--check") flags.check = true;
    else if (arg === "--chunk" || arg === "--out") {
      const next = argv[++i];
      if (!next) usage(`Missing value for ${arg}`);
      flags[arg.slice(2)] = next;
    } else if (arg.startsWith("-")) usage(`Unknown flag ${arg}`);
    else rest.push(arg);
  }
  return { file: rest[0], flags };
}

function normalize(raw: DraftIn, index: number): DraftIn {
  if (!raw || typeof raw !== "object") throw new Error(`Draft ${index} is not an object`);
  if (!ICO_RE.test(raw.ico)) throw new Error(`Draft ${index}: ico must be 8 digits`);
  const email = raw.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) throw new Error(`${raw.ico}: invalid email`);
  if (!OFFER_CODES.includes(raw.offerCode)) throw new Error(`${raw.ico}: offerCode must be A–D`);
  if (raw.offerCode === ("E" as OfferCode)) throw new Error(`${raw.ico}: offer E is not cold`);
  if (!ACCOUNT_CODES.includes(raw.accountCode)) throw new Error(`${raw.ico}: accountCode must be 1–5`);
  const subject = raw.subject?.trim();
  const bodyText = raw.bodyText?.trim();
  if (!subject || !bodyText) throw new Error(`${raw.ico}: subject and bodyText required`);
  const bannedHit = `${subject}\n${bodyText}`.match(BANNED);
  if (bannedHit) throw new Error(`${raw.ico}: banned token ${bannedHit[0]}`);
  const p = raw.personalization;
  if (!p?.salutation || !p.company || !p.landing) {
    throw new Error(`${raw.ico}: personalization needs salutation, company, landing`);
  }
  if (!p.salutation.startsWith("Dobrý deň")) {
    throw new Error(`${raw.ico}: salutation must start with Dobrý deň`);
  }
  if (!bodyText.startsWith("Dobrý deň")) {
    throw new Error(`${raw.ico}: bodyText must start with the filled salutation`);
  }
  if (!/^https:\/\/stredan\.sk\/offers\//.test(p.landing)) {
    throw new Error(`${raw.ico}: landing must be https://stredan.sk/offers/...`);
  }
  if (!bodyText.includes(p.landing)) {
    throw new Error(`${raw.ico}: bodyText must include the landing URL`);
  }
  const leftover = [...subject.matchAll(/\{\{[a-z0-9_]+\}\}/gi), ...bodyText.matchAll(/\{\{[a-z0-9_]+\}\}/gi)];
  if (leftover.length) {
    throw new Error(`${raw.ico}: leftover template token ${leftover[0][0]}`);
  }
  return {
    ...raw,
    email,
    templateKey: raw.templateKey || "cold-1",
    subject,
    bodyText,
    personalization: {
      salutation: p.salutation,
      company: p.company,
      hook: p.hook ?? null,
      landing: p.landing,
      firstName: p.firstName ?? null,
    },
  };
}

function statementsForDraft(draft: DraftIn): string[] {
  const key = draft.templateKey || "cold-1";
  const id = `tch_${draft.ico}_${draft.offerCode}_${key}`.replace(/[^a-zA-Z0-9._-]/g, "_");
  return [
    `-- ${draft.ico} ${draft.offerCode}×${draft.accountCode} → ${draft.email}`,
    `INSERT INTO "Touch" (
  id, "leadId", "contactId", "offerId", "templateId", "sendAccountId",
  channel, "accountKey", status, subject, "bodyText", personalization, "createdAt", "updatedAt"
)
SELECT
  ${sqlStr(id)},
  l.id,
  lc.id,
  o.id,
  tmpl.id,
  a.id,
  a.channel,
  a."mcpAccountKey",
  'draft',
  ${sqlStr(draft.subject)},
  ${sqlStr(draft.bodyText)},
  ${sqlJson(draft.personalization)},
  NOW(),
  NOW()
FROM "Lead" l
JOIN "Company" c ON c.id = l."companyId"
JOIN "LeadContact" lc ON lc."leadId" = l.id AND lower(lc.email) = ${sqlStr(draft.email)}
JOIN "Offer" o ON o.code = ${sqlStr(draft.offerCode)}
JOIN "EmailTemplate" tmpl
  ON tmpl."offerId" = o.id AND tmpl.key = ${sqlStr(key)} AND tmpl.locale = 'sk' AND tmpl.active = true
JOIN "SendAccount" a
  ON a.code = ${sqlStr(draft.accountCode)} AND a.active = true AND a."mcpAccountKey" IS NOT NULL
WHERE c.ico = ${sqlStr(draft.ico)}
  AND l."skipReason" IS NULL
  AND l.status NOT IN ('suppressed','won','lost','skipped','contacted')
  AND NOT EXISTS (SELECT 1 FROM "Touch" t WHERE t."leadId" = l.id)
  AND NOT EXISTS (
    SELECT 1 FROM "Suppression" s
    WHERE s.ico = c.ico OR lower(s.email) = ${sqlStr(draft.email)}
  );`,
    `UPDATE "Lead" l SET
  status = CASE
    WHEN status IN ('sourced','enriching','enriched','skipped','scored') THEN 'queued'
    ELSE status
  END,
  "updatedAt" = NOW()
FROM "Company" c
WHERE l."companyId" = c.id
  AND c.ico = ${sqlStr(draft.ico)}
  AND EXISTS (SELECT 1 FROM "Touch" t WHERE t."leadId" = l.id AND t.status = 'draft');`,
  ];
}

function main() {
  const { file, flags } = parseArgs(process.argv.slice(2));
  if (!file) usage();
  const chunkSize = Number(flags.chunk ?? 10);
  if (!Number.isInteger(chunkSize) || chunkSize < 1) usage("--chunk must be a positive integer");

  const parsed = JSON.parse(readFileSync(resolve(file), "utf8"));
  const rows: DraftIn[] = Array.isArray(parsed) ? parsed : parsed.drafts;
  if (!Array.isArray(rows)) usage("JSON must be an array of drafts or { drafts: [] }");

  const drafts = rows.map(normalize);
  const icos = new Set(drafts.map((d) => d.ico));
  if (icos.size !== drafts.length) throw new Error("Duplicate ico in draft JSON — one cold draft per lead");
  if (flags.check) {
    console.log(`OK ${drafts.length} drafts`);
    return;
  }

  const header = [
    "-- generated by scripts/leadgen-apply-drafts.ts",
    `-- source ${file}`,
    `-- drafts ${drafts.length}`,
    "-- No Email MCP. status=draft only.",
  ];
  const body: string[] = [];
  drafts.forEach((draft, i) => {
    if (i % chunkSize === 0) {
      body.push(
        `-- MCP CHUNK ${Math.floor(i / chunkSize) + 1} (drafts ${i + 1}-${Math.min(i + chunkSize, drafts.length)})`,
      );
    }
    body.push(...statementsForDraft(draft));
  });
  const sql = [...header, ...body, ""].join("\n");
  if (typeof flags.out === "string") {
    writeFileSync(resolve(flags.out), sql);
    console.error(`Wrote ${flags.out} (${drafts.length} drafts)`);
  } else {
    process.stdout.write(sql);
  }
}

main();
