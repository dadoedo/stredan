import Link from "next/link";
import { LEAD_STATUSES, SKIP_REASONS } from "@/lib/leads-admin";

type LeadsToolbarProps = {
  q?: string;
  status?: string;
  skip?: string;
};

export function LeadsToolbar({ q, status, skip }: LeadsToolbarProps) {
  const hasFilters = Boolean(q || status || skip);

  return (
    <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
      <label className="min-w-[14rem] flex-1 text-sm">
        Hľadať
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Firma, IČO, mesto, email, kontakt…"
          className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
        />
      </label>

      <label className="text-sm">
        Stav
        <select
          name="status"
          defaultValue={status ?? ""}
          className="mt-1 block w-full min-w-[10rem] rounded border border-border bg-background px-3 py-2"
        >
          <option value="">Všetky stavy</option>
          {LEAD_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Skip dôvod
        <select
          name="skip"
          defaultValue={skip ?? ""}
          className="mt-1 block w-full min-w-[10rem] rounded border border-border bg-background px-3 py-2"
        >
          <option value="">Všetky</option>
          {SKIP_REASONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="rounded border border-border px-4 py-2 text-sm hover:border-foreground/20 hover:bg-surface-2/60"
      >
        Filtrovať
      </button>

      {hasFilters && (
        <Link
          href="/admin/leads"
          className="rounded border border-border px-4 py-2 text-sm hover:border-foreground/20 hover:bg-surface-2/60"
        >
          Reset
        </Link>
      )}
    </form>
  );
}
