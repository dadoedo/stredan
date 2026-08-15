import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PostgresConfig } from "../types.js";
import {
  getSchema,
  getSchemaSchema,
  listDatabases,
  listDatabasesSchema,
  listTablesSchema,
  listTablesTool,
  query,
  querySchema,
} from "./tools.js";
import { getDatabaseInfo } from "../targets.js";
import { getTableSchema } from "./client.js";

function jsonText(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(error: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
    isError: true as const,
  };
}

export function createPostgresMcp(config: PostgresConfig): McpServer {
  const server = new McpServer({
    name: "stredan-postgres-mcp",
    version: "1.0.0",
  });

  server.tool(
    "list_databases",
    "List configured Postgres databases visible to this API key, with permissions and environments.",
    listDatabasesSchema.shape,
    async () => jsonText(listDatabases(config))
  );

  server.tool(
    "query",
    "Execute a SQL query on a specified database and environment. Readonly keys/databases reject writes.",
    querySchema.shape,
    async (args) => {
      const input = querySchema.parse(args);
      const result = await query(config, input);
      if (!result.success) return errorResult(result.error);
      return jsonText({ rowCount: result.rowCount, rows: result.rows });
    }
  );

  server.tool(
    "get_schema",
    "Get schema for a database, including tables, columns, indexes, and foreign keys.",
    getSchemaSchema.shape,
    async (args) => {
      const input = getSchemaSchema.parse(args);
      const result = await getSchema(config, input);
      if (!result.success) return errorResult(result.error);
      return jsonText({
        database: result.database,
        environment: result.environment,
        schema: result.schemaName,
        tables: result.tables,
      });
    }
  );

  server.tool(
    "list_tables",
    "List all tables in a database schema.",
    listTablesSchema.shape,
    async (args) => {
      const input = listTablesSchema.parse(args);
      const result = await listTablesTool(config, input);
      if (!result.success) return errorResult(result.error);
      return jsonText({
        database: result.database,
        environment: result.environment,
        schema: result.schemaName,
        tables: result.tables,
      });
    }
  );

  server.resource("schema", "postgres://{database}/{environment}/schema", async (uri) => {
    const match = uri.href.match(/^postgres:\/\/([^/]+)\/([^/]+)\/schema$/);
    if (!match) throw new Error(`Resource not found: ${uri.href}`);
    const [, dbKey, envName] = match;
    const { env } = getDatabaseInfo(config, dbKey, envName);
    const tables = await getTableSchema(env.connectionUrl, undefined, "public");
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ database: dbKey, environment: envName, tables }, null, 2),
        },
      ],
    };
  });

  return server;
}
