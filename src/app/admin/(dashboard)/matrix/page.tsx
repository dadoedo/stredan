import Link from "next/link";
import { prisma } from "@/lib/prisma";

const SENT_STATUSES = ["sent", "delivered", "opened", "replied"] as const;

function cellClass(sent: number, replied: number) {
  if (replied > 0) return "border-accent/40 bg-accent/10 text-foreground";
  if (sent > 0) return "border-border bg-surface-2 text-foreground";
  return "border-border/70 bg-transparent text-muted";
}

export default async function AdminMatrixPage() {
  const [offers, accounts, grouped, todayCount, recentRuns] = await Promise.all([
    prisma.offer.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.sendAccount.findMany({ orderBy: { code: "asc" } }),
    prisma.touch.groupBy({
      by: ["offerId", "sendAccountId", "status"],
      _count: { _all: true },
    }),
    prisma.touch.count({
      where: {
        status: { in: [...SENT_STATUSES] },
        sentAt: { gte: new Date(new Date().toISOString().slice(0, 10)) },
      },
    }),
    prisma.agentRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
  ]);

  const counts = new Map<string, { sent: number; replied: number }>();
  for (const row of grouped) {
    if (!row.sendAccountId) continue;
    const key = `${row.offerId}:${row.sendAccountId}`;
    const current = counts.get(key) ?? { sent: 0, replied: 0 };
    if (SENT_STATUSES.includes(row.status as (typeof SENT_STATUSES)[number])) {
      current.sent += row._count._all;
    }
    if (row.status === "replied") current.replied += row._count._all;
    counts.set(key, current);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Experiment matrix</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Riadky A–E sú vzor obsahu (offer / cold email). Stĺpce 1–5 sú odosielacie
            účty. Agent vyberá náhodnú aktívnu bunku pod dennými capmi.
          </p>
        </div>
        <p className="text-sm text-muted">Dnes odoslané: {todayCount}</p>
      </div>

      {accounts.length === 0 || offers.length === 0 ? (
        <p className="text-sm text-muted">
          Najprv spusti <code>npm run seed:leadgen</code> (ponuky A–E a účty 1–5).
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-border px-3 py-2 text-left font-medium">
                  Offer \ účet
                </th>
                {accounts.map((account) => (
                  <th key={account.id} className="border border-border px-3 py-2 text-left font-medium">
                    <div>{account.code}</div>
                    <div className="text-xs font-normal text-muted">
                      {account.name}
                      {!account.active && " · vypnutý"}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <th className="border border-border px-3 py-2 text-left font-medium">
                    <Link href="/admin/templates" className="hover:underline">
                      {offer.code}
                    </Link>
                    <div className="text-xs font-normal text-muted">{offer.nameSk}</div>
                  </th>
                  {accounts.map((account) => {
                    const cell = counts.get(`${offer.id}:${account.id}`) ?? {
                      sent: 0,
                      replied: 0,
                    };
                    return (
                      <td
                        key={account.id}
                        className={`border px-3 py-2 ${cellClass(cell.sent, cell.replied)}`}
                      >
                        <div>{cell.sent} odoslaných</div>
                        <div className="text-xs text-muted">{cell.replied} odpovedí</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Posledné behania agenta</h3>
          <Link href="/admin/runs" className="text-sm text-muted hover:text-foreground">
            všetky
          </Link>
        </div>
        {recentRuns.length === 0 ? (
          <p className="text-sm text-muted">Zatiaľ žiadne AgentRun záznamy.</p>
        ) : (
          <ul className="space-y-2">
            {recentRuns.map((run) => (
              <li key={run.id} className="rounded border border-border px-4 py-3 text-sm">
                <Link href={`/admin/runs/${run.id}`} className="hover:underline">
                  {run.kind} · {run.status}
                </Link>
                <p className="text-muted">
                  {run.startedAt.toLocaleString("sk-SK")}
                  {run.summary ? ` · ${run.summary}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
