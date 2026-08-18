import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminRunsPage() {
  const runs = await prisma.agentRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Behania agenta</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Operator je Cursor automation. Sem sa loguje input/output každého behu.
      </p>
      <div className="space-y-2">
        {runs.map((run) => (
          <Link
            key={run.id}
            href={`/admin/runs/${run.id}`}
            className="block rounded border border-border p-4 hover:border-zinc-500"
          >
            <p className="font-medium">
              {run.kind} · {run.status} · {run.trigger}
            </p>
            <p className="text-sm text-muted">
              {run.startedAt.toLocaleString("sk-SK")}
              {run.finishedAt
                ? ` → ${run.finishedAt.toLocaleString("sk-SK")}`
                : ""}
              {run.summary ? ` · ${run.summary}` : ""}
            </p>
          </Link>
        ))}
        {runs.length === 0 && (
          <p className="py-8 text-center text-muted">Zatiaľ žiadne behania.</p>
        )}
      </div>
    </div>
  );
}
