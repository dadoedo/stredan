import Link from "next/link";
import { compactNumber } from "react-cursor-calendar";
import { prisma } from "@/lib/prisma";
import { CURSOR_HANDLE } from "@/lib/cursor-profile";

export default async function AdminCursorPage() {
  const snapshots = await prisma.cursorProfileSnapshot.findMany({
    where: { handle: CURSOR_HANDLE },
    orderBy: { capturedAt: "desc" },
    take: 100,
    select: {
      id: true,
      capturedAt: true,
      displayName: true,
      totalTokens: true,
      currentStreak: true,
      longestStreak: true,
      mostActiveMonth: true,
      mostActiveDay: true,
      agentsLocal: true,
      agentsCloud: true,
    },
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Cursor profil</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Snapshoty @{CURSOR_HANDLE}. Ukladajú sa pri cache miss verejného
        profilu (max ~1× za hodinu), nie pri každom GET.
      </p>
      <div className="space-y-2">
        {snapshots.map((snapshot) => {
          const tokens = Number(snapshot.totalTokens);
          return (
            <Link
              key={snapshot.id}
              href={`/admin/cursor/${snapshot.id}`}
              className="block rounded border border-border p-4 hover:border-foreground/20 hover:bg-surface-2/60"
            >
              <p className="font-medium">
                {compactNumber(tokens)} tokenov · {snapshot.displayName}
              </p>
              <p className="text-sm text-muted">
                {snapshot.capturedAt.toLocaleString("sk-SK")} · streak{" "}
                {snapshot.currentStreak}d / {snapshot.longestStreak}d ·{" "}
                {snapshot.mostActiveMonth} · {snapshot.mostActiveDay} · agents{" "}
                {snapshot.agentsLocal} local / {snapshot.agentsCloud} cloud
              </p>
            </Link>
          );
        })}
        {snapshots.length === 0 && (
          <p className="py-8 text-center text-muted">
            Zatiaľ žiadne snapshoty. Prvý sa zapíše po ďalšom fetchi profilu.
          </p>
        )}
      </div>
    </div>
  );
}
