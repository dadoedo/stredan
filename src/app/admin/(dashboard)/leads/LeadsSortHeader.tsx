import Link from "next/link";
import {
  buildLeadsQueryString,
  sortLinkDir,
  type LeadSortField,
  type SortDirection,
} from "@/lib/leads-admin";

type LeadsSortHeaderProps = {
  label: string;
  field: LeadSortField;
  currentSort: LeadSortField;
  currentDir: SortDirection;
  query: Record<string, string | undefined>;
};

export function LeadsSortHeader({
  label,
  field,
  currentSort,
  currentDir,
  query,
}: LeadsSortHeaderProps) {
  const isActive = currentSort === field;
  const nextDir = sortLinkDir(currentSort, currentDir, field);

  return (
    <th className="border-b border-border px-3 py-2 font-medium">
      <Link
        href={`/admin/leads${buildLeadsQueryString({ ...query, sort: field, dir: nextDir })}`}
        className={`inline-flex items-center gap-1 hover:underline ${isActive ? "text-foreground" : "text-muted"}`}
      >
        {label}
        {isActive && <span aria-hidden>{currentDir === "desc" ? "↓" : "↑"}</span>}
      </Link>
    </th>
  );
}
