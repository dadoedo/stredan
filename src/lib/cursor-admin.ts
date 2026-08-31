import type { Prisma } from "@/generated/prisma/client";

export const CURSOR_STATUSES = ["found", "not_found", "invalid"] as const;
export type CursorStatus = (typeof CURSOR_STATUSES)[number];

export const CURSOR_STATUS_LABELS: Record<CursorStatus, string> = {
  found: "Nájdené (200)",
  not_found: "Nenájdené (502)",
  invalid: "Neplatné (400)",
};

export function parseCursorStatus(value?: string): CursorStatus | undefined {
  if (value && CURSOR_STATUSES.includes(value as CursorStatus)) {
    return value as CursorStatus;
  }
  return undefined;
}

export function hasActiveCursorFilters(params: {
  q?: string;
  status?: string;
}): boolean {
  return Boolean(params.q || params.status);
}

export function buildCursorQueryString(
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Map stored lastError text to the admin status filters. */
export function classifyCursorLastError(
  lastError: string | null | undefined,
): CursorStatus | "other" {
  if (lastError == null || lastError === "") return "found";
  if (/not found/i.test(lastError)) return "not_found";
  if (/invalid cursor handle/i.test(lastError)) return "invalid";
  return "other";
}

export function buildCursorHandlesWhere(params: {
  q?: string;
  status?: CursorStatus;
}): Prisma.CursorHandleWhereInput {
  const and: Prisma.CursorHandleWhereInput[] = [];

  if (params.q?.trim()) {
    const q = params.q.trim().replace(/^@+/, "");
    and.push({
      OR: [
        { handle: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (params.status === "found") {
    and.push({ lastError: null });
  } else if (params.status === "not_found") {
    and.push({ lastError: { contains: "not found", mode: "insensitive" } });
  } else if (params.status === "invalid") {
    and.push({
      lastError: { contains: "Invalid Cursor handle", mode: "insensitive" },
    });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0];
  return { AND: and };
}
