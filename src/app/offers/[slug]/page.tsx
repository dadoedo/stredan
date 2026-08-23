import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { AgencyEmailButton } from "@/components/AgencyEmailButton";
import { BookingCallButton } from "@/components/BookingCallButton";
import { EngagementModels } from "@/components/EngagementModels";
import { OfferViewTracker } from "@/components/OfferViewTracker";
import { getLocale } from "@/lib/locale";
import { getOfferBySlug } from "@/lib/offers";

const STATIC_FALLBACK: Record<
  string,
  {
    code: string;
    nameSk: string;
    nameEn: string;
    oneLinerSk: string;
    oneLinerEn: string;
    ctaSk: string;
    ctaEn: string;
    priceHintSk: string;
    priceHintEn: string;
    icpNotesSk: string;
    icpNotesEn: string;
    notForSk: string;
    notForEn: string;
  }
> = {
  "ai-audit": {
    code: "A",
    nameSk: "AI Opportunity Audit",
    nameEn: "AI Opportunity Audit",
    oneLinerSk:
      "Za 14 dní zmapujeme vaše procesy a dostanete písomný plán: čo automatizovať AI, v akom poradí a za aký budget.",
    oneLinerEn:
      "In 14 days we map your workflows and deliver a written plan: what to automate with AI, in what order, and for what budget.",
    ctaSk: "Objednať AI audit",
    ctaEn: "Book an AI audit",
    priceHintSk: "od 990 € (fix)",
    priceHintEn: "from €990 (fixed)",
    icpNotesSk: "10–80 ľudí, B2B/služby",
    icpNotesEn: "10–80 people, B2B/services",
    notForSk: "Len ChatGPT školenie",
    notForEn: "ChatGPT training only",
  },
  "pilot-agent": {
    code: "B",
    nameSk: "Pilot AI Agent",
    nameEn: "Pilot AI Agent",
    oneLinerSk:
      "Nasadíme jedného produkčného AI agenta na konkrétny workflow. Beží do 4–6 týždňov.",
    oneLinerEn:
      "We ship one production AI agent for a single workflow. Live in 4–6 weeks.",
    ctaSk: "Spustiť pilot agenta",
    ctaEn: "Start a pilot agent",
    priceHintSk: "4 900–9 900 € + prevádzka",
    priceHintEn: "€4,900–€9,900 + operate",
    icpNotesSk: "Opakovaný proces ≥10×/týždeň",
    icpNotesEn: "Repeat process ≥10×/week",
    notForSk: "AI všade bez use-casu",
    notForEn: "AI everywhere, no use case",
  },
  "shadow-ai": {
    code: "C",
    nameSk: "Firemné AI pod kontrolou",
    nameEn: "Company AI under control",
    oneLinerSk:
      "Nastavíme firemné AI s pravidlami a napojením na vaše dokumenty. Bez úniku dát.",
    oneLinerEn:
      "Company AI with rules and your documents, without data leaks.",
    ctaSk: "Zabezpečiť firemné AI",
    ctaEn: "Secure company AI",
    priceHintSk: "od 2 900 € setup",
    priceHintEn: "from €2,900 setup",
    icpNotesSk: "Citlivé dáta / shadow AI",
    icpNotesEn: "Sensitive data / shadow AI",
    notForSk: "Bez digitálnej stopy",
    notForEn: "No digital footprint",
  },
  "ai-integration": {
    code: "D",
    nameSk: "AI do existujúcich systémov",
    nameEn: "AI into existing systems",
    oneLinerSk:
      "Napojíme AI na váš CRM, ERP a maily. Bez nového softvéru navyše.",
    oneLinerEn:
      "Wire AI into your CRM, ERP and email. No extra software stack.",
    ctaSk: "Napojiť AI",
    ctaEn: "Connect AI",
    priceHintSk: "podľa integrácií",
    priceHintEn: "depends on integrations",
    icpNotesSk: "Už majú systémy, bolí manuál",
    icpNotesEn: "Have systems, manual pain",
    notForSk: "Greenfield od nuly",
    notForEn: "Greenfield from scratch",
  },
  "custom-ai-app": {
    code: "E",
    nameSk: "Custom AI aplikácia",
    nameEn: "Custom AI application",
    oneLinerSk:
      "Vlastný systém s AI vnútri: CRM, portál alebo vyhodnocovanie dát.",
    oneLinerEn:
      "Custom system with AI inside: CRM, portal, or data evaluation.",
    ctaSk: "Konzultácia",
    ctaEn: "Book a consult",
    priceHintSk: "od 12 000 €",
    priceHintEn: "from €12,000",
    icpNotesSk: "Warm / budget + owner",
    icpNotesEn: "Warm / budget + owner",
    notForSk: "Primárny cold CTA",
    notForEn: "Primary cold CTA",
  },
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(STATIC_FALLBACK).map((slug) => ({ slug }));
}

