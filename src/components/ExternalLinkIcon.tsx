export function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`inline-block size-3.5 shrink-0 align-[-0.15em] ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M3.5 8.5L8.5 3.5M8.5 3.5H5M8.5 3.5V7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
