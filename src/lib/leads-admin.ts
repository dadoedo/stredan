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
  if (lead.notes?.trim()) return lead.notes.trim();

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

export function buildLeadsQueryString(
  params: Record<string, string | undefined>,
  page?: number,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key !== "page" && value) search.set(key, value);
  }

  if (page && page > 1) search.set("page", String(page));

  const query = search.toString();
  return query ? `?${query}` : "";
}
