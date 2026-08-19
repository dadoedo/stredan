export function JsonBlock({ value, empty = "—" }: { value: unknown; empty?: string }) {
  if (value == null) {
    return <p className="text-sm text-muted">{empty}</p>;
  }
  return (
    <pre className="max-h-[28rem] overflow-auto rounded-lg border border-border bg-surface-2 p-4 font-mono text-xs leading-relaxed text-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
