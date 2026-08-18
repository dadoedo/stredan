import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    take: 150,
    include: {
      company: true,
      contacts: { where: { isPrimary: true }, take: 1 },
      _count: { select: { enrichments: true, scores: true, touches: true } },
    },
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Leady</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Enrichment píše automatizácia priamo do DB cez Postgres MCP (nie HTTP API).
      </p>

      <div className="space-y-2">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/admin/leads/${lead.id}`}
            className="block rounded border border-border p-4 transition-colors hover:border-zinc-500"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{lead.company.name}</p>
              <p className="text-sm text-muted">{lead.status}</p>
            </div>
            <p className="text-sm text-muted">
              IČO {lead.company.ico ?? "—"}
              {lead.company.city ? ` · ${lead.company.city}` : ""}
              {` · enrich ${lead._count.enrichments} · score ${lead._count.scores} · send ${lead._count.touches}`}
            </p>
          </Link>
        ))}
        {leads.length === 0 && (
          <p className="py-8 text-center text-muted">Zatiaľ žiadne leady.</p>
        )}
      </div>
    </div>
  );
}
