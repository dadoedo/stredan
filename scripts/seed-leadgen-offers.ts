/**
 * Seed A–E offers, cold-1 templates (content only), and send accounts 1–5.
 * Run: npx tsx scripts/seed-leadgen-offers.ts
 * Requires: prisma db push (leadgen models) + DATABASE_URL
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const offers = [
  {
    code: "A",
    slug: "ai-audit",
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
    icpNotesSk: "10–80 ľudí, B2B/služby, chaos v admin/obchode",
    icpNotesEn: "10–80 people, B2B/services, admin/sales chaos",
    notForSk: "Solo živnosť; len ChatGPT školenie",
    notForEn: "Solo freelancers; ChatGPT training only",
    landingPath: "/offers/ai-audit",
    sortOrder: 1,
    subject: "Jeden proces vo {{company}}, nie workshop",
    body: `{{salutation}}

väčšina firiem už verejné AI skúša. Málokto vie, ktorý proces sa oplatí dať do prevádzky ako prvý.

{{hook}}

Pre {{company}} viem za 14 dní spísať krátky plán: tri procesy, poradie, čo kúpiť a čo nestavať. Fixná cena, písomne.

Ak to nie je téma, stačí jedno „nie“. Ak áno, odpíšte „audit“ a pošlem, ako to prebieha.

Dávid Stredánsky
https://stredan.sk/offers/ai-audit`,
  },
  {
    code: "B",
    slug: "pilot-agent",
    nameSk: "Pilot AI Agent",
    nameEn: "Pilot AI Agent",
    oneLinerSk:
      "Nasadíme jedného AI agenta na konkrétny proces. V prevádzke do 4–6 týždňov.",
    oneLinerEn:
      "We ship one production AI agent for a single workflow. Live in 4–6 weeks.",
    ctaSk: "Spustiť pilot agenta",
    ctaEn: "Start a pilot agent",
    priceHintSk: "4 900–9 900 € + prevádzka",
    priceHintEn: "€4,900–€9,900 + operate",
    icpNotesSk: "Opakovaný proces ≥10×/týždeň, CRM/email/tickety",
    icpNotesEn: "Repeat process ≥10×/week, CRM/email/tickets",
    notForSk: "AI všade bez jedného use-casu",
    notForEn: "AI everywhere with no single use case",
    landingPath: "/offers/pilot-agent",
    sortOrder: 2,
    subject: "Jeden agent vo {{company}}, nie prezentácia",
    body: `{{salutation}}

neposielam workshop. Ide o jedného agenta na jeden opakovaný proces: maily, doklady, dopyty alebo podpora.

{{hook}}

Cieľ je prevádzka za 4 až 6 týždňov, nie slidy. Ak vo {{company}} taký proces máte, odpíšte jedným slovom, ktorý to je. Ak nie, dajte „nie“ a už vás nebudem ťahať.

Dávid Stredánsky
https://stredan.sk/offers/pilot-agent`,
  },
  {
    code: "C",
    slug: "shadow-ai",
    nameSk: "Firemné AI pod kontrolou",
    nameEn: "Company AI under control",
    oneLinerSk:
      "Nastavíme firemné AI s pravidlami a napojením na vaše dokumenty. Bez úniku dát do verejných nástrojov.",
    oneLinerEn:
      "We set up company AI with rules and your documents, without leaking data into public ChatGPT.",
    ctaSk: "Zabezpečiť firemné AI",
    ctaEn: "Secure company AI",
    priceHintSk: "od 2 900 € setup",
    priceHintEn: "from €2,900 setup",
    icpNotesSk: "Citlivé dáta, shadow AI riziko",
    icpNotesEn: "Sensitive data, shadow AI risk",
    notForSk: "Bez digitálnej stopy",
    notForEn: "No digital footprint",
    landingPath: "/offers/shadow-ai",
    sortOrder: 3,
    subject: "Firemné AI, nie súkromné účty",
    body: `{{salutation}}

ľudia už verejné AI používajú. Často so zmluvami, faktúrami alebo spismi, bez pravidiel a bez stopy, čo odišlo von.

{{hook}}

Pre {{company}} vieme nastaviť firemné AI: vaše dokumenty, prístupy, logy, jasné čo smie a čo nesmie.

Ak to riešite, odpíšte „áno“. Ak nie, stačí „nie“.

Dávid Stredánsky
https://stredan.sk/offers/shadow-ai`,
  },
  {
    code: "D",
    slug: "ai-integration",
    nameSk: "AI do existujúcich systémov",
    nameEn: "AI into existing systems",
    oneLinerSk:
      "Napojíme AI na váš CRM, ERP a e-maily: triedenie, návrhy, reporty. Bez ďalšieho softvéru navyše.",
    oneLinerEn:
      "We wire AI into your CRM, ERP and email: classification, drafts, triage, reports. No extra software stack.",
    ctaSk: "Napojiť AI na naše systémy",
    ctaEn: "Connect AI to our systems",
    priceHintSk: "podľa integrácií",
    priceHintEn: "depends on integrations",
    icpNotesSk: "Majú ERP/CRM, bolí manuál",
    icpNotesEn: "Have ERP/CRM, manual pain",
    notForSk: "Greenfield od nuly",
    notForEn: "Greenfield from scratch",
    landingPath: "/offers/ai-integration",
    sortOrder: 4,
    subject: "AI do toho, čo už {{company}} má",
    body: `{{salutation}}

nový softvér väčšinou netreba. Treba, aby to, čo už beží, prestalo žrať ruky.

{{hook}}

Typicky: triáž mailov, drafty, doklady do Pohody alebo report z dát, ktoré už máte.

Má {{company}} jeden systém, kde by to hneď uľavilo? Odpíšte ním. Alebo „nie“.

Dávid Stredánsky
https://stredan.sk/offers/ai-integration`,
  },
  {
    code: "E",
    slug: "custom-ai-app",
    nameSk: "Vlastná AI aplikácia",
    nameEn: "Custom AI application",
    oneLinerSk:
      "Vlastný systém s AI vnútri: CRM, portál alebo vyhodnocovanie dát na mieru procesov.",
    oneLinerEn:
      "A custom system with AI inside: CRM, portal, or data evaluation built around your processes.",
    ctaSk: "Konzultácia na riešenie na mieru",
    ctaEn: "Custom solution consult",
    priceHintSk: "od 12 000 €",
    priceHintEn: "from €12,000",
    icpNotesSk: "Warm / budget + owner",
    icpNotesEn: "Warm / budget + owner",
    notForSk: "Primárny cold CTA",
    notForEn: "Primary cold CTA",
    landingPath: "/offers/custom-ai-app",
    sortOrder: 5,
    subject: "Vlastný systém? Len ak to má zmysel",
    body: `{{salutation}}

ak hotové nástroje nestačia, staviam systém okolo vášho procesu. Nie naopak.

Najprv treba vedieť, čo sa má pohnúť v číslach. Ak to viete pomenovať, navrhnem, či to stavať, kúpiť, alebo nechať tak.

Dávid Stredánsky
https://stredan.sk/offers/custom-ai-app`,
  },
] as const;

const sendAccounts = [
  { code: "1", name: "Mailbox 1", channel: "gmail" as const, dailyCap: 8, notes: "Fill mcpAccountKey after adding mailbox on mcp.stredan.sk" },
  { code: "2", name: "Mailbox 2", channel: "resend" as const, dailyCap: 8, notes: null },
  { code: "3", name: "Mailbox 3", channel: "gmail" as const, dailyCap: 8, notes: null },
  { code: "4", name: "Mailbox 4", channel: "smtp" as const, dailyCap: 8, notes: null },
  { code: "5", name: "Mailbox 5", channel: "resend" as const, dailyCap: 8, notes: null },
];

async function main() {
  for (const account of sendAccounts) {
    await prisma.sendAccount.upsert({
      where: { code: account.code },
      create: {
        code: account.code,
        name: account.name,
        channel: account.channel,
        dailyCap: account.dailyCap,
        active: false,
        notes: account.notes,
      },
      update: {
        name: account.name,
        channel: account.channel,
        dailyCap: account.dailyCap,
        notes: account.notes,
      },
    });
    console.log(`SendAccount ${account.code} ready`);
  }

  for (const o of offers) {
    const offer = await prisma.offer.upsert({
      where: { code: o.code },
      create: {
        code: o.code,
        slug: o.slug,
        nameSk: o.nameSk,
        nameEn: o.nameEn,
        oneLinerSk: o.oneLinerSk,
        oneLinerEn: o.oneLinerEn,
        ctaSk: o.ctaSk,
        ctaEn: o.ctaEn,
        priceHintSk: o.priceHintSk,
        priceHintEn: o.priceHintEn,
        icpNotesSk: o.icpNotesSk,
        icpNotesEn: o.icpNotesEn,
        notForSk: o.notForSk,
        notForEn: o.notForEn,
        landingPath: o.landingPath,
        status: "active",
        sortOrder: o.sortOrder,
      },
      update: {
        slug: o.slug,
        nameSk: o.nameSk,
        nameEn: o.nameEn,
        oneLinerSk: o.oneLinerSk,
        oneLinerEn: o.oneLinerEn,
        ctaSk: o.ctaSk,
        ctaEn: o.ctaEn,
        priceHintSk: o.priceHintSk,
        priceHintEn: o.priceHintEn,
        icpNotesSk: o.icpNotesSk,
        icpNotesEn: o.icpNotesEn,
        notForSk: o.notForSk,
        notForEn: o.notForEn,
        landingPath: o.landingPath,
        status: "active",
        sortOrder: o.sortOrder,
      },
    });

    const existing = await prisma.emailTemplate.findFirst({
      where: {
        offerId: offer.id,
        key: "cold-1",
        locale: "sk",
        version: 1,
      },
    });

    if (existing) {
      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: { subject: o.subject, bodyText: o.body, active: o.code !== "E" },
      });
    } else {
      await prisma.emailTemplate.create({
        data: {
          offerId: offer.id,
          key: "cold-1",
          locale: "sk",
          subject: o.subject,
          bodyText: o.body,
          version: 1,
          active: o.code !== "E",
        },
      });
    }

    console.log(`Offer ${o.code} (${o.slug}) ready`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
