export default function LeadsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="h-[58px] min-w-[14rem] flex-1 rounded border border-border bg-surface-2/40" />
        <div className="h-[58px] w-40 rounded border border-border bg-surface-2/40" />
        <div className="h-[58px] w-40 rounded border border-border bg-surface-2/40" />
        <div className="h-[58px] w-40 rounded border border-border bg-surface-2/40" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-10 rounded border border-border bg-surface-2/30" />
        ))}
      </div>
    </div>
  );
}
