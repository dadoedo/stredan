import { notFound } from "next/navigation";
import { compactNumber } from "react-cursor-calendar";
import { JsonBlock } from "@/components/admin/JsonBlock";
import { prisma } from "@/lib/prisma";

export default async function AdminCursorSnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await prisma.cursorProfileSnapshot.findUnique({
    where: { id },
  });
  if (!snapshot) notFound();

  const tokens = Number(snapshot.totalTokens);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">
          @{snapshot.handle} · {compactNumber(tokens)} tokenov
        </h2>
        <p className="mt-1 text-sm text-muted">
          {snapshot.displayName} · joined {snapshot.joinedDate} ·{" "}
          {snapshot.capturedAt.toLocaleString("sk-SK")}
        </p>
        <p className="text-sm text-muted">
          streak {snapshot.currentStreak}d / {snapshot.longestStreak}d ·{" "}
          {snapshot.mostActiveMonth} · {snapshot.mostActiveDay} · agents{" "}
          {snapshot.agentsLocal} local / {snapshot.agentsCloud} cloud
        </p>
      </div>
      <div>
        <h3 className="mb-2 font-medium">profile</h3>
        <JsonBlock value={snapshot.profile} />
      </div>
    </div>
  );
}
