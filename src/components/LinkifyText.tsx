import type { Locale } from "@/lib/translations";
import { OpensInNewTab } from "@/components/OpensInNewTab";

/**
 * Renders text with URLs as clickable links.
 */
export function LinkifyText({
  text,
  locale = "en",
}: {
  text: string;
  locale?: Locale;
}) {
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
            className="text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-foreground"
          >
            {part}
            <OpensInNewTab locale={locale} />
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}
