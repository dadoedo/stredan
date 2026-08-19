import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseSkipReason, skipReasonLabel } from "@/lib/leadgen";

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    take: 150,
    include: {
      company: true,
      contacts: { where: { isPrimary: true }, take: 1 },
      scores: { select: { score: true, offer: { select: { code: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { enrichments: true, scores: true, touches: true } },
    },
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Leady</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Enrichment píše automatizácia priamo do DB cez Postgres MCP (nie HTTP API).
        Hotový beh = status na{" "}
        <Link href="/admin/runs" className="underline">
          behaniach
        </Link>
        , nie Cursor agent list.
      </p>

      <div className="space-y-2">
        {leads.map((lead) => {
          const skip = parseSkipReason(lead.skipReason, lead.notes);
          const email = lead.contacts[0]?.email;
          const latestByOffer = new Map<string, number>();
          for (const row of lead.scores) {
            if (!latestByOffer.has(row.offer.code)) latestByOffer.set(row.offer.code, row.score);
          }
          const maxScore = latestByOffer.size ? Math.max(...latestByOffer.values()) : null;
          return (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className="block rounded border border-border p-4 transition-colors hover:border-foreground/20 hover:bg-surface-2/60"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{lead.company.name}</p>
                <p className="text-sm text-muted">
                  {lead.status}
                  {skip ? ` · ${skipReasonLabel(skip)}` : ""}
                </p>
              </div>
              <p className="text-sm text-muted">
                IČO {lead.company.ico ?? "—"}
                {lead.company.city ? ` · ${lead.company.city}` : ""}
                {lead.company.naceCode ? ` · ${lead.company.naceCode}` : ""}
                {lead.company.website ? " · web" : ""}
                {email ? ` · ${email}` : " · bez emailu"}
                {maxScore != null ? ` · max ${maxScore}` : ""}
                {` · enrich ${lead._count.enrichments} · score ${latestByOffer.size || lead._count.scores} · send ${lead._count.touches}`}
              </p>
            </Link>
          );
        })}
        {leads.length === 0 && (
          <p className="py-8 text-center text-muted">Zatiaľ žiadne leady.</p>
        )}
      </div>
    </div>
  );
}
