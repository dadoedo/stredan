import postgres, { Sql } from "postgres";

interface ConnectionOptions {
  connectionUrl: string;
  readonly?: boolean;
}

interface PooledConnection {
  sql: Sql;
  lastUsed: number;
}

const connectionPool = new Map<string, PooledConnection>();

const CONNECTION_TIMEOUT_MS = 30000;
const IDLE_TIMEOUT_MS = 60000;
const MAX_CONNECTIONS = 10;

export function getConnection(options: ConnectionOptions): Sql {
  const cacheKey = options.connectionUrl;

  const existing = connectionPool.get(cacheKey);
  if (existing) {
    existing.lastUsed = Date.now();
    return existing.sql;
  }

  const sql = postgres(options.connectionUrl, {
    max: MAX_CONNECTIONS,
    idle_timeout: IDLE_TIMEOUT_MS / 1000,
    connect_timeout: CONNECTION_TIMEOUT_MS / 1000,
    onnotice: () => {},
  });

  connectionPool.set(cacheKey, {
    sql,
    lastUsed: Date.now(),
  });

  return sql;
}

export async function executeQuery(
  connectionUrl: string,
  query: string
): Promise<Record<string, unknown>[]> {
  const sql = getConnection({ connectionUrl });

  try {
    const result = await sql.unsafe(query);
    return result as Record<string, unknown>[];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
    throw error;
  }
}

export interface TableInfo {
  tableName: string;
  schemaName: string;
  columns: ColumnInfo[];
  primaryKey: string[];
  foreignKeys: ForeignKeyInfo[];
  indexes: IndexInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
}

export interface ForeignKeyInfo {
  constraintName: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
}

export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  isPrimary: boolean;
}

export async function getTableSchema(
  connectionUrl: string,
  tableName?: string,
  schemaName: string = "public"
): Promise<TableInfo[]> {
  const sql = getConnection({ connectionUrl });

  const tableFilter = tableName
    ? sql`AND c.relname = ${tableName}`
    : sql``;

  const tables = await sql`
    SELECT 
      c.relname as table_name,
      n.nspname as schema_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = ${schemaName}
      ${tableFilter}
    ORDER BY c.relname
  `;

  const result: TableInfo[] = [];

  for (const table of tables) {
    const columns = await sql`
      SELECT 
        a.attname as name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
        NOT a.attnotnull as nullable,
        pg_get_expr(d.adbin, d.adrelid) as default_value,
        COALESCE(pk.is_pk, false) as is_primary_key
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      LEFT JOIN (
        SELECT 
          conrelid,
          unnest(conkey) as attnum,
          true as is_pk
        FROM pg_constraint
        WHERE contype = 'p'
      ) pk ON pk.conrelid = c.oid AND pk.attnum = a.attnum
      WHERE c.relname = ${table.table_name}
        AND n.nspname = ${table.schema_name}
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
    `;

    const primaryKeyResult = await sql`
      SELECT array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
      WHERE con.contype = 'p'
        AND c.relname = ${table.table_name}
        AND n.nspname = ${table.schema_name}
      GROUP BY con.oid
    `;

    const foreignKeys = await sql`
      SELECT 
        con.conname as constraint_name,
        array_agg(a.attname ORDER BY array_position(con.conkey, a.attnum)) as columns,
        ref_c.relname as referenced_table,
        array_agg(ref_a.attname ORDER BY array_position(con.confkey, ref_a.attnum)) as referenced_columns
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey)
      JOIN pg_class ref_c ON ref_c.oid = con.confrelid
      JOIN pg_attribute ref_a ON ref_a.attrelid = ref_c.oid AND ref_a.attnum = ANY(con.confkey)
      WHERE con.contype = 'f'
        AND c.relname = ${table.table_name}
        AND n.nspname = ${table.schema_name}
      GROUP BY con.oid, con.conname, ref_c.relname
    `;

    const indexes = await sql`
      SELECT 
        i.relname as name,
        array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary
      FROM pg_index ix
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = ${table.table_name}
        AND n.nspname = ${table.schema_name}
      GROUP BY i.relname, ix.indisunique, ix.indisprimary
      ORDER BY i.relname
    `;

    result.push({
      tableName: table.table_name as string,
      schemaName: table.schema_name as string,
      columns: columns.map((col) => ({
        name: col.name as string,
        type: col.type as string,
        nullable: col.nullable as boolean,
        defaultValue: col.default_value as string | null,
        isPrimaryKey: col.is_primary_key as boolean,
      })),
      primaryKey: (primaryKeyResult[0]?.columns as string[]) || [],
      foreignKeys: foreignKeys.map((fk) => ({
        constraintName: fk.constraint_name as string,
        columns: fk.columns as string[],
        referencedTable: fk.referenced_table as string,
        referencedColumns: fk.referenced_columns as string[],
      })),
      indexes: indexes.map((idx) => ({
        name: idx.name as string,
        columns: idx.columns as string[],
        isUnique: idx.is_unique as boolean,
        isPrimary: idx.is_primary as boolean,
      })),
    });
  }

  return result;
}

export async function listTables(
  connectionUrl: string,
  schemaName: string = "public"
): Promise<string[]> {
  const sql = getConnection({ connectionUrl });

  const tables = await sql`
    SELECT c.relname as table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = ${schemaName}
    ORDER BY c.relname
  `;

  return tables.map((t) => t.table_name as string);
}

export async function closeAllConnections(): Promise<void> {
  for (const [, conn] of connectionPool) {
    await conn.sql.end();
  }
  connectionPool.clear();
}
