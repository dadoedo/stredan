import postgres from "postgres";
import { env } from "../env.js";

export const sql = postgres(env.databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
  onnotice: () => {},
});

export async function closePlatformDb(): Promise<void> {
  await sql.end({ timeout: 5 });
}
