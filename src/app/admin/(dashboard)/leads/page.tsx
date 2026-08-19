import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  extractSkipReason,
  formatContact,
  LEAD_STATUSES,
  type LeadStatus,
} from "@/lib/leads-admin";
import { LeadsPagination } from "./LeadsPagination";
import { LeadsToolbar } from "./LeadsToolbar";

const PAGE_SIZE = 50;

type SearchParams = {
  q?: string;
  status?: string;
  skip?: string;
  page?: string;
};

function buildLeadsWhere(params: {
  q?: string;
  status?: string;
  skip?: string;
}): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  const and: Prisma.LeadWhereInput[] = [];

  if (params.status && LEAD_STATUSES.includes(params.status as LeadStatus)) {
    where.status = params.status as LeadStatus;
  }

  if (params.q?.trim()) {
    const q = params.q.trim();
    and.push({
      OR: [
        { company: { name: { contains: q, mode: "insensitive" } } },
        { company: { ico: { contains: q } } },
        { company: { city: { contains: q, mode: "insensitive" } } },
        { contacts: { some: { email: { contains: q, mode: "insensitive" } } } },
        { contacts: { some: { fullName: { contains: q, mode: "insensitive" } } } },
        { notes: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (params.skip?.trim()) {
    const skip = params.skip.trim();
    and.push({
      OR: [
        { notes: { equals: skip } },
        { notes: { contains: skip, mode: "insensitive" } },
        {
          enrichments: {
            some: {
              kind: "website",
              outputJson: { path: ["skip_reason"], equals: skip },
            },
          },
        },
      ],
    });
  }

  if (and.length) where.AND = and;
  return where;
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const status = params.status?.trim() || undefined;
  const skip = params.skip?.trim() || undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const where = buildLeadsWhere({ q, status, skip });

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        company: true,
        contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 },
        enrichments: {
          where: { kind: "website" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { enrichments: true, scores: true, touches: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  const query = { q, status, skip };

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Leady</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Enrichment píše automatizácia priamo do DB cez Postgres MCP (nie HTTP API).
      </p>

      <LeadsToolbar q={q} status={status} skip={skip} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="border-b border-border px-3 py-2 font-medium">Firma</th>
              <th className="border-b border-border px-3 py-2 font-medium">Stav</th>
              <th className="border-b border-border px-3 py-2 font-medium">Kontakt</th>
              <th className="border-b border-border px-3 py-2 font-medium">Skip dôvod</th>
              <th className="border-b border-border px-3 py-2 font-medium">IČO</th>
              <th className="border-b border-border px-3 py-2 font-medium">Mesto</th>
              <th className="border-b border-border px-3 py-2 font-medium">Enrich</th>
              <th className="border-b border-border px-3 py-2 font-medium">Score</th>
              <th className="border-b border-border px-3 py-2 font-medium">Send</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const contact = lead.contacts[0];
              const skipReason = extractSkipReason(lead);

              return (
                <tr key={lead.id} className="hover:bg-surface-2/40">
                  <td className="border-b border-border px-3 py-2">
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.company.name}
                    </Link>
                  </td>
                  <td className="border-b border-border px-3 py-2">{lead.status}</td>
                  <td className="border-b border-border px-3 py-2 text-muted">
                    {formatContact(contact)}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-muted">
                    {skipReason ?? "—"}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-muted">
                    {lead.company.ico ?? "—"}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-muted">
                    {lead.company.city ?? "—"}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-muted">
                    {lead._count.enrichments}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-muted">
                    {lead._count.scores}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-muted">
                    {lead._count.touches}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {leads.length === 0 && (
          <p className="py-8 text-center text-muted">
            {q || status || skip ? "Žiadne leady pre zvolené filtre." : "Zatiaľ žiadne leady."}
          </p>
        )}
      </div>

      <LeadsPagination page={page} pageSize={PAGE_SIZE} total={total} query={query} />
    </div>
  );
}
