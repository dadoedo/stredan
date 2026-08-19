import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JsonBlock } from "@/components/admin/JsonBlock";

export default async function AdminRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await prisma.agentRun.findUnique({ where: { id } });
  if (!run) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">
          {run.kind} · {run.status}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Cursor agent môže ostať RUNNING aj keď je tento riadok succeeded. Platí tento status.
        </p>
        <p className="text-sm text-muted">
          {run.trigger} · {run.startedAt.toLocaleString("sk-SK")}
          {run.finishedAt ? ` → ${run.finishedAt.toLocaleString("sk-SK")}` : ""}
          {run.costHintUsd != null ? ` · ~$${run.costHintUsd}` : ""}
        </p>
      </div>
      {run.summary && <p className="text-sm">{run.summary}</p>}
      {run.error && (
        <p className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          {run.error}
        </p>
      )}
      <div>
        <h3 className="mb-2 font-medium">inputJson</h3>
        <JsonBlock value={run.inputJson} />
      </div>
      <div>
        <h3 className="mb-2 font-medium">outputJson</h3>
        <JsonBlock value={run.outputJson} />
      </div>
    </div>
  );
}
