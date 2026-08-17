import Link from "next/link";
import { ExternalLinkIcon } from "@/components/ExternalLinkIcon";
import { LinkifyText } from "@/components/LinkifyText";
import { OpensInNewTab } from "@/components/OpensInNewTab";
import { TagBadge } from "@/components/TagBadge";
import { ui, type Locale } from "@/lib/translations";
import { BADGE_CONFIG } from "@/lib/badges";

const PREVIEW_CHARS = 150;

function truncatePreview(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const end = lastSpace > maxChars * 0.6 ? lastSpace : maxChars;
  return cut.slice(0, end).trim() + "...";
}

function ProjectBadgePill({
  badge,
  size = "sm",
}: {
  badge: string;
  size?: "sm" | "md";
}) {
  const config = BADGE_CONFIG[badge];
  if (!config) return null;
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-medium ${sizeClass} ${config.className}`}
    >
      {config.icon && <span aria-hidden>{config.icon}</span>}
      {config.label}
    </span>
  );
}

export function ProjectCard({
  project,
  locale,
}: {
  project: {
    slug: string;
    titleEn: string;
    titleSk: string;
    category: string;
    descriptionEn: string | null;
    descriptionSk: string | null;
    url: string | null;
    year: number | null;
    logo: string | null;
    appStoreUrl: string | null;
    playStoreUrl: string | null;
    technologies: { technology: { name: string; slug: string; icon: string | null } }[];
    integrations: { integration: { name: string; slug: string; icon: string | null } }[];
    badges: { badge: string }[];
  };
  locale: Locale;
}) {
  const title = locale === "sk" ? project.titleSk : project.titleEn;
  const fullDescription =
    locale === "sk" ? project.descriptionSk : project.descriptionEn;
  const description =
    fullDescription && truncatePreview(fullDescription, PREVIEW_CHARS);

  return (
    <div className="group mb-4 break-inside-avoid border border-border p-6 transition-colors hover:border-zinc-600">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {project.logo && (
            <img
              src={project.logo}
              alt=""
              className="size-10 shrink-0 rounded object-contain"
            />
          )}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="font-heading text-lg font-semibold tracking-tight">
              <Link
                href={`/projects/${project.slug}`}
                className="transition-colors hover:text-zinc-400"
              >
                {title}
              </Link>
            </h3>
            {project.badges.map(({ badge }) => (
              <ProjectBadgePill key={badge} badge={badge} />
            ))}
          </div>
        </div>
        <span className="shrink-0 text-sm text-zinc-400">{project.year}</span>
      </div>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <LinkifyText text={description} locale={locale} />
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
            className="inline-flex min-h-11 items-center gap-1 text-sm text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
          >
            {locale === "sk" ? "Detail projektu" : "Project details"}
          </Link>
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-sm text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline"
            >
              {new URL(project.url).hostname}
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
      )}
    </div>
  );
}

export function CompactProject({
  project,
  locale,
}: {
  project: {
    slug: string;
    titleEn: string;
    titleSk: string;
    category: string;
    url: string | null;
    year: number | null;
    logo: string | null;
    technologies: { technology: { name: string; icon: string | null } }[];
    integrations: { integration: { name: string; icon: string | null } }[];
    badges: { badge: string }[];
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
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {project.logo && (
          <img
            src={project.logo}
            alt=""
            className="size-6 shrink-0 rounded object-contain"
          />
        )}
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/projects/${project.slug}`}
            className="min-w-0 truncate text-sm text-muted transition-colors hover:text-foreground"
          >
            {title}
          </Link>
          {project.badges.map(({ badge }) => (
            <ProjectBadgePill key={badge} badge={badge} />
          ))}
        </div>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-zinc-400 transition-colors hover:text-foreground"
            aria-label={`${title} — ${locale === "sk" ? "web projektu" : "project website"}`}
          >
            <ExternalLinkIcon />
            <OpensInNewTab locale={locale} />
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
        <span className="w-10 text-right text-xs tabular-nums text-zinc-400">
          {project.year}
        </span>
      </div>
    </div>
  );
}

export function JobEntry({
  job,
  locale,
}: {
  job: {
    slug: string;
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
        <span className="text-sm tabular-nums text-zinc-400">
          {job.startYear} &mdash; {job.current ? t.present : job.endYear}
        </span>
      </div>
      {description && (
        <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-muted">
          {description.split("\n\n").map((paragraph, i) => (
            <p key={i}>
              <LinkifyText text={paragraph} locale={locale} />
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
            className="inline-flex items-center gap-1 text-foreground underline decoration-zinc-400 underline-offset-2 transition-colors hover:decoration-foreground"
          >
            {urlLabel}
            <ExternalLinkIcon className="size-3" />
            <OpensInNewTab locale={locale} />
          </a>
        </p>
      )}
    </div>
  );
}

export type PortfolioProject = Parameters<typeof ProjectCard>[0]["project"];
export type PortfolioJob = Parameters<typeof JobEntry>[0]["job"];
