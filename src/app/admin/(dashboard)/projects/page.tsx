import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "./DeleteButton";
import { FetchAllLogosButton } from "./FetchAllLogosButton";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
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
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-semibold">Projekty</h2>
        <div className="flex flex-wrap items-center gap-3">
          <FetchAllLogosButton />
          <Link
            href="/admin/projects/new"
            className="rounded border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/20 hover:bg-surface-2/60"
          >
            + Nový projekt
          </Link>
        </div>
      </div>

        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between gap-4 rounded border border-border p-4"
            >
              <div className="flex items-center gap-3">
                {project.logo && (
                  <img
                    src={project.logo}
                    alt=""
                    className="size-8 rounded object-contain"
                  />
                )}
                <div>
                  <p className="font-medium">{project.titleEn}</p>
                  <p className="text-sm text-muted">
                    /{project.slug} · {project.category} · {project.year ?? "—"}
                    {!project.visible && " · skrytý"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/projects/${project.id}/edit`}
                  className="rounded border border-border px-3 py-1 text-sm transition-colors hover:border-foreground/20 hover:bg-surface-2/60"
                >
                  Upraviť
                </Link>
                <Link
                  href={`/projects/${project.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-border px-3 py-1 text-sm transition-colors hover:border-foreground/20 hover:bg-surface-2/60"
                >
                  Zobraziť
                </Link>
                <DeleteButton projectId={project.id} projectTitle={project.titleEn} />
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <p className="py-12 text-center text-muted">Žiadne projekty.</p>
        )}
    </div>
  );
}
