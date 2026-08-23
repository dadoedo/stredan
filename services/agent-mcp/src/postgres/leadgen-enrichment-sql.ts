import { createHash } from "node:crypto";

export const SKIP_REASONS = ["no_site", "no_email", "shell", "it_internal", "bad_ico"] as const;
export const HIT_TYPES = ["aggregator", "own_site", "social", "registry", "other"] as const;
export const OFFER_CODES = ["A", "B", "C", "D"] as const;
const ID_RE = /^[a-zA-Z0-9._-]+$/;
const ICO_RE = /^\d{8}$/;

export type SkipReason = (typeof SKIP_REASONS)[number];
export type HitType = (typeof HIT_TYPES)[number];
export type OfferCode = (typeof OFFER_CODES)[number];

export type SearchHit = {
  url: string;
  type: HitType;
  title?: string;
  snippet?: string;
  hitIco?: string | null;
  icoMatch?: boolean | null;
};

export type ContactIn = {
  fullName?: string | null;
  role?: string | null;
  email?: string | null;
  emailSource?: string | null;
  isPrimary?: boolean;
  confidence?: number | null;
};

export type PersonIn = {
  fullName: string;
  firstName?: string | null;
  role?: string | null;
  source?: string | null;
};

export type ScoreIn = {
  score: number;
  send?: boolean;
  why_sk?: string;
  rationaleSk?: string;
  hook_id?: string | null;
  risks?: string[];
};

