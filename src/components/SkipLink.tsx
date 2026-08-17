import type { Locale } from "@/lib/translations";

export function SkipLink({ locale }: { locale: Locale }) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
    >
      {locale === "sk" ? "Preskočiť na obsah" : "Skip to main content"}
    </a>
  );
}
