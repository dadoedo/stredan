import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/translations";

export type OfferPublic = {
  code: string;
  slug: string;
  name: string;
  oneLiner: string;
  cta: string;
  priceHint: string | null;
  landingPath: string;
};

export async function getActiveOffers(locale: Locale): Promise<OfferPublic[]> {
  const rows = await prisma.offer.findMany({
    where: { status: "active" },
    orderBy: { sortOrder: "asc" },
  });

  return rows.map((o) => ({
    code: o.code,
    slug: o.slug,
    name: locale === "sk" ? o.nameSk : o.nameEn,
    oneLiner: locale === "sk" ? o.oneLinerSk : o.oneLinerEn,
    cta: locale === "sk" ? o.ctaSk : o.ctaEn,
    priceHint: locale === "sk" ? o.priceHintSk : o.priceHintEn,
    landingPath: o.landingPath,
  }));
}

export async function getOfferBySlug(slug: string, locale: Locale) {
  const o = await prisma.offer.findUnique({ where: { slug } });
  if (!o || o.status === "retired") return null;

  return {
    code: o.code,
    slug: o.slug,
    name: locale === "sk" ? o.nameSk : o.nameEn,
    oneLiner: locale === "sk" ? o.oneLinerSk : o.oneLinerEn,
    cta: locale === "sk" ? o.ctaSk : o.ctaEn,
    priceHint: locale === "sk" ? o.priceHintSk : o.priceHintEn,
    icpNotes: locale === "sk" ? o.icpNotesSk : o.icpNotesEn,
    notFor: locale === "sk" ? o.notForSk : o.notForEn,
    landingPath: o.landingPath,
  };
}
