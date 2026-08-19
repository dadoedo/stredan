import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  buildLeadsOrderBy,
  buildLeadsQueryString,
  clampPage,
  extractSkipReason,
  formatContact,
  hasActiveFilters,
  LEAD_STATUSES,
  parseContactFilter,
  parseSortDirection,
  parseSortField,
  type ContactFilter,
  type LeadStatus,
} from "@/lib/leads-admin";
import { LeadsPagination } from "./LeadsPagination";
import { LeadsSortHeader } from "./LeadsSortHeader";
import { LeadsToolbar } from "./LeadsToolbar";

const PAGE_SIZE = 50;

type SearchParams = {
  q?: string;
  status?: string;
  skip?: string;
  contact?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

function buildLeadsWhere(params: {
  q?: string;
  status?: string;
  skip?: string;
  contact?: ContactFilter;
}): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  const and: Prisma.LeadWhereInput[] = [];

  if (params.status && LEAD_STATUSES.includes(params.status as LeadStatus)) {
    where.status = params.status as LeadStatus;
  }

  if (params.contact === "yes") {
    and.push({ contacts: { some: {} } });
  } else if (params.contact === "no") {
    and.push({ contacts: { none: {} } });
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
        {
          AND: [
            { OR: [{ notes: null }, { notes: "" }] },
            {
              enrichments: {
                some: {
                  kind: "website",
                  outputJson: { path: ["skip_reason"], equals: skip },
                },
              },
            },
          ],
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
  const contact = parseContactFilter(params.contact);
  const sort = parseSortField(params.sort);
  const dir = parseSortDirection(params.dir);
  const requestedPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const where = buildLeadsWhere({ q, status, skip, contact });
  const total = await prisma.lead.count({ where });
  const page = clampPage(requestedPage, total, PAGE_SIZE);

  const query = { q, status, skip, contact, sort, dir };

  if (requestedPage !== page) {
    redirect(`/admin/leads${buildLeadsQueryString(query, page)}`);
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: buildLeadsOrderBy(sort, dir) as Prisma.LeadOrderByWithRelationInput,
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
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Leady</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Enrichment píše automatizácia priamo do DB cez Postgres MCP (nie HTTP API).
      </p>

      <LeadsToolbar q={q} status={status} skip={skip} contact={contact} sort={sort} dir={dir} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[64rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="border-b border-border px-3 py-2 font-medium">Firma</th>
              <th className="border-b border-border px-3 py-2 font-medium">Stav</th>
              <th className="border-b border-border px-3 py-2 font-medium">Kontakt</th>
              <th className="border-b border-border px-3 py-2 font-medium">Skip dôvod</th>
              <LeadsSortHeader
                label="Aktualizované"
                field="updatedAt"
                currentSort={sort}
                currentDir={dir}
                query={query}
              />
              <th className="border-b border-border px-3 py-2 font-medium">IČO</th>
              <th className="border-b border-border px-3 py-2 font-medium">Mesto</th>
              <LeadsSortHeader
                label="Enrich"
                field="enrich"
                currentSort={sort}
                currentDir={dir}
                query={query}
              />
              <LeadsSortHeader
                label="Score"
                field="score"
                currentSort={sort}
                currentDir={dir}
                query={query}
              />
              <LeadsSortHeader
                label="Send"
                field="send"
                currentSort={sort}
                currentDir={dir}
                query={query}
              />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const contactRow = lead.contacts[0];
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
                    {formatContact(contactRow)}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-muted">
                    {skipReason ?? "—"}
                  </td>
                  <td className="border-b border-border px-3 py-2 text-muted whitespace-nowrap">
                    {lead.updatedAt.toLocaleString("sk-SK")}
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
            {hasActiveFilters(query)
              ? "Žiadne leady pre zvolené filtre."
              : "Zatiaľ žiadne leady."}
          </p>
        )}
      </div>

      <LeadsPagination page={page} pageSize={PAGE_SIZE} total={total} query={query} />
    </div>
  );
}
