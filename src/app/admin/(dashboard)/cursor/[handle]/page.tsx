import Link from "next/link";
import { notFound } from "next/navigation";
import { compactNumber } from "react-cursor-calendar";
import { JsonBlock } from "@/components/admin/JsonBlock";
import { prisma } from "@/lib/prisma";

export default async function AdminCursorHandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const row = await prisma.cursorHandle.findUnique({ where: { handle } });
  if (!row) notFound();

  const logs = await prisma.cursorProfileSnapshot.findMany({
    where: { handle },
    orderBy: { capturedAt: "desc" },
    take: 100,
  });

  const tokens = Number(row.lastTotalTokens);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/admin/cursor" className="underline">
            Cursor
          </Link>
        </p>
        <h2 className="mt-1 font-heading text-xl font-semibold">
          @{row.handle}
          {row.displayName ? ` · ${row.displayName}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {tokens ? `${compactNumber(tokens)} tokenov · ` : ""}
          {row.requestCount} GET · first{" "}
          {row.firstSeenAt.toLocaleString("sk-SK")} · last{" "}
          {row.lastSeenAt.toLocaleString("sk-SK")}
        </p>
        {row.lastError && (
          <p className="mt-2 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
            {row.lastError}
          </p>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="font-medium">Logy (agregáty)</h3>
        {logs.map((log) => (
          <div key={log.id} className="rounded border border-border p-4">
            <p className="text-sm">
              {log.capturedAt.toLocaleString("sk-SK")} ·{" "}
              {compactNumber(Number(log.totalTokens))} tokenov · streak{" "}
              {log.currentStreak}d / {log.longestStreak}d · {log.mostActiveMonth}{" "}
              · {log.mostActiveDay} · agents {log.agentsLocal} local /{" "}
              {log.agentsCloud} cloud
            </p>
            <div className="mt-3">
              <JsonBlock value={log.profile} />
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-sm text-muted">Zatiaľ žiadny scrape log.</p>
        )}
      </div>
    </div>
  );
}
