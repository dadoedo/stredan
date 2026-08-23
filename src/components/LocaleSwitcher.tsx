"use client";

"use client";

import { setLocale } from "@/actions/locale";
import { ui, type Locale } from "@/lib/translations";
import { trackEvent } from "@/lib/analytics";

type LocaleSwitcherProps = {
  locale: Locale;
  className?: string;
};

export default function LocaleSwitcher({ locale, className }: LocaleSwitcherProps) {
  const otherLocale: Locale = locale === "sk" ? "en" : "sk";
  const t = ui[locale];

  return (
    <form action={setLocale.bind(null, otherLocale)}>
      <button
        type="submit"
        aria-label={otherLocale === "sk" ? t.switchToSlovak : t.switchToEnglish}
        className={`min-h-11 min-w-11 px-2 text-sm transition-colors hover:opacity-80 ${className ?? "text-muted hover:text-foreground"}`}
        onClick={() =>
          trackEvent("locale_changed", { from: locale, to: otherLocale })
        }
      >
        {otherLocale === "sk" ? "SK" : "EN"}
      </button>
    </form>
  );
}
