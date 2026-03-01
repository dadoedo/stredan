import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProject, fetchProjectLogo } from "@/actions/admin";
import { ProjectForm } from "../../ProjectForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;

  const [project, technologies, integrations] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
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
    prisma.technology.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.integration.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/admin/projects"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            ← Späť na projekty
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-semibold">
            Upraviť: {project.titleEn}
          </h1>
        </div>

        <ProjectForm
          action={updateProject}
          fetchLogoAction={fetchProjectLogo}
          technologies={technologies}
          integrations={integrations}
          project={project}
        />
      </div>
    </div>
  );
}
