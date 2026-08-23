"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  buildLeadsQueryString,
  DEFAULT_SORT,
  DEFAULT_SORT_DIR,
  hasActiveFilters,
  LEAD_STATUSES,
  SKIP_REASONS,
  type ContactFilter,
  type LeadSortField,
  type SortDirection,
} from "@/lib/leads-admin";

const SEARCH_DEBOUNCE_MS = 300;

type LeadsToolbarProps = {
  q?: string;
  status?: string;
  skip?: string;
  contact?: ContactFilter;
  sort?: LeadSortField;
  dir?: SortDirection;
};

export function LeadsToolbar({ q, status, skip, contact, sort, dir }: LeadsToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(q ?? "");
  const [prevQ, setPrevQ] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = { q, status, skip, contact, sort, dir };
  const showReset = hasActiveFilters(query);

  if (q !== prevQ) {
    setPrevQ(q);
    setSearch(q ?? "");
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const navigate = useCallback(
    (next: Record<string, string | undefined>) => {
      startTransition(() => {
        router.push(`/admin/leads${buildLeadsQueryString(next)}`);
      });
    },
    [router],
  );

  const buildQuery = useCallback(
    (patch: Record<string, string | undefined>) => ({
      q: "q" in patch ? patch.q || undefined : q,
      status: "status" in patch ? patch.status || undefined : status,
      skip: "skip" in patch ? patch.skip || undefined : skip,
      contact: "contact" in patch ? patch.contact || undefined : contact,
      sort: sort !== DEFAULT_SORT ? sort : undefined,
      dir: dir !== DEFAULT_SORT_DIR ? dir : undefined,
    }),
    [q, status, skip, contact, sort, dir],
  );

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate(buildQuery({ q: value.trim() || undefined }));
    }, SEARCH_DEBOUNCE_MS);
  };

  const onSelectChange = (field: "status" | "skip" | "contact", value: string) => {
    navigate(buildQuery({ [field]: value || undefined }));
  };

  const controlClass =
    "mt-1 w-full rounded border border-border bg-background px-3 py-2 transition-opacity";

  return (
    <div
      className={`mb-6 flex flex-wrap items-end gap-3 transition-opacity ${isPending ? "opacity-60" : ""}`}
    >
      <label className="min-w-[14rem] flex-1 text-sm">
        <span className="flex items-center gap-2">
          Hľadať
          {isPending && (
            <span className="text-xs font-normal text-muted" aria-live="polite">
              Načítavam…
            </span>
          )}
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Firma, IČO, mesto, email, kontakt…"
          className={controlClass}
          autoComplete="off"
        />
      </label>

      <label className="text-sm">
        Stav
        <select
          value={status ?? ""}
          onChange={(event) => onSelectChange("status", event.target.value)}
          className={`${controlClass} min-w-[10rem]`}
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
          value={skip ?? ""}
          onChange={(event) => onSelectChange("skip", event.target.value)}
          className={`${controlClass} min-w-[10rem]`}
        >
          <option value="">Všetky</option>
          {SKIP_REASONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Kontakt
        <select
          value={contact ?? ""}
          onChange={(event) => onSelectChange("contact", event.target.value)}
          className={`${controlClass} min-w-[10rem]`}
        >
          <option value="">Všetky</option>
          <option value="yes">Má kontakt</option>
          <option value="no">Bez kontaktu</option>
        </select>
      </label>

      {showReset && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            startTransition(() => router.push("/admin/leads"));
          }}
          className="rounded border border-border px-4 py-2 text-sm hover:border-foreground/20 hover:bg-surface-2/60"
        >
          Reset
        </button>
      )}
    </div>
  );
}
