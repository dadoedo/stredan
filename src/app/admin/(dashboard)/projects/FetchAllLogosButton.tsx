"use client";

import React, { useTransition } from "react";
import { fetchAllProjectLogos } from "@/actions/admin";

export function FetchAllLogosButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = React.useState<{ results: { slug: string; success: boolean; error?: string }[] } | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            const r = await fetchAllProjectLogos();
            setResult(r);
            if (r.results.length > 0) window.location.reload();
          });
        }}
        className="rounded border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-zinc-500 hover:text-foreground disabled:opacity-50"
      >
        {isPending ? "Sťahujem..." : "Stiahnuť logá všetkých"}
      </button>
      {result && (
        <p className="text-xs text-muted">
          {result.results.filter((r) => r.success).length} OK,{" "}
          {result.results.filter((r) => !r.success).length} zlyhalo
          {result.results.some((r) => !r.success) && (
            <>: {result.results.filter((r) => !r.success).map((r) => r.slug).join(", ")}</>
          )}
        </p>
      )}
    </div>
  );
}
