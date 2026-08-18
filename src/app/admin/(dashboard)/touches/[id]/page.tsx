import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JsonBlock } from "@/components/admin/JsonBlock";

export default async function AdminTouchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const touch = await prisma.touch.findUnique({
    where: { id },
    include: {
      offer: true,
      sendAccount: true,
      template: true,
      contact: true,
      lead: { include: { company: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!touch) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">{touch.subject}</h2>
        <p className="text-sm text-muted">
          {touch.offer.code}×{touch.sendAccount?.code ?? "?"} · {touch.status} ·{" "}
          {touch.channel}
        </p>
      </div>
      <p className="text-sm">
        Firma:{" "}
        <Link href={`/admin/leads/${touch.leadId}`} className="underline">
          {touch.lead.company.name}
        </Link>
        <br />
        Komu: {touch.contact?.email ?? "—"}
        <br />
        MCP účet: {touch.accountKey ?? touch.sendAccount?.mcpAccountKey ?? "—"}
      </p>
      <pre className="whitespace-pre-wrap rounded border border-border bg-surface p-4 text-sm">
        {touch.bodyText}
      </pre>
      <div>
        <h3 className="mb-2 font-medium">Personalizácia</h3>
        <JsonBlock value={touch.personalization} />
      </div>
      <div>
        <h3 className="mb-2 font-medium">Eventy</h3>
        {touch.events.length === 0 ? (
          <p className="text-sm text-muted">Žiadne eventy.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {touch.events.map((event) => (
              <li key={event.id} className="rounded border border-border p-3">
                {event.type} · {event.createdAt.toLocaleString("sk-SK")}
                {event.payload != null && (
                  <div className="mt-2">
                    <JsonBlock value={event.payload} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
