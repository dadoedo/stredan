import { setLocale } from "@/actions/locale";
import type { Locale } from "@/lib/translations";

type LocaleSwitcherProps = {
  locale: Locale;
  className?: string;
};

export default function LocaleSwitcher({ locale, className }: LocaleSwitcherProps) {
  const otherLocale: Locale = locale === "sk" ? "en" : "sk";

  return (
    <form action={setLocale.bind(null, otherLocale)}>
      <button
        type="submit"
        className={`text-sm transition-colors hover:opacity-80 ${className ?? "text-muted hover:text-foreground"}`}
      >
        {otherLocale === "sk" ? "SK" : "EN"}
      </button>
    </form>
  );
}
