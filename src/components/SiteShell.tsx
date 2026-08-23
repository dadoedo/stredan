import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Locale } from "@/lib/translations";

export function SiteShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <div className="agency-page">
      <Header locale={locale} />
      <main id="main-content">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