export default async function OfferLandingPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const isSk = locale === "sk";

  let offer = null as Awaited<ReturnType<typeof getOfferBySlug>>;
  try {
    offer = await getOfferBySlug(slug, locale);
  } catch {
    offer = null;
  }

  const fb = STATIC_FALLBACK[slug];
  if (!offer && !fb) notFound();

  const view = offer ?? {
    code: fb!.code,
    slug,
    name: isSk ? fb!.nameSk : fb!.nameEn,
    oneLiner: isSk ? fb!.oneLinerSk : fb!.oneLinerEn,
    cta: isSk ? fb!.ctaSk : fb!.ctaEn,
    priceHint: isSk ? fb!.priceHintSk : fb!.priceHintEn,
    icpNotes: isSk ? fb!.icpNotesSk : fb!.icpNotesEn,
    notFor: isSk ? fb!.notForSk : fb!.notForEn,
    landingPath: `/offers/${slug}`,
  };

  const mailSubject = encodeURIComponent(`${view.name} (${view.code})`);
  const mailHref = `mailto:david@stredan.sk?subject=${mailSubject}`;

  return (
    <SiteShell locale={locale}>
      <OfferViewTracker slug={slug} code={view.code} name={view.name} />
      <div className="agency-shell py-24">
          <Link
            href="/#offers"
            className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            ← {isSk ? "Všetky ponuky" : "All offers"}
          </Link>
          <p className="mt-8 text-sm text-muted">
            {isSk ? "Ponuka" : "Offer"} {view.code}
          </p>
          <h1 className="agency-h2 max-w-none sm:text-5xl">{view.name}</h1>
          <p className="agency-lede">{view.oneLiner}</p>
          <EngagementModels locale={locale} variant="offer" />

          <div className="agency-cta-row">
            <AgencyEmailButton
              href={mailHref}
              eventProps={{
                location: "offer",
                method: "email",
                offer: slug,
              }}
            >
              {view.cta}
            </AgencyEmailButton>
            <BookingCallButton
              label={isSk ? "Rezervovať schôdzku" : "Book a call"}
              campaign={`offer-${slug}`}
              eventProps={{
                location: "offer",
                method: "booking",
                offer: slug,
              }}
            />
            <Link href="/about" className="agency-btn-secondary">
              {isSk ? "Kto to stavia" : "Who builds this"}
            </Link>
          </div>

          <dl className="mt-16 space-y-8 border-t border-border pt-10">
            {view.icpNotes && (
              <div>
                <dt className="text-sm text-muted">
                  {isSk ? "Pre koho" : "Best for"}
                </dt>
                <dd className="mt-2">{view.icpNotes}</dd>
              </div>
            )}
            {view.notFor && (
              <div>
                <dt className="text-sm text-muted">
                  {isSk ? "Nie je pre" : "Not for"}
                </dt>
                <dd className="mt-2 text-muted">{view.notFor}</dd>
              </div>
            )}
          </dl>
        </div>
    </SiteShell>
  );
}
