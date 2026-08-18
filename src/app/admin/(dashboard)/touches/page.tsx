import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminTouchesPage() {
  const touches = await prisma.touch.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      offer: true,
      sendAccount: true,
      contact: true,
      lead: { include: { company: true } },
    },
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Odoslané správy</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Každý send musí mať Touch riadok s offer × účet (bunka matrixu).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="border-b border-border px-3 py-2 font-medium">Kedy</th>
              <th className="border-b border-border px-3 py-2 font-medium">Bunka</th>
              <th className="border-b border-border px-3 py-2 font-medium">Firma</th>
              <th className="border-b border-border px-3 py-2 font-medium">Komu</th>
              <th className="border-b border-border px-3 py-2 font-medium">Predmet</th>
              <th className="border-b border-border px-3 py-2 font-medium">Stav</th>
            </tr>
          </thead>
          <tbody>
            {touches.map((touch) => (
              <tr key={touch.id}>
                <td className="border-b border-border px-3 py-2 text-muted">
                  {(touch.sentAt ?? touch.createdAt).toLocaleString("sk-SK")}
                </td>
                <td className="border-b border-border px-3 py-2">
                  {touch.offer.code}×{touch.sendAccount?.code ?? "?"}
                </td>
                <td className="border-b border-border px-3 py-2">
                  <Link href={`/admin/leads/${touch.leadId}`} className="hover:underline">
                    {touch.lead.company.name}
                  </Link>
                </td>
                <td className="border-b border-border px-3 py-2">
                  {touch.contact?.email ?? "—"}
                </td>
                <td className="border-b border-border px-3 py-2">
                  <Link href={`/admin/touches/${touch.id}`} className="hover:underline">
                    {touch.subject}
                  </Link>
                </td>
                <td className="border-b border-border px-3 py-2">{touch.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {touches.length === 0 && (
          <p className="py-8 text-center text-muted">Zatiaľ žiadne odoslania.</p>
        )}
      </div>
    </div>
  );
}
