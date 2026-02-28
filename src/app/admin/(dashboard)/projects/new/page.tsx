import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProject } from "@/actions/admin";
import { ProjectForm } from "../ProjectForm";

export default async function NewProjectPage() {
  const [technologies, integrations] = await Promise.all([
    prisma.technology.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.integration.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

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
          <h1 className="mt-2 font-heading text-2xl font-semibold">Nový projekt</h1>
        </div>

        <ProjectForm
          action={createProject}
          technologies={technologies}
          integrations={integrations}
        />
      </div>
    </div>
  );
}
