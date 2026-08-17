/**
 * Seed script: Pridá Anderro projekt do stredan databázy.
 * Spusti: DATABASE_URL="..." npx tsx scripts/seed-anderro.ts
 * Pre produkciu: použij DATABASE_URL z produkčného prostredia.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Chýba DATABASE_URL. Spusti: DATABASE_URL='...' npx tsx scripts/seed-anderro.ts");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ANDERRO_SLUG = "anderro";

async function main() {
  const existing = await prisma.project.findUnique({ where: { slug: ANDERRO_SLUG } });
  if (existing) {
    console.log("Anderro už existuje v databáze. Nič sa nemení.");
    return;
  }

  // Technológie a integrácie – použijeme len tie čo existujú
  const techSlugs = ["nextdotjs", "typescript", "postgresql", "tailwindcss"];
  const intSlugs = ["github"]; // Stripe môže byť v integrations

  const technologies = await prisma.technology.findMany({
    where: { slug: { in: techSlugs } },
  });
  const integrations = await prisma.integration.findMany({
    where: { slug: { in: intSlugs } },
  });

  // Skús pridať Stripe ak existuje
  const stripe = await prisma.integration.findUnique({ where: { slug: "stripe" } });
  if (stripe) integrations.push(stripe);

  const project = await prisma.project.create({
    data: {
      slug: ANDERRO_SLUG,
      titleEn: "Anderro",
      titleSk: "Anderro",
      descriptionEn:
        "B2B SaaS platform for affiliate program management. N:N model — one business can have multiple SaaS products, one affiliate can partner with multiple products. Built-in marketplace, real-time tracking, Stripe Connect payouts.",
      descriptionSk:
        "B2B SaaS platforma pre správu affiliate programov. N:N model — jeden business môže mať viacero SaaS produktov, jeden affiliate môže byť partnerom viacerých. Marketplace, real-time tracking, Stripe Connect výplaty.",
      url: "https://anderro.com",
      category: "product",
      year: 2025,
      featured: true,
      visible: true,
      sortOrder: 0,
      logo: "/logos/anderro.png",
      technologies: {
        create: technologies.map((t) => ({ technologyId: t.id })),
      },
      integrations: {
        create: integrations.map((i) => ({ integrationId: i.id })),
      },
      badges: {
        create: [
          { id: randomUUID(), badge: "marketplace" },
        ],
      },
    },
  });

  console.log("✓ Anderro pridaný:", project.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
