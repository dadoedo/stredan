import { StatsDashboard } from "@/components/StatsDashboard";
import { WorkExperienceSection } from "@/components/WorkExperienceSection";
import { SiteShell } from "@/components/SiteShell";
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
    <SiteShell locale={locale}>
      <section className="flex min-h-[70vh] flex-col justify-center px-6">
        <div className="agency-shell">
          <p className="agency-section-label">
            {locale === "sk" ? "Osobný profil" : "Personal profile"}
          </p>
          <h1 className="agency-h1 max-w-none">Read, Build, Write</h1>
          <p className="agency-lede max-w-lg">{t.heroSubtitle}</p>
          <nav className="mt-8 flex flex-wrap gap-6" aria-label={t.inPageNav}>
            <a href="#stats" className="agency-btn-ghost">
              {t.stats}
            </a>
            <a href="#work" className="agency-btn-ghost">
              {t.heroLinkProjects}
            </a>
            <a href="/books" className="agency-btn-ghost">
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
    </SiteShell>
  );
}
