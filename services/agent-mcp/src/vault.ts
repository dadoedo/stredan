import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "./env.js";

const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

function masterKey(): Buffer {
  const raw = env.masterEncryptionKey.trim();
  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, "hex");
  } else {
    key = Buffer.from(raw, "base64");
  }
  if (key.length !== KEY_BYTES) {
    throw new Error("MASTER_ENCRYPTION_KEY must be 32 bytes (64 hex chars or base64)");
  }
  return key;
}

export interface EncryptedBlob {
  ciphertext: Buffer;
  nonce: Buffer;
}

export function encrypt(plaintext: string): EncryptedBlob {
  const nonce = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: Buffer.concat([encrypted, tag]), nonce };
}

export function decrypt(blob: EncryptedBlob): string {
  if (blob.ciphertext.length < TAG_BYTES) {
    throw new Error("Invalid ciphertext");
  }
  const data = blob.ciphertext.subarray(0, blob.ciphertext.length - TAG_BYTES);
  const tag = blob.ciphertext.subarray(blob.ciphertext.length - TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), blob.nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function secretHint(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "••••";
  return `••••${trimmed.slice(-4)}`;
}