export type LeadIn = {
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

export function requireId(value: string, label: string): string {
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

export function normalizeLead(raw: LeadIn, index: number): LeadIn {
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

function hasEmail(lead: LeadIn): boolean {
  const contactEmail = (lead.contacts ?? []).some((c) => c.email && c.email.trim() !== "");
  const websiteEmail = (lead.website_enrichment?.emails ?? []).some((e) => e.email?.trim());
  return contactEmail || websiteEmail;
}

export function validateScoreInvariant(lead: LeadIn, scoresOnly: boolean): void {
  const skip = lead.skip_reason ?? null;
  if (skip) return;
  const scoredAd = OFFER_CODES.filter((code) => lead.scores?.[code] != null);
  if (scoredAd.length > 0) return;
  if (scoresOnly) return;
  if (hasEmail(lead)) {
    throw new Error(
      `${lead.ico}: enriched lead with an email has no A–D scores. ` +
        `Score it per docs/leadgen/COPY.md §9 or set skip_reason.`,
    );
  }
}

function leadCompanyJoin(): string {
  return `"Lead" l JOIN "Company" c ON c.id = l."companyId"`;
}

function icoPred(ico: string): string {
  return `c.ico = ${sqlStr(ico)}`;
}

/** SQL comments and blank lines are skipped by applyStatements. */
export function statementsForLead(lead: LeadIn, runId: string | null, scoresOnly = false): string[] {
  const ico = lead.ico;
  const stmts: string[] = [];
  const join = leadCompanyJoin();
  const where = icoPred(ico);

  if (scoresOnly) {
    stmts.push(`-- ${ico} ${lead.name ?? ""} (scores only)`.trim());
    const scores = lead.scores ?? {};
    for (const code of OFFER_CODES) {
      const row = scores[code];
      if (!row) continue;
      const score = asIntScore(row.score, code, ico);
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
SELECT 'scr_' || l.id || ${sqlStr(`_${code}`)}, l.id, o.id, ${sqlNullStr(runId)}, ${score}, ${sqlNullStr(why)}, ${sqlJson({ ico, nace: lead.nace ?? null })}, ${sqlJson(output)}
FROM ${join}
JOIN "Offer" o ON o.code = ${sqlStr(code)}
WHERE ${where}
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

  const skip = lead.skip_reason ?? null;
  const notes = lead.notes
    ? skip && !lead.notes.includes("skip_reason=")
      ? `${lead.notes} | skip_reason=${skip}`
      : lead.notes
    : skip
      ? `skip_reason=${skip}`
      : undefined;
  const status = skip ? "skipped" : "enriched";
  const queries = lead.search?.queries ?? [];
  const hits = lead.search?.hits ?? [];
  const people = lead.people ?? [];
  const emails = lead.website_enrichment?.emails ?? [];
  const ownSiteHit = hits.find((hit) => {
    if (hit.type !== "own_site") return false;
    if (hit.icoMatch === false) return false;
    if (hit.hitIco && hit.hitIco !== ico) return false;
    return true;
  });
  const website = ownSiteHit?.url ?? null;
  const early = `status IN ('sourced','enriching','enriched','skipped')`;

  stmts.push(`-- ${ico} ${lead.name ?? ""}`.trim());

  if (website) {
    stmts.push(
      `UPDATE "Company" SET website = ${sqlStr(website)}, "updatedAt" = NOW() WHERE ico = ${sqlStr(ico)} AND website IS DISTINCT FROM ${sqlStr(website)};`,
    );
  }

  const searchInput = {
    ico,
    name: lead.name ?? null,
    city: lead.city ?? null,
    nace: lead.nace ?? null,
    konatel: lead.konatel ?? null,
    queries,
  };
  const searchOutput = { hits, notes: lead.notes ?? null };
  stmts.push(
    `INSERT INTO "LeadEnrichment" (id, "leadId", "agentRunId", provider, kind, "inputJson", "outputJson", confidence)
SELECT 'enr_' || l.id || '_search', l.id, ${sqlNullStr(runId)}, 'cursor-agent', 'search', ${sqlJson(searchInput)}, ${sqlJson(searchOutput)}, NULL
FROM ${leadCompanyJoin()}
WHERE ${icoPred(ico)}
ON CONFLICT ("leadId", kind) DO UPDATE SET
  "agentRunId" = EXCLUDED."agentRunId",
  "inputJson" = EXCLUDED."inputJson",
  "outputJson" = EXCLUDED."outputJson";`,
  );

  stmts.push(
    `INSERT INTO "LeadEnrichment" (id, "leadId", "agentRunId", provider, kind, "inputJson", "outputJson", confidence)
SELECT 'enr_' || l.id || '_people', l.id, ${sqlNullStr(runId)}, 'cursor-agent', 'people', ${sqlJson({ konatel: lead.konatel ?? null })}, ${sqlJson({ people })}, NULL
FROM ${leadCompanyJoin()}
WHERE ${icoPred(ico)}
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
SELECT 'enr_' || l.id || '_website', l.id, ${sqlNullStr(runId)}, 'cursor-agent', 'website', ${sqlJson({ ico })}, ${sqlJson(websiteOutput)}, ${emailConfidence ?? "NULL"}
FROM ${leadCompanyJoin()}
WHERE ${icoPred(ico)}
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
    const id = requireId(contactId(ico, email, fullName || ico), "contactId");
    if (email) {
      stmts.push(
        `INSERT INTO "LeadContact" (id, "leadId", "fullName", role, email, "emailSource", "isPrimary", "createdAt", "updatedAt")
SELECT ${sqlStr(id)}, l.id, ${sqlNullStr(fullName || null)}, ${sqlNullStr(contact.role ?? null)}, ${sqlStr(email.toLowerCase())}, ${sqlNullStr(contact.emailSource ?? null)}, ${contact.isPrimary ? "TRUE" : "FALSE"}, NOW(), NOW()
FROM ${leadCompanyJoin()}
WHERE ${icoPred(ico)}
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
SELECT ${sqlStr(id)}, l.id, ${sqlStr(fullName)}, ${sqlNullStr(contact.role ?? null)}, NULL, ${sqlNullStr(contact.emailSource ?? null)}, ${contact.isPrimary ? "TRUE" : "FALSE"}, NOW(), NOW()
FROM ${leadCompanyJoin()}
WHERE ${icoPred(ico)}
AND NOT EXISTS (
  SELECT 1 FROM "LeadContact" existing
  WHERE existing."leadId" = l.id AND existing."fullName" = ${sqlStr(fullName)} AND existing.email IS NULL
);`,
      );
    }
  }

  const scores = lead.scores ?? {};
  for (const code of OFFER_CODES) {
    const row = scores[code];
    if (!row) continue;
    const score = asIntScore(row.score, code, ico);
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
SELECT 'scr_' || l.id || ${sqlStr(`_${code}`)}, l.id, o.id, ${sqlNullStr(runId)}, ${score}, ${sqlNullStr(why)}, ${sqlJson({ ico, nace: lead.nace ?? null, skip_reason: skip })}, ${sqlJson(output)}
FROM ${leadCompanyJoin()}
JOIN "Offer" o ON o.code = ${sqlStr(code)}
WHERE ${icoPred(ico)}
ON CONFLICT ("leadId", "offerId") DO UPDATE SET
  "agentRunId" = EXCLUDED."agentRunId",
  score = EXCLUDED.score,
  "rationaleSk" = EXCLUDED."rationaleSk",
  "inputJson" = EXCLUDED."inputJson",
  "outputJson" = EXCLUDED."outputJson";`,
    );
  }

  // Lead status LAST — never mark enriched before enrichment rows exist (batch 2 hollow-lead bug).
  const notesAssign =
    notes === undefined
      ? `"notes" = "notes"`
      : `"notes" = CASE
    WHEN ${early} THEN ${sqlNullStr(notes)}
    WHEN status = 'scored' AND ${skip ? "TRUE" : "FALSE"} THEN ${sqlNullStr(notes)}
    ELSE "notes"
  END`;
  stmts.push(
    `UPDATE "Lead" l SET
  status = CASE
    WHEN ${early} THEN ${sqlStr(status)}
    WHEN status = 'scored' AND ${skip ? "TRUE" : "FALSE"} THEN 'skipped'
    ELSE status
  END,
  ${notesAssign},
  "skipReason" = CASE
    WHEN ${early} THEN ${sqlNullStr(skip)}
    WHEN status = 'scored' AND ${skip ? "TRUE" : "FALSE"} THEN ${sqlNullStr(skip)}
    ELSE "skipReason"
  END,
  "updatedAt" = NOW()
FROM "Company" c
WHERE l."companyId" = c.id AND c.ico = ${sqlStr(ico)};`,
  );

  return stmts;
}

export function executableStatements(stmts: string[]): string[] {
  return stmts.filter((line) => line.trim() !== "" && !line.trim().startsWith("--"));
}
