import type { Locale } from "@/lib/translations";

export function OpensInNewTab({ locale }: { locale: Locale }) {
  return (
    <span className="sr-only">
      {locale === "sk" ? " (otvorí sa v novom okne)" : " (opens in new tab)"}
    </span>
  );
}
