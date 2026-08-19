export const SKIP_REASONS = [
  "no_site",
  "no_email",
  "shell",
  "it_internal",
  "bad_ico",
] as const;

export const LEAD_STATUSES = [
  "sourced",
  "enriching",
  "enriched",
  "scored",
  "queued",
  "contacted",
  "replied",
  "meeting",
  "won",
  "lost",
  "suppressed",
  "skipped",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type SkipReason = (typeof SKIP_REASONS)[number];

export const LEAD_SORT_FIELDS = ["updatedAt", "enrich", "score", "send"] as const;
export type LeadSortField = (typeof LEAD_SORT_FIELDS)[number];

export const CONTACT_FILTERS = ["yes", "no"] as const;
export type ContactFilter = (typeof CONTACT_FILTERS)[number];

export type SortDirection = "asc" | "desc";

export const DEFAULT_SORT: LeadSortField = "updatedAt";
export const DEFAULT_SORT_DIR: SortDirection = "desc";

type ContactLike = {
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  phone?: string | null;
};

type EnrichmentLike = {
  kind: string;
  outputJson: unknown;
};

export function formatContact(contact: ContactLike | undefined | null): string {
  if (!contact) return "—";

  const parts: string[] = [];
  if (contact.fullName) parts.push(contact.fullName);
  if (contact.email) parts.push(contact.email);
  else if (contact.phone) parts.push(contact.phone);
  if (contact.role) parts.push(`(${contact.role})`);

  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function extractSkipReason(lead: {
  notes?: string | null;
  enrichments?: EnrichmentLike[];
}): string | null {
  const notes = lead.notes?.trim();
  if (notes && SKIP_REASONS.includes(notes as SkipReason)) return notes;

  const website = lead.enrichments?.find((row) => row.kind === "website");
  if (
    website?.outputJson &&
    typeof website.outputJson === "object" &&
    website.outputJson !== null
  ) {
    const skip = (website.outputJson as Record<string, unknown>).skip_reason;
    if (typeof skip === "string" && skip.trim()) return skip.trim();
  }

  return null;
}

export function clampPage(page: number, total: number, pageSize: number): number {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(1, page), totalPages);
}

export function buildLeadsQueryString(
  params: Record<string, string | undefined>,
  page?: number,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    if (key === "sort" && value === DEFAULT_SORT) continue;
    if (key === "dir" && value === DEFAULT_SORT_DIR) continue;
    if (value) search.set(key, value);
  }

  if (page && page > 1) search.set("page", String(page));

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function parseSortField(value?: string): LeadSortField {
  if (value && LEAD_SORT_FIELDS.includes(value as LeadSortField)) {
    return value as LeadSortField;
  }
  return DEFAULT_SORT;
}

export function parseSortDirection(value?: string): SortDirection {
  return value === "asc" ? "asc" : DEFAULT_SORT_DIR;
}

export function parseContactFilter(value?: string): ContactFilter | undefined {
  if (value && CONTACT_FILTERS.includes(value as ContactFilter)) {
    return value as ContactFilter;
  }
  return undefined;
}

export function sortLinkDir(
  currentSort: LeadSortField,
  currentDir: SortDirection,
  clickedSort: LeadSortField,
): SortDirection {
  if (currentSort === clickedSort) {
    return currentDir === "desc" ? "asc" : "desc";
  }
  return "desc";
}

export function buildLeadsOrderBy(
  sort: LeadSortField,
  dir: SortDirection,
): Record<string, unknown> {
  switch (sort) {
    case "enrich":
      return { enrichments: { _count: dir } };
    case "score":
      return { scores: { _count: dir } };
    case "send":
      return { touches: { _count: dir } };
    case "updatedAt":
    default:
      return { updatedAt: dir };
  }
}

export function hasActiveFilters(params: Record<string, string | undefined>): boolean {
  return Boolean(
    params.q ||
      params.status ||
      params.skip ||
      params.contact ||
      (params.sort && params.sort !== DEFAULT_SORT) ||
      (params.dir && params.dir !== DEFAULT_SORT_DIR),
  );
}
