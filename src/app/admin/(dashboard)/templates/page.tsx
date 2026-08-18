import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createEmailTemplate } from "@/actions/leadgen";

export default async function AdminTemplatesPage() {
  const [templates, offers] = await Promise.all([
    prisma.emailTemplate.findMany({
      orderBy: [{ offer: { sortOrder: "asc" } }, { key: "asc" }, { version: "desc" }],
      include: { offer: true },
    }),
    prisma.offer.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Vzorové správy</h2>
      <p className="mt-1 mb-6 max-w-xl text-sm text-muted">
        Obsah je viazaný na offer A–E, nie na mailbox. Odosielací účet (1–5) sa vyberá
        pri sende.
      </p>

      <form
        action={createEmailTemplate}
        className="mb-8 grid gap-3 rounded border border-border p-4 md:grid-cols-2"
      >
        <p className="md:col-span-2 text-sm font-medium">Nová šablóna</p>
        <label className="text-sm">
          Ponuka
          <select
            name="offerId"
            required
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
          >
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.code} · {offer.nameSk}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Kľúč
          <input
            name="key"
            defaultValue="cold-1"
            required
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          Predmet
          <input
            name="subject"
            required
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm md:col-span-2">
          Telá
          <textarea
            name="bodyText"
            rows={6}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded border border-border px-4 py-2 text-sm hover:border-zinc-500"
          >
            Pridať
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-border p-4"
          >
            <div>
              <p className="font-medium">
                {template.offer.code} · {template.key} v{template.version}
                {!template.active && " · vypnutá"}
              </p>
              <p className="text-sm text-muted">{template.subject}</p>
            </div>
            <Link
              href={`/admin/templates/${template.id}`}
              className="rounded border border-border px-3 py-1 text-sm hover:border-zinc-500"
            >
              Upraviť
            </Link>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="py-8 text-center text-muted">Žiadne šablóny. Spusti seed alebo pridaj vyššie.</p>
        )}
      </div>
    </div>
  );
}
