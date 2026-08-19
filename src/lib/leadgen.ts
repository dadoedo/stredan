export const SKIP_REASONS = [
  "no_site",
  "no_email",
  "shell",
  "it_internal",
  "bad_ico",
] as const;

export type SkipReason = (typeof SKIP_REASONS)[number];

const SKIP_RE = /skip_reason=([a-z_]+)/i;

export function parseSkipReason(
  skipReason: string | null | undefined,
  notes?: string | null,
): SkipReason | null {
  if (skipReason && SKIP_REASONS.includes(skipReason as SkipReason)) {
    return skipReason as SkipReason;
  }
  const match = notes?.match(SKIP_RE);
  const fromNotes = match?.[1]?.toLowerCase();
  if (fromNotes && SKIP_REASONS.includes(fromNotes as SkipReason)) {
    return fromNotes as SkipReason;
  }
  return null;
}

export function skipReasonLabel(reason: SkipReason): string {
  switch (reason) {
    case "no_site":
      return "bez webu";
    case "no_email":
      return "bez emailu";
    case "shell":
      return "shell";
    case "it_internal":
      return "IT / interné";
    case "bad_ico":
      return "zlé IČO";
  }
}
