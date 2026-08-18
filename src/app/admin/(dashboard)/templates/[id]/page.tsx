import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateEmailTemplate } from "@/actions/leadgen";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await prisma.emailTemplate.findUnique({
    where: { id },
    include: { offer: true },
  });
  if (!template) notFound();

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">
        Šablóna {template.offer.code} · {template.key}
      </h2>
      <p className="mt-1 mb-6 text-sm text-muted">{template.offer.nameSk}</p>

      <form action={updateEmailTemplate} className="max-w-2xl space-y-4">
        <input type="hidden" name="id" value={template.id} />
        <label className="block text-sm">
          Kľúč
          <input
            name="key"
            defaultValue={template.key}
            required
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Locale
          <input
            name="locale"
            defaultValue={template.locale}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Verzia
          <input
            name="version"
            type="number"
            min={1}
            defaultValue={template.version}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Predmet
          <input
            name="subject"
            defaultValue={template.subject}
            required
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Telo (text)
          <textarea
            name="bodyText"
            rows={16}
            defaultValue={template.bodyText}
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={template.active} />
          Aktívna
        </label>
        <button
          type="submit"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Uložiť
        </button>
      </form>
    </div>
  );
}
