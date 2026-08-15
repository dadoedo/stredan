import { z } from "zod";
import type { PostgresConfig } from "../types.js";
import { getDatabaseInfo } from "../targets.js";
import { executeQuery, getTableSchema, listTables, type TableInfo } from "./client.js";
import { isWriteOperation } from "./sql-parser.js";

export const listDatabasesSchema = z.object({});

export function listDatabases(config: PostgresConfig) {
  return Array.from(config.databases.values()).map((db) => ({
    key: db.key,
    name: db.name,
    environments: Array.from(db.environments.values()).map((env) => ({
      name: env.name,
      permissions: env.permissions,
    })),
  }));
}

export const querySchema = z.object({
  database: z.string().describe("Database key from configuration (e.g. 'app')"),
  environment: z
    .string()
    .optional()
    .describe("Environment name (e.g. 'default', 'prod'). Optional if the database has a single environment."),
  sql: z.string().describe("SQL query to execute"),
});

export async function query(config: PostgresConfig, input: z.infer<typeof querySchema>) {
  const environment = input.environment || "default";
  try {
    const { env } = getDatabaseInfo(config, input.database, environment);
    if (env.permissions === "readonly" && isWriteOperation(input.sql)) {
      return {
        success: false as const,
        rowCount: 0,
        rows: [] as Record<string, unknown>[],
        error:
          `Database "${input.database}" environment "${env.name}" is readonly. Write operations (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE) are not allowed.`,
      };
    }
    const rows = await executeQuery(env.connectionUrl, input.sql);
    return { success: true as const, rowCount: rows.length, rows };
  } catch (error) {
    return {
      success: false as const,
      rowCount: 0,
      rows: [] as Record<string, unknown>[],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const getSchemaSchema = z.object({
  database: z.string().describe("Database key from configuration"),
  environment: z.string().optional().describe("Environment name"),
  table: z.string().optional().describe("Specific table name (optional)"),
  schema: z.string().optional().default("public").describe("PostgreSQL schema name (default: public)"),
});

export async function getSchema(config: PostgresConfig, input: z.infer<typeof getSchemaSchema>) {
  const environment = input.environment || "default";
  const schemaName = input.schema ?? "public";
  try {
    const { env } = getDatabaseInfo(config, input.database, environment);
    const tables: TableInfo[] = await getTableSchema(env.connectionUrl, input.table, schemaName);
    return {
      success: true as const,
      database: input.database,
      environment: env.name,
      schemaName,
      tables,
    };
  } catch (error) {
    return {
      success: false as const,
      database: input.database,
      environment,
      schemaName,
      tables: [] as TableInfo[],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const listTablesSchema = z.object({
  database: z.string().describe("Database key from configuration"),
  environment: z.string().optional().describe("Environment name"),
  schema: z.string().optional().default("public").describe("PostgreSQL schema name (default: public)"),
});

export async function listTablesTool(config: PostgresConfig, input: z.infer<typeof listTablesSchema>) {
  const environment = input.environment || "default";
  const schemaName = input.schema ?? "public";
  try {
    const { env } = getDatabaseInfo(config, input.database, environment);
    const tables = await listTables(env.connectionUrl, schemaName);
    return {
      success: true as const,
      database: input.database,
      environment: env.name,
      schemaName,
      tables,
    };
  } catch (error) {
    return {
      success: false as const,
      database: input.database,
      environment,
      schemaName,
      tables: [] as string[],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
