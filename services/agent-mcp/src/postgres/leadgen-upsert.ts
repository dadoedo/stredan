import { z } from "zod";
import type { PostgresConfig } from "../types.js";
import { getDatabaseInfo } from "../targets.js";
import { getConnection } from "./client.js";
import {
  executableStatements,
  normalizeLead,
  requireId,
  statementsForLead,
  validateScoreInvariant,
  type LeadIn,
} from "./leadgen-enrichment-sql.js";

export const upsertLeadEnrichmentSchema = z.object({
  database: z.string().describe("Database key (e.g. stredan)"),
  environment: z
    .string()
    .optional()
    .describe("Environment name (e.g. prod). Defaults to the only env when omitted."),
  agentRunId: z.string().optional().describe("AgentRun id for audit trail"),
  lead: z.record(z.string(), z.unknown()).describe("One enrichment lead object (ENRICHMENT_JSON.md shape)"),
  scoresOnly: z
    .boolean()
    .optional()
    .default(false)
    .describe("When true, only upserts LeadScore rows (backfill)"),
});

export type UpsertLeadEnrichmentInput = z.infer<typeof upsertLeadEnrichmentSchema>;

export async function upsertLeadEnrichment(config: PostgresConfig, input: UpsertLeadEnrichmentInput) {
  const environment = input.environment || "default";
  try {
    const { env } = getDatabaseInfo(config, input.database, environment);
    if (env.permissions === "readonly") {
      return {
        success: false as const,
        error: `Database "${input.database}" environment "${env.name}" is readonly.`,
      };
    }

    const runId = input.agentRunId ? requireId(input.agentRunId, "agentRunId") : null;
    const lead = normalizeLead(input.lead as LeadIn, 0);
    validateScoreInvariant(lead, input.scoresOnly ?? false);

    const stmts = executableStatements(statementsForLead(lead, runId, input.scoresOnly ?? false));
    const sql = getConnection({ connectionUrl: env.connectionUrl });

    await sql.begin(async (tx) => {
      for (const stmt of stmts) {
        await tx.unsafe(stmt);
      }
    });

    return {
      success: true as const,
      ico: lead.ico,
      leadId: lead.leadId,
      statements: stmts.length,
      status: lead.skip_reason ? "skipped" : input.scoresOnly ? "scores_only" : "enriched",
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
