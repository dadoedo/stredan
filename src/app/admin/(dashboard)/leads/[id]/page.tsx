import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JsonBlock } from "@/components/admin/JsonBlock";

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      company: true,
      contacts: { orderBy: { createdAt: "asc" } },
      enrichments: { orderBy: { createdAt: "desc" } },
      scores: { include: { offer: true }, orderBy: { createdAt: "desc" } },
      touches: {
        include: { offer: true, sendAccount: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!lead) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-semibold">{lead.company.name}</h2>
        <p className="text-sm text-muted">
          {lead.status} · IČO {lead.company.ico ?? "—"} · {lead.company.city ?? "—"}
        </p>
      </div>

      <section>
        <h3 className="mb-2 font-medium">Kontakty</h3>
        {lead.contacts.length === 0 ? (
          <p className="text-sm text-muted">Žiadne kontakty.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {lead.contacts.map((contact) => (
              <li key={contact.id}>
                {contact.fullName ?? "—"} · {contact.role ?? "—"} · {contact.email ?? "bez emailu"}
                {contact.isPrimary ? " · primary" : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-medium">Enrichment (input / output)</h3>
        {lead.enrichments.length === 0 ? (
          <p className="text-sm text-muted">Zatiaľ žiadne enrichment záznamy.</p>
        ) : (
          <div className="space-y-4">
            {lead.enrichments.map((row) => (
              <div key={row.id} className="rounded border border-border p-4">
                <p className="mb-3 text-sm">
                  {row.kind} · {row.provider}
                  {row.confidence != null ? ` · ${row.confidence}` : ""}
                  <span className="text-muted">
                    {" "}
                    · {row.createdAt.toLocaleString("sk-SK")}
                  </span>
                </p>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">input</p>
                <JsonBlock value={row.inputJson} />
                <p className="mt-3 mb-1 text-xs uppercase tracking-wide text-muted">output</p>
                <JsonBlock value={row.outputJson} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-medium">Skóre</h3>
        {lead.scores.length === 0 ? (
          <p className="text-sm text-muted">Žiadne skóre.</p>
        ) : (
          <div className="space-y-4">
            {lead.scores.map((score) => (
              <div key={score.id} className="rounded border border-border p-4">
                <p className="text-sm">
                  Offer {score.offer.code}: {score.score}/100
                </p>
                {score.rationaleSk && (
                  <p className="mt-1 text-sm text-muted">{score.rationaleSk}</p>
                )}
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted">input</p>
                    <JsonBlock value={score.inputJson} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted">output</p>
                    <JsonBlock value={score.outputJson} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-medium">Odoslané</h3>
        {lead.touches.length === 0 ? (
          <p className="text-sm text-muted">Žiadne správy.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {lead.touches.map((touch) => (
              <li key={touch.id}>
                <Link href={`/admin/touches/${touch.id}`} className="hover:underline">
                  {touch.offer.code}
                  {touch.sendAccount ? `×${touch.sendAccount.code}` : ""} · {touch.status} ·{" "}
                  {touch.subject}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
