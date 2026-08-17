import { type Locale } from "@/lib/translations";
import { OpensInNewTab } from "@/components/OpensInNewTab";

export default function Footer({
  locale,
  variant = "default",
}: {
  locale: Locale;
  variant?: "default" | "agency";
}) {
  const companyName = locale === "sk" ? "Stredan s. r. o." : "Stredan Ltd";
  const isAgency = variant === "agency";
  const linkClass = isAgency
    ? "text-sm underline-offset-2 hover:underline"
    : "text-sm text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:underline";

  return (
    <footer
      className={
        isAgency ? "footer-agency py-12" : "border-t border-border py-12"
      }
    >
      <div className={isAgency ? "mx-auto max-w-[1180px] px-6" : "mx-auto max-w-5xl px-6"}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className={isAgency ? "text-sm" : "text-sm text-muted"}>
              &copy; {new Date().getFullYear()} Dávid Stredánsky
            </p>
            <div className="flex gap-6">
              <a href="mailto:david@stredan.sk" className={linkClass}>
                Email
              </a>
              <a
                href="https://github.com/dadoedo/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                GitHub
                <OpensInNewTab locale={locale} />
              </a>
              <a
                href="https://www.npmjs.com/~davidstredansky"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                npm
                <OpensInNewTab locale={locale} />
              </a>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className={isAgency ? "text-xs" : "text-xs text-muted"}>
              {companyName} · IČO 57168504 · DIČ 2122598731 · IČ DPH SK2122598731
            </p>
            <p className={isAgency ? "mt-1 text-xs" : "mt-1 text-xs text-muted"}>
              {locale === "sk"
                ? "Registrované podľa §7a, registrácia od 16.9.2025"
                : "Registered under §7a, registration from 16.9.2025"}
            </p>
            <p className={isAgency ? "mt-1 text-xs" : "mt-1 text-xs text-muted"}>
              Trieda SNP 1707/59, 974 01 Banská Bystrica
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
