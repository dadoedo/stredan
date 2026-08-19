import Link from "next/link";
import { buildLeadsQueryString, clampPage } from "@/lib/leads-admin";

type LeadsPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  query: Record<string, string | undefined>;
};

export function LeadsPagination({ page, pageSize, total, query }: LeadsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = clampPage(page, total, pageSize);
  if (totalPages <= 1) return null;

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted">
        {from}–{to} z {total}
      </p>

      <div className="flex items-center gap-2">
        {safePage > 1 ? (
          <Link
            href={`/admin/leads${buildLeadsQueryString(query, safePage - 1)}`}
            className="rounded border border-border px-3 py-1.5 hover:border-foreground/20 hover:bg-surface-2/60"
          >
            Predchádzajúca
          </Link>
        ) : (
          <span className="rounded border border-border px-3 py-1.5 text-muted">Predchádzajúca</span>
        )}

        <span className="px-2 text-muted">
          Strana {safePage} / {totalPages}
        </span>

        {safePage < totalPages ? (
          <Link
            href={`/admin/leads${buildLeadsQueryString(query, safePage + 1)}`}
            className="rounded border border-border px-3 py-1.5 hover:border-foreground/20 hover:bg-surface-2/60"
          >
            Ďalšia
          </Link>
        ) : (
          <span className="rounded border border-border px-3 py-1.5 text-muted">Ďalšia</span>
        )}
      </div>
    </div>
  );
}
