import { sql } from "./db/client.js";
import { env } from "./env.js";
import { hashPassword } from "./auth/passwords.js";

export async function bootstrapAdmin(): Promise<void> {
  const existing = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM users`;
  if ((existing[0]?.count ?? 0) > 0) {
    await sql`
      UPDATE users SET role = 'superadmin'
      WHERE lower(email) = ${env.adminEmail} AND role <> 'superadmin'
    `;
    return;
  }

  if (!env.adminPassword) {
    console.warn(
      "No user exists and ADMIN_PASSWORD is unset — dashboard login will fail until a superadmin is created."
    );
    return;
  }

  const passwordHash = await hashPassword(env.adminPassword);
  await sql`
    INSERT INTO users (email, password_hash, role)
    VALUES (${env.adminEmail}, ${passwordHash}, 'superadmin')
  `;
  console.log(`Bootstrapped superadmin ${env.adminEmail} (TOTP enrollment required on first login)`);
}
