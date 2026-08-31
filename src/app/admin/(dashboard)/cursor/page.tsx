import Link from "next/link";
import { compactNumber } from "react-cursor-calendar";
import { prisma } from "@/lib/prisma";

export default async function AdminCursorPage() {
  const handles = await prisma.cursorHandle.findMany({
    orderBy: { lastSeenAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Cursor handly</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Interný log verejného API. Handly z GET /v1/:handle, agregáty bez
        denných heatmap dát.
      </p>
      <div className="space-y-2">
        {handles.map((row) => {
          const tokens = Number(row.lastTotalTokens);
          return (
            <Link
              key={row.handle}
              href={`/admin/cursor/${row.handle}`}
              className="block rounded border border-border p-4 hover:border-foreground/20 hover:bg-surface-2/60"
            >
              <p className="font-medium">
                @{row.handle}
                {row.displayName ? ` · ${row.displayName}` : ""}
              </p>
              <p className="text-sm text-muted">
                {row.lastSeenAt.toLocaleString("sk-SK")} · {row.requestCount} GET
                {tokens ? ` · ${compactNumber(tokens)} tokenov` : ""}
                {row.lastCurrentStreak
                  ? ` · streak ${row.lastCurrentStreak}d / ${row.lastLongestStreak}d`
                  : ""}
                {row.lastError ? ` · ${row.lastError}` : ""}
              </p>
            </Link>
          );
        })}
        {handles.length === 0 && (
          <p className="py-8 text-center text-muted">
            Zatiaľ žiadne handly. Objavia sa po GET na API.
          </p>
        )}
      </div>
    </div>
  );
}
