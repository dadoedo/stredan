import { createHash, timingSafeEqual } from "crypto";

const ADMIN_COOKIE = "admin_session";
const SALT = "stredan_admin_2025";

export function getAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return "";
  return createHash("sha256").update(password + SALT).digest("hex");
}

export function verifyPassword(password: string): boolean {
  const expected = getAdminToken();
  if (!expected) return false;
  const actual = createHash("sha256").update(password + SALT).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
  } catch {
    return false;
  }
}

export function verifySession(token: string): boolean {
  const expected = getAdminToken();
  if (!expected) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}

export { ADMIN_COOKIE };
