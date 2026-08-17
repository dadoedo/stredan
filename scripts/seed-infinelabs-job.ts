/**
 * Seed script: Pridá / aktualizuje Infinee Labs v sekcii Experience.
 * Spusti: npx tsx scripts/seed-infinelabs-job.ts
 * (vyžaduje DATABASE_URL v .env a SSH tunel na stredan-db, port 5457)
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "Chýba DATABASE_URL. Spusti: npx tsx scripts/seed-infinelabs-job.ts",
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SLUG = "infinelabs";

const descriptionEn = `Co-founded Infinee Labs with Rene Remsik in September 2025. I own the entire technical side — architecture, development, DevOps, security, plus customer calls and onboarding. Rene leads product, marketing, and growth.

In 8 months we shipped four products to ~43,000 registered users and ~350 active paying subscribers across B2C mobile, content-creator SaaS, and a B2B affiliate marketplace.

Anderro is a B2B affiliate marketplace with an N-to-N model — businesses publish SaaS products, creators partner with many products. A separate Fastify tracking microservice runs on BullMQ + Redis, Stripe Connect handles payouts, every state change is audit-logged. Layered on top is a fully agentic cold-outreach pipeline: scraping → Perplexity enrichment → Claude-drafted personalized emails → Resend delivery → automated follow-up playbooks. Currently the fastest-growing product in the portfolio.

SkySnail is an AI thumbnail generator for YouTube, TikTok, and Instagram. Monorepo with Next.js, Express, and a Python FastAPI service for transcription and YouTube downloads. 20k+ users, 5,700+ thumbnails generated. The hardest call was redesigning the free-trial flow once a flood of free users broke our unit economics — we moved to card-on-file at signup.

ViralSky is a SaaS for content creators with a multi-AI provider abstraction (users pick provider and model) and Perplexity integration for real-time topic research. 19k+ users.

Foodient is an AI food and allergen scanner for iOS and Android (React Native). Multi-provider AI (Claude, GPT, Gemini, xAI), Open Food Facts, Apple and Google IAP, full App Store and Play release pipeline.

Stack across the portfolio: TypeScript, Next.js App Router, Node.js (Express, Fastify), Python (FastAPI), React Native, PostgreSQL, Redis + BullMQ, Stripe and Stripe Connect. Self-hosted on Hetzner with Docker and Caddy.

How four products are possible solo on the technical side: detailed specs → architecture decisions → research → prototype → phased delivery. Code is written by AI agents (Cursor, Claude Code, custom MCPs) under my senior review. I make every architectural call, set the standards, run code review, and stay close enough to drop into any service when something breaks. The leverage is in removing the bottleneck on typing — not on judgment.`;

const descriptionSk = `Spolu s Rene Remsikom sme v septembri 2025 založili Infinee Labs. Mám na starosti celú technickú stránku — architektúra, vývoj, DevOps, security, plus zákaznícke cally a onboarding. Rene vedie produkt, marketing a rast.

Za 8 mesiacov sme spustili štyri produkty — ~43 000 registrovaných userov a ~350 aktívnych platiacich naprieč B2C mobile appkou, SaaS-mi pre content creatorov a B2B affiliate marketplace.

Anderro je B2B affiliate marketplace s N:N modelom — businessy publikujú SaaS produkty, creatori môžu byť partnermi viacerých z nich. Samostatný tracking microservice vo Fastify beží na BullMQ + Redis, Stripe Connect rieši výplaty, každá zmena stavu má audit log. Nad tým beží plne agentic pipeline pre cold outreach: scraping → Perplexity enrichment → personalizované emaily draftované Claudom → Resend → automatizované follow-up playbooky. Aktuálne najrýchlejšie rastúci produkt v portfóliu.

SkySnail je AI generátor thumbnailov pre YouTube, TikTok a Instagram. Monorepo s Next.js, Express a Python FastAPI službou na transkripciu a sťahovanie z YouTube. 20k+ userov, 5 700+ vygenerovaných thumbnailov. Najťažšie rozhodnutie bolo predizajnovanie free trialu — keď nás zaplavili free useri a unit economics sa rozbila, prešli sme na card-on-file pri signupe.

ViralSky je SaaS pre content creatorov s multi-AI abstrakciou (user si vyberá providera aj model) a Perplexity integráciou pre real-time research aktuálnych tém. 19k+ userov.

Foodient je AI scanner jedál a alergénov pre iOS a Android (React Native). Multi-provider AI (Claude, GPT, Gemini, xAI), Open Food Facts, Apple a Google IAP, kompletný release pipeline na App Store a Play.

Stack naprieč portfóliom: TypeScript, Next.js App Router, Node.js (Express, Fastify), Python (FastAPI), React Native, PostgreSQL, Redis + BullMQ, Stripe a Stripe Connect. Self-hosted na Hetzneri cez Docker a Caddy.

Ako sa dajú robiť štyri produkty technicky sólo: detailné špecifikácie → architektonické rozhodnutia → research → prototyp → fázový vývoj. Kód píšu AI agenti (Cursor, Claude Code, vlastné MCPs) pod mojou senior kontrolou. Robím všetky architektonické rozhodnutia, definujem štandardy, robím code review a stále som dosť blízko kódu, aby som vedel rýchlo zasiahnuť do ktorejkoľvek služby. Páka je v odstránení bottlenecku na klepkaní — nie na úsudku.`;

const jobData = {
  companyEn: "Infinee Labs",
  companySk: "Infinee Labs",
  positionEn: "CTO & Co-founder",
  positionSk: "CTO & spoluzakladateľ",
  descriptionEn,
  descriptionSk,
  startYear: 2025,
  endYear: null as number | null,
  current: true,
  sortOrder: 0,
};

async function main() {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.job.findUnique({ where: { slug: SLUG } });
    if (!existing) {
      await tx.job.updateMany({ data: { sortOrder: { increment: 1 } } });
    }
    await tx.job.upsert({
      where: { slug: SLUG },
      create: { slug: SLUG, ...jobData },
      update: jobData,
    });
  });

  console.log("✓ Infinee Labs (Experience) uložené, slug:", SLUG);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
