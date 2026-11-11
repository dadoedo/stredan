import type { Locale } from "@/lib/translations";

/**
 * First visit on stredan.sk.
 * Slovak and Czech land on Slovak. A higher-priority English preference lands
 * on English. An empty or unknown header stays on Slovak.
 * A saved SK/EN choice always wins, so the language switch stays put.
 */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale {
  if (!header?.trim()) return "sk";

  let slovak = 0;
  let english = 0;

  for (const part of header.split(",")) {
    const [tagRaw, ...params] = part.trim().split(";");
    if (!tagRaw || tagRaw === "*") continue;

    let quality = 1;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key === "q") {
        const parsed = Number(value);
        quality = Number.isFinite(parsed) ? parsed : 0;
      }
    }
    if (quality <= 0) continue;

    const primary = tagRaw.toLowerCase().split("-")[0];
    if (primary === "sk" || primary === "cs" || primary === "cz") {
      slovak = Math.max(slovak, quality);
    } else if (primary === "en") {
      english = Math.max(english, quality);
    }
  }

  if (slovak > 0 && slovak >= english) return "sk";
  if (english > slovak) return "en";
  return "sk";
}

export function resolveRequestLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (cookieValue === "sk" || cookieValue === "en") return cookieValue;
  return localeFromAcceptLanguage(acceptLanguage);
}
