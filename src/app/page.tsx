import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AgencyHome } from "@/components/AgencyHome";
import { getLocale } from "@/lib/locale";
import { getActiveOffers, type OfferPublic } from "@/lib/offers";

const FALLBACK_SK: OfferPublic[] = [
  {
    code: "A",
    slug: "ai-audit",
    name: "AI Opportunity Audit",
    oneLiner:
      "Za 14 dní zmapujeme procesy a dostanete plán: čo stavať, kúpiť, alebo vynechať.",
    cta: "Objednať AI audit",
    priceHint: "od 990 €",
    landingPath: "/offers/ai-audit",
  },
  {
    code: "B",
    slug: "pilot-agent",
    name: "Pilot AI Agent",
    oneLiner:
      "Jeden agent na konkrétny proces. V prevádzke do 4–6 týždňov.",
    cta: "Spustiť pilot",
    priceHint: "od 4 900 €",
    landingPath: "/offers/pilot-agent",
  },
  {
    code: "C",
    slug: "shadow-ai",
    name: "Firemné AI pod kontrolou",
    oneLiner:
      "AI s pravidlami a vašimi dátami, nie nekontrolovaný ChatGPT v prehliadači.",
    cta: "Zabezpečiť AI",
    priceHint: "od 2 900 €",
    landingPath: "/offers/shadow-ai",
  },
  {
    code: "D",
    slug: "ai-integration",
    name: "AI do existujúcich systémov",
    oneLiner: "Napojenie AI na CRM, ERP a e-maily. Bez ďalšieho softvéru navyše.",
    cta: "Napojiť AI",
    priceHint: "podľa integrácií",
    landingPath: "/offers/ai-integration",
  },
  {
    code: "E",
    slug: "custom-ai-app",
    name: "Vlastná AI aplikácia",
    oneLiner: "Vlastný systém s AI vnútri: CRM, portál, vyhodnocovanie dát.",
    cta: "Konzultácia",
    priceHint: "od 12 000 €",
    landingPath: "/offers/custom-ai-app",
  },
];

const FALLBACK_EN: OfferPublic[] = [
  {
    code: "A",
    slug: "ai-audit",
    name: "AI Opportunity Audit",
    oneLiner: "In 14 days: a written plan for what to build, buy, or skip.",
    cta: "Book an AI audit",
    priceHint: "from €990",
    landingPath: "/offers/ai-audit",
  },
  {
    code: "B",
    slug: "pilot-agent",
    name: "Pilot AI Agent",
    oneLiner: "One production agent for one workflow. Live in 4–6 weeks.",
    cta: "Start a pilot",
    priceHint: "from €4,900",
    landingPath: "/offers/pilot-agent",
  },
  {
    code: "C",
    slug: "shadow-ai",
    name: "Company AI under control",
    oneLiner: "AI with rules and your data, not uncontrolled ChatGPT.",
    cta: "Secure company AI",
    priceHint: "from €2,900",
    landingPath: "/offers/shadow-ai",
  },
  {
    code: "D",
    slug: "ai-integration",
    name: "AI into existing systems",
    oneLiner: "Wire AI into CRM, ERP and email. No extra software stack.",
    cta: "Connect AI",
    priceHint: "depends on integrations",
    landingPath: "/offers/ai-integration",
  },
  {
    code: "E",
    slug: "custom-ai-app",
    name: "Custom AI application",
    oneLiner: "A custom system with AI inside: CRM, portal, data evaluation.",
    cta: "Book a consult",
    priceHint: "from €12,000",
    landingPath: "/offers/custom-ai-app",
  },
];

export default async function AgencyHomePage() {
  const locale = await getLocale();

  let offers: OfferPublic[] = locale === "sk" ? FALLBACK_SK : FALLBACK_EN;
  try {
    const fromDb = await getActiveOffers(locale);
    if (fromDb.length > 0) offers = fromDb;
  } catch {
    // keep fallback
  }

  return (
    <div className="agency-page">
      <Header locale={locale} variant="agency" />
      <main id="main-content">
        <AgencyHome locale={locale} offers={offers} />
      </main>
      <Footer locale={locale} variant="agency" />
    </div>
  );
}
