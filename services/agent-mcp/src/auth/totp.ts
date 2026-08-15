import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import { decrypt, encrypt } from "../vault.js";
import { sql } from "../db/client.js";

const ISSUER = "mcp.stredan.sk";

export function generateTotpSecret(): { base32: string; uri: string } {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: ISSUER,
    label: "David",
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
    label: "David",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(base32),
  });
  return totp.validate({ token: token.replace(/\s+/g, ""), window: 1 }) !== null;
}

export async function loadAdminTotpSecret(adminId: string): Promise<string | null> {
  const rows = await sql<{ ciphertext: Buffer; nonce: Buffer }[]>`
    SELECT v.ciphertext, v.nonce
    FROM admins a
    JOIN vault_secrets v ON v.id = a.totp_secret_id
    WHERE a.id = ${adminId}
  `;
  if (rows.length === 0) return null;
  return decrypt({ ciphertext: rows[0].ciphertext, nonce: rows[0].nonce });
}

export async function storeAdminTotpSecret(adminId: string, base32: string): Promise<void> {
  const blob = encrypt(base32);
  await sql.begin(async (tx) => {
    const inserted = await tx<{ id: string }[]>`
      INSERT INTO vault_secrets (ciphertext, nonce)
      VALUES (${blob.ciphertext}, ${blob.nonce})
      RETURNING id
    `;
    const old = await tx<{ totp_secret_id: string | null }[]>`
      SELECT totp_secret_id FROM admins WHERE id = ${adminId}
    `;
    await tx`
      UPDATE admins
      SET totp_secret_id = ${inserted[0].id}, totp_enabled = true
      WHERE id = ${adminId}
    `;
    if (old[0]?.totp_secret_id) {
      await tx`DELETE FROM vault_secrets WHERE id = ${old[0].totp_secret_id}`;
    }
  });
}
