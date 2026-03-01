import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ExternalLinkIcon } from "@/components/ExternalLinkIcon";
import { LinkifyText } from "@/components/LinkifyText";
import { TagBadge } from "@/components/TagBadge";
import { StatsDashboard } from "@/components/StatsDashboard";
import { prisma } from "@/lib/prisma";
import { getStats } from "@/lib/stats";
import { getLocale } from "@/lib/locale";
import { ui, type Locale } from "@/lib/translations";
import Link from "next/link";

export default async function Home() {
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

      <main>
        {/* Hero */}
        <section className="flex min-h-screen flex-col justify-center px-6">
          <div className="mx-auto w-full max-w-5xl">
            <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              Read, Build, Write
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted sm:text-xl">
              {t.heroSubtitle}
            </p>
            <nav className="mt-8 flex flex-wrap gap-6">
              <a
                href="#stats"
                className="text-muted transition-colors hover:text-foreground"
              >
                {t.stats}
              </a>
              <a
                href="#work"
                className="text-muted transition-colors hover:text-foreground"
              >
                {t.heroLinkProjects}
              </a>
              <a
                href="/books"
                className="text-muted transition-colors hover:text-foreground"
              >
                {t.heroLinkBooks}
              </a>
            </nav>
          </div>
        </section>

        {/* Stats Dashboard */}
        <StatsDashboard stats={stats} locale={locale} />

        {/* Featured Work */}
        <section id="work" className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              {t.selectedWork}
            </h2>
            <div className="mt-12 columns-1 gap-4 sm:columns-2">
              {featured.map((project) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Other Projects */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {t.otherProjects}
            </h2>
            <div className="mt-8 divide-y divide-border">
              {other.map((project) => (
                <CompactProject
                  key={project.slug}
                  project={project}
                  locale={locale}
                />
              ))}
            </div>

            {legacy.length > 0 && (
              <>
                <h3 className="mt-12 font-heading text-lg font-medium text-muted">
                  {t.legacy}
                </h3>
                <div className="mt-4 divide-y divide-border/50">
                  {legacy.map((project) => (
                    <CompactProject
                      key={project.slug}
                      project={project}
                      locale={locale}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Experience */}
        <section id="experience" className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              {t.experience}
            </h2>
            <div className="mt-12 space-y-12">
              {jobs.map((job) => (
                <JobEntry key={job.slug} job={job} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </>
  );
}

const PREVIEW_CHARS = 150;

function truncatePreview(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const end = lastSpace > maxChars * 0.6 ? lastSpace : maxChars;
  return cut.slice(0, end).trim() + "...";
}

function ProjectCard({
  project,
  locale,
}: {
  project: {
    slug: string;
    titleEn: string;
    titleSk: string;
    descriptionEn: string | null;
    descriptionSk: string | null;
    url: string | null;
    year: number | null;
    logo: string | null;
    appStoreUrl: string | null;
    playStoreUrl: string | null;
    technologies: { technology: { name: string; slug: string; icon: string | null } }[];
    integrations: { integration: { name: string; slug: string; icon: string | null } }[];
  };
  locale: Locale;
}) {
  const title = locale === "sk" ? project.titleSk : project.titleEn;
  const fullDescription =
    locale === "sk" ? project.descriptionSk : project.descriptionEn;
  const description =
    fullDescription && truncatePreview(fullDescription, PREVIEW_CHARS);

  return (
    <div className="group break-inside-avoid border border-border p-6 transition-colors hover:border-zinc-600 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {project.logo && (
            <img
              src={project.logo}
              alt=""
              className="size-10 shrink-0 rounded object-contain"
            />
          )}
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            <Link
              href={`/projects/${project.slug}`}
              className="transition-colors hover:text-zinc-400"
            >
              {title}
            </Link>
          </h3>
        </div>
        <span className="shrink-0 text-sm text-zinc-500">{project.year}</span>
      </div>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <LinkifyText text={description} />
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2.5">
        {project.technologies.map(({ technology }) => (
          <TagBadge
            key={technology.slug}
            name={technology.name}
            icon={technology.icon}
            variant="default"
          />
        ))}
        {project.integrations.map(({ integration }) => (
          <TagBadge
            key={integration.slug}
            name={integration.name}
            icon={integration.icon}
            variant="muted"
          />
        ))}
      </div>
      {(project.url || project.appStoreUrl || project.playStoreUrl) && (
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
          >
            {locale === "sk" ? "Detail projektu" : "Project details"}
          </Link>
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
            >
              {new URL(project.url).hostname}
              <ExternalLinkIcon />
            </a>
          )}
          {project.appStoreUrl && (
            <a
              href={project.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
            >
              App Store
              <ExternalLinkIcon />
            </a>
          )}
          {project.playStoreUrl && (
            <a
              href={project.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
            >
              Google Play
              <ExternalLinkIcon />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function CompactProject({
  project,
  locale,
}: {
  project: {
    slug: string;
    titleEn: string;
    titleSk: string;
    url: string | null;
    year: number | null;
    logo: string | null;
    technologies: { technology: { name: string; icon: string | null } }[];
    integrations: { integration: { name: string; icon: string | null } }[];
  };
  locale: Locale;
}) {
  const title = locale === "sk" ? project.titleSk : project.titleEn;
  const tags = [
    ...project.technologies.map((t) => t.technology),
    ...project.integrations.map((i) => i.integration),
  ].slice(0, 4);

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1 flex items-center gap-3">
        {project.logo && (
          <img
            src={project.logo}
            alt=""
            className="size-6 shrink-0 rounded object-contain"
          />
        )}
        <Link
          href={`/projects/${project.slug}`}
          className="min-w-0 truncate text-sm text-muted transition-colors hover:text-foreground"
        >
          {title}
        </Link>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center text-zinc-600 transition-colors hover:text-foreground"
            aria-label={`${title} website`}
          >
            <ExternalLinkIcon className="text-zinc-600" />
          </a>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
          {tags.map((tag, i) => (
            <TagBadge
              key={`${tag.name}-${i}`}
              name={tag.name}
              icon={tag.icon}
              variant="default"
              size="sm"
            />
          ))}
        </div>
        <span className="w-10 text-right text-xs tabular-nums text-zinc-600">
          {project.year}
        </span>
      </div>
    </div>
  );
}

function JobEntry({
  job,
  locale,
}: {
  job: {
    companyEn: string;
    companySk: string;
    positionEn: string;
    positionSk: string;
    descriptionEn: string | null;
    descriptionSk: string | null;
    url: string | null;
    urlLabelEn: string | null;
    urlLabelSk: string | null;
    startYear: number;
    endYear: number | null;
    current: boolean;
  };
  locale: Locale;
}) {
  const company = locale === "sk" ? job.companySk : job.companyEn;
  const position = locale === "sk" ? job.positionSk : job.positionEn;
  const description =
    locale === "sk" ? job.descriptionSk : job.descriptionEn;
  const urlLabel = locale === "sk" ? job.urlLabelSk : job.urlLabelEn;
  const t = ui[locale];

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-medium">{position}</h3>
          <p className="text-muted">{company}</p>
        </div>
        <span className="text-sm tabular-nums text-zinc-500">
          {job.startYear} &mdash; {job.current ? t.present : job.endYear}
        </span>
      </div>
      {description && (
        <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-muted">
          {description.split("\n\n").map((paragraph, i) => (
            <p key={i}>
              <LinkifyText text={paragraph} />
            </p>
          ))}
        </div>
      )}
      {job.url && urlLabel && (
        <p className="mt-3 text-sm">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-zinc-500 underline-offset-2 transition-colors hover:decoration-foreground"
          >
            {urlLabel}
          </a>
          <ExternalLinkIcon className="ml-1 inline-block size-3" />
        </p>
      )}
    </div>
  );
}
