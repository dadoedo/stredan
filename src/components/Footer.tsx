import { type Locale } from "@/lib/translations";
import { OpensInNewTab } from "@/components/OpensInNewTab";
import { TrackedAnchor } from "@/components/TrackedAnchor";

export default function Footer({ locale }: { locale: Locale }) {
  const companyName = locale === "sk" ? "Stredan s. r. o." : "Stredan Ltd";
  const linkClass = "text-sm underline-offset-2 hover:underline";

  return (
    <footer className="footer-agency py-12">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Dávid Stredánsky
            </p>
            <div className="flex gap-6">
              <TrackedAnchor
                href="mailto:david@stredan.sk"
                className={linkClass}
                event="contact_started"
                eventProps={{ location: "footer", method: "email" }}
              >
                Email
              </TrackedAnchor>
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
            <p className="text-xs">
              {companyName} · IČO 57168504 · DIČ 2122598731 · IČ DPH SK2122598731
            </p>
            <p className="mt-1 text-xs">
              {locale === "sk"
                ? "Registrované podľa §7a, registrácia od 16.9.2025"
                : "Registered under §7a, registration from 16.9.2025"}
            </p>
            <p className="mt-1 text-xs">
              Trieda SNP 1707/59, 974 01 Banská Bystrica
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
