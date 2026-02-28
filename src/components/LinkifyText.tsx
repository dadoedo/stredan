/**
 * Renders text with URLs as clickable links.
 */
export function LinkifyText({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("http") ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-zinc-500 underline-offset-2 transition-colors hover:decoration-foreground"
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
}
