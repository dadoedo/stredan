export function JsonBlock({ value, empty = "—" }: { value: unknown; empty?: string }) {
  if (value == null) {
    return <p className="text-sm text-muted">{empty}</p>;
  }
  return (
    <pre className="max-h-[28rem] overflow-auto rounded border border-border bg-surface p-3 text-xs leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
