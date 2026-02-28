import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { logout } from "@/actions/admin";
import { DeleteButton } from "./DeleteButton";
import { FetchAllLogosButton } from "./FetchAllLogosButton";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      technologies: { include: { technology: true } },
      integrations: { include: { integration: true } },
    },
  });

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold">Admin – Projekty</h1>
          <div className="flex flex-wrap items-center gap-4">
            <FetchAllLogosButton />
            <Link
              href="/admin/projects/new"
              className="rounded border border-border px-4 py-2 text-sm transition-colors hover:border-zinc-500"
            >
              + Nový projekt
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                Odhlásiť
              </button>
            </form>
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
                  className="rounded border border-border px-3 py-1 text-sm transition-colors hover:border-zinc-500"
                >
                  Upraviť
                </Link>
                <Link
                  href={`/projects/${project.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-border px-3 py-1 text-sm transition-colors hover:border-zinc-500"
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
    </div>
  );
}
