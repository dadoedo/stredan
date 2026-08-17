import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { StatsDashboard } from "@/components/StatsDashboard";
import { WorkExperienceSection } from "@/components/WorkExperienceSection";
import { prisma } from "@/lib/prisma";
import { getStats } from "@/lib/stats";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/translations";

/** Personal brand / CV — previously the homepage */
export default async function AboutPage() {
  const locale = await getLocale();
  const t = ui[locale];

  const [projects, jobs, stats] = await Promise.all([
    prisma.project.findMany({
      where: { visible: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        technologies: {
          include: { technology: true },
          orderBy: { technology: { sortOrder: "asc" } },
        },
        integrations: {
          include: { integration: true },
          orderBy: { integration: { sortOrder: "asc" } },
        },
        badges: true,
      },
    }),
    prisma.job.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    getStats(),
  ]);

  const featured = projects.filter((p) => p.featured);
  const other = projects.filter(
    (p) => !p.featured && p.category !== "legacy",
  );
  const legacy = projects.filter((p) => p.category === "legacy");

  return (
    <>
      <Header locale={locale} />

      <main id="main-content">
        <section className="flex min-h-[70vh] flex-col justify-center px-6">
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-sm text-muted">
              {locale === "sk" ? "Osobný profil" : "Personal profile"}
            </p>
            <h1 className="mt-3 font-heading text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Read, Build, Write
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted sm:text-xl">
              {t.heroSubtitle}
            </p>
            <nav className="mt-8 flex flex-wrap gap-6" aria-label={t.inPageNav}>
              <a
                href="#stats"
                className="text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
              >
                {t.stats}
              </a>
              <a
                href="#work"
                className="text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
              >
                {t.heroLinkProjects}
              </a>
              <a
                href="/books"
                className="text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
              >
                {t.heroLinkBooks}
              </a>
            </nav>
          </div>
        </section>

        <StatsDashboard stats={stats} locale={locale} />

        <WorkExperienceSection
          locale={locale}
          featured={featured}
          other={other}
          legacy={legacy}
          jobs={jobs}
        />
      </main>

      <Footer locale={locale} />
    </>
  );
}
