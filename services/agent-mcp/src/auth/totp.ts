import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import { decrypt, encrypt } from "../vault.js";
import { sql } from "../db/client.js";

const ISSUER = "mcp.stredan.sk";

export function generateTotpSecret(accountLabel: string): { base32: string; uri: string } {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: ISSUER,
    label: accountLabel,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  return { base32: secret.base32, uri: totp.toString() };
}

export async function totpQrDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, { margin: 1, width: 220 });
}

export function verifyTotp(base32: string, token: string): boolean {
  const totp = new TOTP({
    issuer: ISSUER,
    label: "user",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(base32),
  });
  return totp.validate({ token: token.replace(/\s+/g, ""), window: 1 }) !== null;
}

export async function loadUserTotpSecret(userId: string): Promise<string | null> {
  const rows = await sql<{ ciphertext: Buffer; nonce: Buffer }[]>`
    SELECT v.ciphertext, v.nonce
    FROM users u
    JOIN vault_secrets v ON v.id = u.totp_secret_id
    WHERE u.id = ${userId}
  `;
  if (rows.length === 0) return null;
  return decrypt({ ciphertext: rows[0].ciphertext, nonce: rows[0].nonce });
}

export async function storeUserTotpSecret(userId: string, base32: string): Promise<void> {
  const blob = encrypt(base32);
  await sql.begin(async (tx) => {
    const inserted = await tx<{ id: string }[]>`
      INSERT INTO vault_secrets (ciphertext, nonce, owner_id)
      VALUES (${blob.ciphertext}, ${blob.nonce}, ${userId})
      RETURNING id
    `;
    const old = await tx<{ totp_secret_id: string | null }[]>`
      SELECT totp_secret_id FROM users WHERE id = ${userId}
    `;
    await tx`
      UPDATE users
      SET totp_secret_id = ${inserted[0].id}, totp_enabled = true
      WHERE id = ${userId}
    `;
    if (old[0]?.totp_secret_id) {
      await tx`DELETE FROM vault_secrets WHERE id = ${old[0].totp_secret_id}`;
    }
  });
}
