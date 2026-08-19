/**
 * Turn enrichment JSON into idempotent SQL for Postgres MCP.
 *
 *   npx tsx scripts/leadgen-apply-enrichment.ts tmp/enrichment-<runId>.json --run-id <AgentRunId>
 *   npx tsx scripts/leadgen-apply-enrichment.ts tmp/enrichment-<runId>.json --check
 *
 * Does not connect to the database. Agent executes the printed SQL via MCP
 * in chunks (see --chunk). Scores must be integers; skip_reason is an enum.
 *
 * Unique targets (after scripts/leadgen-dedupe.sql):
 *   LeadEnrichment (leadId, kind)
 *   LeadScore (leadId, offerId)
 *   LeadContact (leadId, email)
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SKIP_REASONS = ["no_site", "no_email", "shell", "it_internal", "bad_ico"] as const;
const HIT_TYPES = ["aggregator", "own_site", "social", "registry", "other"] as const;
const OFFER_CODES = ["A", "B", "C", "D"] as const;
const ID_RE = /^[a-zA-Z0-9._-]+$/;
const ICO_RE = /^\d{8}$/;

type SkipReason = (typeof SKIP_REASONS)[number];
type HitType = (typeof HIT_TYPES)[number];
type OfferCode = (typeof OFFER_CODES)[number];

type SearchHit = {
  url: string;
  type: HitType;
  title?: string;
  snippet?: string;
  hitIco?: string | null;
  icoMatch?: boolean | null;
};

type ContactIn = {
  fullName?: string | null;
  role?: string | null;
  email?: string | null;
  emailSource?: string | null;
  isPrimary?: boolean;
  confidence?: number | null;
};

type PersonIn = {
  fullName: string;
  firstName?: string | null;
  role?: string | null;
  source?: string | null;
};

type ScoreIn = {
  score: number;
  send?: boolean;
  why_sk?: string;
  rationaleSk?: string;
  hook_id?: string | null;
  risks?: string[];
};

type LeadIn = {
  ico: string;
  leadId?: string;
  companyId?: string;
  rpoId?: number | null;
  name?: string;
  city?: string | null;
  nace?: string | null;
  naceLabel?: string | null;
  konatel?: string | null;
  notes?: string | null;
  skip_reason?: SkipReason | null;
  website?: string | null;
  contacts?: ContactIn[];
  search?: { queries?: string[]; hits?: SearchHit[] };
  people?: PersonIn[];
  website_enrichment?: {
    website?: string | null;
    emails?: { email: string; url?: string; context?: string }[];
    skip_reason?: SkipReason | null;
    sakChecked?: boolean;
    evucChecked?: boolean;
  };
  scores?: Partial<Record<OfferCode | "E", ScoreIn>>;
};

function usage(message?: string): never {
  if (message) console.error(message);
  console.error(
    "Usage: npx tsx scripts/leadgen-apply-enrichment.ts <file.json> [--run-id ID] [--chunk N] [--check] [--out file.sql]",
  );
  process.exit(1);
}

function sqlStr(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  const raw = JSON.stringify(value);
  if (raw.includes("$lg$")) {
    throw new Error("JSON contains dollar-quote delimiter $lg$");
  }
  return `$lg$${raw}$lg$::jsonb`;
}

function sqlNullStr(value: string | null | undefined): string {
  if (value == null || value === "") return "NULL";
  return sqlStr(value);
}

function requireId(value: string, label: string): string {
  if (!ID_RE.test(value)) throw new Error(`Invalid ${label}: ${value}`);
  return value;
}

function asIntScore(value: unknown, offer: string, ico: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error(`Score for ${ico} offer ${offer} must be an integer 0–100, got ${JSON.stringify(value)}`);
  }
  return value;
}

function asSkip(value: unknown, ico: string): SkipReason | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !SKIP_REASONS.includes(value as SkipReason)) {
    throw new Error(`skip_reason for ${ico} must be one of ${SKIP_REASONS.join("|")}, got ${JSON.stringify(value)}`);
  }
  return value as SkipReason;
}

function contactId(leadId: string, email: string | null, fullName: string): string {
  const key = email ? `e:${email.toLowerCase()}` : `n:${fullName}`;
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 12);
  return `lc_${leadId}_${hash}`;
}

function parseArgs(argv: string[]) {
  const flags: Record<string, string | boolean> = {};
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--check") flags.check = true;
    else if (arg === "--run-id" || arg === "--chunk" || arg === "--out") {
      const next = argv[++i];
      if (!next) usage(`Missing value for ${arg}`);
      flags[arg.slice(2)] = next;
    } else if (arg.startsWith("-")) usage(`Unknown flag ${arg}`);
    else rest.push(arg);
  }
  return { file: rest[0], flags };
}

function normalizeLead(raw: LeadIn, index: number): LeadIn {
  if (!raw || typeof raw !== "object") throw new Error(`Lead ${index} is not an object`);
  if (!ICO_RE.test(raw.ico)) throw new Error(`Lead ${index}: ico must be 8 digits`);
  const skip = asSkip(raw.skip_reason ?? raw.website_enrichment?.skip_reason ?? null, raw.ico);
  for (const hit of raw.search?.hits ?? []) {
    if (!HIT_TYPES.includes(hit.type)) {
      throw new Error(`${raw.ico}: hit type ${JSON.stringify(hit.type)} is invalid`);
    }
  }
  if (raw.scores) {
    for (const code of OFFER_CODES) {
      const row = raw.scores[code];
      if (row) asIntScore(row.score, code, raw.ico);
    }
  }
  return {
    ...raw,
    leadId: raw.leadId ?? `ldry_${raw.ico}`,
    companyId: raw.companyId ?? `cmp_${raw.ico}`,
    skip_reason: skip,
  };
}

function statementsForLead(lead: LeadIn, runId: string | null): string[] {
  const leadId = requireId(lead.leadId!, "leadId");
  const companyId = requireId(lead.companyId!, "companyId");
  const skip = lead.skip_reason ?? null;
  const notes = lead.notes
    ? skip && !lead.notes.includes("skip_reason=")
      ? `${lead.notes} | skip_reason=${skip}`
      : lead.notes
    : skip
      ? `skip_reason=${skip}`
      : undefined;
  const status = skip ? "skipped" : "enriched";
  const website = lead.website_enrichment?.website ?? lead.website ?? null;
  const ownSite = Boolean(website);
  const queries = lead.search?.queries ?? [];
  const hits = lead.search?.hits ?? [];
  const people = lead.people ?? [];
  const emails = lead.website_enrichment?.emails ?? [];
  const stmts: string[] = [];

  stmts.push(`-- ${lead.ico} ${lead.name ?? ""}`.trim());

  if (ownSite) {
    stmts.push(
      `UPDATE "Company" SET website = ${sqlStr(website!)}, "updatedAt" = NOW() WHERE id = ${sqlStr(companyId)} AND website IS DISTINCT FROM ${sqlStr(website!)};`,
    );
  }

  const notesAssign =
    notes === undefined ? `"notes" = "notes"` : `notes = ${sqlNullStr(notes)}`;
  stmts.push(
    `UPDATE "Lead" SET
  status = CASE
    WHEN status IN ('sourced','enriching','enriched','skipped','scored') THEN ${sqlStr(status)}
    ELSE status
  END,
  ${notesAssign},
  "skipReason" = CASE
    WHEN status IN ('sourced','enriching','enriched','skipped','scored') THEN ${sqlNullStr(skip)}
    ELSE "skipReason"
  END,
  "updatedAt" = NOW()
WHERE id = ${sqlStr(leadId)};`,
  );

  const searchInput = {
    ico: lead.ico,
    name: lead.name ?? null,
    city: lead.city ?? null,
    nace: lead.nace ?? null,
    konatel: lead.konatel ?? null,
    queries,
  };
  const searchOutput = { hits, notes: lead.notes ?? null };
  stmts.push(
    `INSERT INTO "LeadEnrichment" (id, "leadId", "agentRunId", provider, kind, "inputJson", "outputJson", confidence)
VALUES (${sqlStr(`enr_${leadId}_search`)}, ${sqlStr(leadId)}, ${sqlNullStr(runId)}, 'cursor-agent', 'search', ${sqlJson(searchInput)}, ${sqlJson(searchOutput)}, NULL)
ON CONFLICT ("leadId", kind) DO UPDATE SET
  "agentRunId" = EXCLUDED."agentRunId",
  "inputJson" = EXCLUDED."inputJson",
  "outputJson" = EXCLUDED."outputJson";`,
  );

  stmts.push(
    `INSERT INTO "LeadEnrichment" (id, "leadId", "agentRunId", provider, kind, "inputJson", "outputJson", confidence)
VALUES (${sqlStr(`enr_${leadId}_people`)}, ${sqlStr(leadId)}, ${sqlNullStr(runId)}, 'cursor-agent', 'people', ${sqlJson({ konatel: lead.konatel ?? null })}, ${sqlJson({ people })}, NULL)
ON CONFLICT ("leadId", kind) DO UPDATE SET
  "agentRunId" = EXCLUDED."agentRunId",
  "inputJson" = EXCLUDED."inputJson",
  "outputJson" = EXCLUDED."outputJson";`,
  );

  const websiteOutput = {
    website,
    emails,
    skip_reason: skip,
    sakChecked: lead.website_enrichment?.sakChecked ?? false,
    evucChecked: lead.website_enrichment?.evucChecked ?? false,
  };
  const emailConfidence =
    (lead.contacts ?? [])
      .map((c) => c.confidence)
      .filter((n): n is number => typeof n === "number")
      .sort((a, b) => b - a)[0] ?? null;

  stmts.push(
    `INSERT INTO "LeadEnrichment" (id, "leadId", "agentRunId", provider, kind, "inputJson", "outputJson", confidence)
VALUES (${sqlStr(`enr_${leadId}_website`)}, ${sqlStr(leadId)}, ${sqlNullStr(runId)}, 'cursor-agent', 'website', ${sqlJson({ ico: lead.ico })}, ${sqlJson(websiteOutput)}, ${emailConfidence ?? "NULL"})
ON CONFLICT ("leadId", kind) DO UPDATE SET
  "agentRunId" = EXCLUDED."agentRunId",
  "inputJson" = EXCLUDED."inputJson",
  "outputJson" = EXCLUDED."outputJson",
  confidence = EXCLUDED.confidence;`,
  );

  for (const contact of lead.contacts ?? []) {
    const email = contact.email?.trim() || null;
    const fullName = contact.fullName?.trim() || "";
    if (!email && !fullName) continue;
    const id = requireId(contactId(leadId, email, fullName || lead.ico), "contactId");
    if (email) {
      stmts.push(
        `INSERT INTO "LeadContact" (id, "leadId", "fullName", role, email, "emailSource", "isPrimary", "createdAt", "updatedAt")
VALUES (${sqlStr(id)}, ${sqlStr(leadId)}, ${sqlNullStr(fullName || null)}, ${sqlNullStr(contact.role ?? null)}, ${sqlStr(email.toLowerCase())}, ${sqlNullStr(contact.emailSource ?? null)}, ${contact.isPrimary ? "TRUE" : "FALSE"}, NOW(), NOW())
ON CONFLICT ("leadId", email) DO UPDATE SET
  "fullName" = COALESCE(EXCLUDED."fullName", "LeadContact"."fullName"),
  role = COALESCE(EXCLUDED.role, "LeadContact".role),
  "emailSource" = COALESCE(EXCLUDED."emailSource", "LeadContact"."emailSource"),
  "isPrimary" = EXCLUDED."isPrimary" OR "LeadContact"."isPrimary",
  "updatedAt" = NOW();`,
      );
    } else {
      stmts.push(
        `INSERT INTO "LeadContact" (id, "leadId", "fullName", role, email, "emailSource", "isPrimary", "createdAt", "updatedAt")
SELECT ${sqlStr(id)}, ${sqlStr(leadId)}, ${sqlStr(fullName)}, ${sqlNullStr(contact.role ?? null)}, NULL, ${sqlNullStr(contact.emailSource ?? null)}, ${contact.isPrimary ? "TRUE" : "FALSE"}, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "LeadContact" c WHERE c."leadId" = ${sqlStr(leadId)} AND c."fullName" = ${sqlStr(fullName)} AND c.email IS NULL
);`,
      );
    }
  }

  const scores = lead.scores ?? {};
  for (const code of OFFER_CODES) {
    const row = scores[code];
    if (!row) continue;
    const score = asIntScore(row.score, code, lead.ico);
    const why = row.why_sk ?? row.rationaleSk ?? null;
    const output = {
      score,
      send: row.send ?? false,
      why_sk: why,
      hook_id: row.hook_id ?? null,
      risks: row.risks ?? [],
    };
    stmts.push(
      `INSERT INTO "LeadScore" (id, "leadId", "offerId", "agentRunId", score, "rationaleSk", "inputJson", "outputJson")
SELECT ${sqlStr(`scr_${leadId}_${code}`)}, ${sqlStr(leadId)}, o.id, ${sqlNullStr(runId)}, ${score}, ${sqlNullStr(why)}, ${sqlJson({ ico: lead.ico, nace: lead.nace ?? null, skip_reason: skip })}, ${sqlJson(output)}
FROM "Offer" o WHERE o.code = ${sqlStr(code)}
ON CONFLICT ("leadId", "offerId") DO UPDATE SET
  "agentRunId" = EXCLUDED."agentRunId",
  score = EXCLUDED.score,
  "rationaleSk" = EXCLUDED."rationaleSk",
  "inputJson" = EXCLUDED."inputJson",
  "outputJson" = EXCLUDED."outputJson";`,
    );
  }

  return stmts;
}

function main() {
  const { file, flags } = parseArgs(process.argv.slice(2));
  if (!file) usage();
  const runId = typeof flags["run-id"] === "string" ? requireId(flags["run-id"], "run-id") : null;
  const chunkSize = Number(flags.chunk ?? 10);
  if (!Number.isInteger(chunkSize) || chunkSize < 1) usage("--chunk must be a positive integer");

  const parsed = JSON.parse(readFileSync(resolve(file), "utf8"));
  const rows: LeadIn[] = Array.isArray(parsed) ? parsed : parsed.leads;
  if (!Array.isArray(rows)) usage("JSON must be an array of leads or { leads: [] }");

  const leads = rows.map(normalizeLead);
  if (flags.check) {
    console.log(`OK ${leads.length} leads`);
    return;
  }

  const header = [
    "-- generated by scripts/leadgen-apply-enrichment.ts",
    `-- source ${file}`,
    `-- leads ${leads.length}`,
    runId ? `-- AgentRun ${runId}` : "-- no AgentRun id",
    "-- Each statement is idempotent. If MCP runs one query at a time, skip comments.",
  ];
  const body: string[] = [];
  leads.forEach((lead, i) => {
    if (i % chunkSize === 0) {
      body.push(`-- MCP CHUNK ${Math.floor(i / chunkSize) + 1} (leads ${i + 1}-${Math.min(i + chunkSize, leads.length)})`);
    }
    body.push(...statementsForLead(lead, runId));
  });
  const sql = [...header, ...body, ""].join("\n");

  if (typeof flags.out === "string") {
    writeFileSync(resolve(flags.out), sql);
    console.error(`Wrote ${flags.out} (${leads.length} leads)`);
  } else {
    process.stdout.write(sql);
  }
}

main();
