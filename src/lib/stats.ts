import { prisma } from "@/lib/prisma";

export type StatsData = {
  technologies: { name: string; slug: string; count: number; icon: string | null }[];
  integrations: { name: string; slug: string; count: number; icon: string | null }[];
  byCategory: { category: string; count: number }[];
  byYear: { year: number; count: number }[];
  projectsByTechnology: {
    techSlug: string;
    techName: string;
    projects: { slug: string; titleEn: string; titleSk: string }[];
  }[];
  projectsByIntegration: {
    intSlug: string;
    intName: string;
    projects: { slug: string; titleEn: string; titleSk: string }[];
  }[];
};

export async function getStats(): Promise<StatsData> {
  const [projects, techCounts, intCounts] = await Promise.all([
    prisma.project.findMany({
      where: { visible: true },
      include: {
        technologies: { include: { technology: true } },
        integrations: { include: { integration: true } },
      },
    }),
    prisma.projectTechnology.groupBy({
      by: ["technologyId"],
      _count: { projectId: true },
    }),
    prisma.projectIntegration.groupBy({
      by: ["integrationId"],
      _count: { projectId: true },
    }),
  ]);

  const techIds = techCounts.map((t) => t.technologyId);
  const intIds = intCounts.map((i) => i.integrationId);

  const [technologies, integrations] = await Promise.all([
    prisma.technology.findMany({
      where: { id: { in: techIds } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.integration.findMany({
      where: { id: { in: intIds } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const techCountMap = new Map(techCounts.map((t) => [t.technologyId, t._count.projectId]));
  const intCountMap = new Map(intCounts.map((i) => [i.integrationId, i._count.projectId]));

  const technologiesData = technologies
    .map((t) => ({
      name: t.name,
      slug: t.slug,
      count: techCountMap.get(t.id) ?? 0,
      icon: t.icon,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  const integrationsData = integrations
    .map((i) => ({
      name: i.name,
      slug: i.slug,
      count: intCountMap.get(i.id) ?? 0,
      icon: i.icon,
    }))
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count);

  const categoryCount = new Map<string, number>();
  const yearCount = new Map<number, number>();
  for (const p of projects) {
    categoryCount.set(p.category, (categoryCount.get(p.category) ?? 0) + 1);
    if (p.year) yearCount.set(p.year, (yearCount.get(p.year) ?? 0) + 1);
  }

  const byCategory = Array.from(categoryCount.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const byYear = Array.from(yearCount.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  const projectsByTechnology = technologiesData.map((tech) => ({
    techSlug: tech.slug,
    techName: tech.name,
    projects: projects
      .filter((p) => p.technologies.some((pt) => pt.technology.slug === tech.slug))
      .map((p) => ({ slug: p.slug, titleEn: p.titleEn, titleSk: p.titleSk })),
  }));

  const projectsByIntegration = integrationsData.map((int) => ({
    intSlug: int.slug,
    intName: int.name,
    projects: projects
      .filter((p) => p.integrations.some((pi) => pi.integration.slug === int.slug))
      .map((p) => ({ slug: p.slug, titleEn: p.titleEn, titleSk: p.titleSk })),
  }));

  return {
    technologies: technologiesData,
    integrations: integrationsData,
    byCategory,
    byYear,
    projectsByTechnology,
    projectsByIntegration,
  };
}
