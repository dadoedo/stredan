import { cookies } from "next/headers";
import type { Locale } from "./translations";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (locale === "en" || locale === "sk") return locale;
  return "sk";
}
