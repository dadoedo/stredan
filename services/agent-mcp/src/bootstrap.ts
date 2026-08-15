import { sql } from "./db/client.js";
import { env } from "./env.js";
import { hashPassword } from "./auth/passwords.js";

export async function bootstrapAdmin(): Promise<void> {
  const existing = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM admins`;
  if ((existing[0]?.count ?? 0) > 0) return;

  if (!env.adminPassword) {
    console.warn("No admin user exists and ADMIN_PASSWORD is unset — dashboard login will fail until an admin is created.");
    return;
  }

  const passwordHash = await hashPassword(env.adminPassword);
  await sql`
    INSERT INTO admins (email, password_hash)
    VALUES (${env.adminEmail}, ${passwordHash})
  `;
  console.log(`Bootstrapped admin ${env.adminEmail} (TOTP enrollment required on first login)`);
}
