import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "./client.js";

const here = dirname(fileURLToPath(import.meta.url));

function schemaPath(): string {
  const candidates = [
    join(here, "schema.sql"),
    join(here, "../../src/db/schema.sql"),
    join(process.cwd(), "src/db/schema.sql"),
    join(process.cwd(), "dist/db/schema.sql"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  throw new Error(`schema.sql not found. Tried: ${candidates.join(", ")}`);
}

export async function migrate(): Promise<void> {
  const schema = readFileSync(schemaPath(), "utf8");
  await sql.unsafe(schema);
}
