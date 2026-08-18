import { prisma } from "@/lib/prisma";
import { updateSendAccount } from "@/actions/leadgen";

export default async function AdminAccountsPage() {
  const accounts = await prisma.sendAccount.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold">Odosielacie účty 1–5</h2>
      <p className="mt-1 mb-6 max-w-xl text-sm text-muted">
        Stĺpce matrixu. <code>mcpAccountKey</code> musí sedieť s kľúčom mailboxu na{" "}
        <a href="https://mcp.stredan.sk" className="underline">
          mcp.stredan.sk
        </a>
        . Účet sa aktivuje len keď má kľúč.
      </p>

      <div className="space-y-6">
        {accounts.map((account) => (
          <form
            key={account.id}
            action={updateSendAccount}
            className="grid gap-3 rounded border border-border p-4 md:grid-cols-2"
          >
            <input type="hidden" name="id" value={account.id} />
            <p className="md:col-span-2 font-medium">Účet {account.code}</p>
            <label className="text-sm">
              Názov
              <input
                name="name"
                defaultValue={account.name}
                required
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              MCP account key
              <input
                name="mcpAccountKey"
                defaultValue={account.mcpAccountKey ?? ""}
                placeholder="gmail-david"
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Kanál
              <select
                name="channel"
                defaultValue={account.channel}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              >
                <option value="gmail">gmail</option>
                <option value="resend">resend</option>
                <option value="smtp">smtp</option>
              </select>
            </label>
            <label className="text-sm">
              From
              <input
                name="fromAddress"
                defaultValue={account.fromAddress ?? ""}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Denný cap
              <input
                name="dailyCap"
                type="number"
                min={0}
                defaultValue={account.dailyCap}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              Poznámka
              <input
                name="notes"
                defaultValue={account.notes ?? ""}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={account.active} />
              Aktívny (vyžaduje MCP kľúč)
            </label>
            <div>
              <button
                type="submit"
                className="rounded border border-border px-4 py-2 text-sm hover:border-zinc-500"
              >
                Uložiť {account.code}
              </button>
            </div>
          </form>
        ))}
        {accounts.length === 0 && (
          <p className="text-sm text-muted">Žiadne účty. Spusti npm run seed:leadgen.</p>
        )}
      </div>
    </div>
  );
}
