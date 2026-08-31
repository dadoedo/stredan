"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  buildCursorQueryString,
  CURSOR_STATUSES,
  CURSOR_STATUS_LABELS,
  hasActiveCursorFilters,
  type CursorStatus,
} from "@/lib/cursor-admin";

const SEARCH_DEBOUNCE_MS = 300;

type CursorToolbarProps = {
  q?: string;
  status?: CursorStatus;
};

export function CursorToolbar({ q, status }: CursorToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(q ?? "");
  const [prevQ, setPrevQ] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showReset = hasActiveCursorFilters({ q, status });

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
        router.push(`/admin/cursor${buildCursorQueryString(next)}`);
      });
    },
    [router],
  );

  const buildQuery = useCallback(
    (patch: Record<string, string | undefined>) => ({
      q: "q" in patch ? patch.q || undefined : q,
      status: "status" in patch ? patch.status || undefined : status,
    }),
    [q, status],
  );

  const onSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate(buildQuery({ q: value.trim() || undefined }));
    }, SEARCH_DEBOUNCE_MS);
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
          placeholder="Handle, meno…"
          className={controlClass}
          autoComplete="off"
        />
      </label>

      <label className="text-sm">
        Stav
        <select
          value={status ?? ""}
          onChange={(event) =>
            navigate(buildQuery({ status: event.target.value || undefined }))
          }
          className={`${controlClass} min-w-[12rem]`}
        >
          <option value="">Všetky stavy</option>
          {CURSOR_STATUSES.map((value) => (
            <option key={value} value={value}>
              {CURSOR_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      {showReset && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            startTransition(() => router.push("/admin/cursor"));
          }}
          className="rounded border border-border px-4 py-2 text-sm hover:border-foreground/20 hover:bg-surface-2/60"
        >
          Reset
        </button>
      )}
    </div>
  );
}
