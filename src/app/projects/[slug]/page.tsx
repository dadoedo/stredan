import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { ExternalLinkIcon } from "@/components/ExternalLinkIcon";
import { TagBadge } from "@/components/TagBadge";
import { LinkifyText } from "@/components/LinkifyText";
import { OpensInNewTab } from "@/components/OpensInNewTab";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/translations";
import { BADGE_CONFIG } from "@/lib/badges";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatCategory(category: string, locale: "en" | "sk"): string {
  const labels = {
    en: {
      product: "Product",
      client: "Client",
      "open-source": "Open-source",
      internal: "Internal",
      legacy: "Legacy",
      personal: "Personal",
    },
    sk: {
      product: "Produkt",
      client: "Klient",
      "open-source": "Open-source",
      internal: "Interný",
      legacy: "Legacy",
      personal: "Osobný",
    },
  } as const;

  return labels[locale][category as keyof (typeof labels)["en"]] ?? category;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    select: {
      titleEn: true,
      titleSk: true,
      descriptionEn: true,
      descriptionSk: true,
    },
  });

  if (!project) {
    return { title: "Project not found" };
  }

  const locale = await getLocale();
  const title = locale === "sk" ? project.titleSk : project.titleEn;
  const description =
    locale === "sk" ? project.descriptionSk : project.descriptionEn;

  return {
    title,
    description: description ?? undefined,
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = ui[locale];

  const project = await prisma.project.findFirst({
    where: { slug, visible: true },
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
  });

  if (!project) {
    notFound();
  }

  const title = locale === "sk" ? project.titleSk : project.titleEn;
  const description =
    locale === "sk" ? project.descriptionSk : project.descriptionEn;
  const category = formatCategory(project.category, locale);

  return (
    <SiteShell locale={locale}>
      <article className="agency-shell py-28">
          <Link
            href="/#work"
            className="inline-flex items-center text-sm text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
          >
            ← {t.backToProjects}
          </Link>

          <header className="mt-6 border-b border-border pb-8">
            <div className="flex flex-wrap items-center gap-4">
              {project.logo && (
                <img
                  src={project.logo}
                  alt=""
                  className="size-14 shrink-0 rounded object-contain"
                />
              )}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                  {title}
                </h1>
                {project.badges.map(({ badge }) => {
                  const config = BADGE_CONFIG[badge];
                  if (!config) return null;
                  return (
                    <span
                      key={badge}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ${config.className}`}
                    >
                      {config.icon && <span aria-hidden>{config.icon}</span>}
                      {config.label}
                    </span>
                  );
                })}
              </div>
            </div>
            {description && (
              <div className="mt-4 max-w-3xl space-y-3 text-base leading-relaxed text-muted sm:text-lg">
                {description.split("\n\n").map((paragraph, i) => (
                  <p key={i}>
                    <LinkifyText text={paragraph} locale={locale} />
                  </p>
                ))}
              </div>
            )}
          </header>

          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted">
                {t.projectYear}
              </p>
              <p className="text-sm text-foreground">{project.year ?? "—"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted">
                {t.projectCategory}
              </p>
              <p className="text-sm text-foreground">{category}</p>
            </div>
          </section>

          {project.technologies.length > 0 && (
            <section className="mt-10">
              <h2 className="font-heading text-xl font-medium tracking-tight">
                {t.projectTechnologies}
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {project.technologies.map(({ technology }) => (
                  <TagBadge
                    key={technology.slug}
                    name={technology.name}
                    icon={technology.icon}
                    size="lg"
                  />
                ))}
              </div>
            </section>
          )}

          {project.integrations.length > 0 && (
            <section className="mt-10">
              <h2 className="font-heading text-xl font-medium tracking-tight">
                {t.projectIntegrations}
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {project.integrations.map(({ integration }) => (
                  <TagBadge
                    key={integration.slug}
                    name={integration.name}
                    icon={integration.icon}
                    variant="muted"
                    size="lg"
                  />
                ))}
              </div>
            </section>
          )}

          {(project.url || project.appStoreUrl || project.playStoreUrl) && (
            <section className="mt-10">
              <h2 className="font-heading text-xl font-medium tracking-tight">
                {t.projectLinks}
              </h2>
              <div className="mt-4 flex flex-wrap gap-4">
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1 text-sm text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
                  >
                    {t.projectWebsite}
                    <ExternalLinkIcon />
                    <OpensInNewTab locale={locale} />
                  </a>
                )}
                {project.appStoreUrl && (
                  <a
                    href={project.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1 text-sm text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
                  >
                    App Store
                    <ExternalLinkIcon />
                    <OpensInNewTab locale={locale} />
                  </a>
                )}
                {project.playStoreUrl && (
                  <a
                    href={project.playStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1 text-sm text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
                  >
                    Google Play
                    <ExternalLinkIcon />
                    <OpensInNewTab locale={locale} />
                  </a>
                )}
              </div>
            </section>
          )}
        </article>
    </SiteShell>
  );
}
