import { type Locale } from "@/lib/translations";

export default function Footer({ locale }: { locale: Locale }) {
  const companyName = locale === "sk" ? "Stredan s. r. o." : "Stredan Ltd";

  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted">
              &copy; {new Date().getFullYear()} Dávid Stredánsky
            </p>
            <div className="flex gap-6">
              <a
                href="mailto:david@stredan.sk"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Email
              </a>
              <a
                href="https://github.com/dadoedo/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                GitHub
              </a>
              <a
                href="https://www.npmjs.com/~davidstredansky"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                npm
              </a>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs text-muted">
              {companyName} · IČO 57168504 · DIČ 2122598731 · IČ DPH SK2122598731
            </p>
            <p className="mt-1 text-xs text-muted">
              {locale === "sk"
                ? "Registrované podľa §7a, registrácia od 16.9.2025"
                : "Registered under §7a, registration from 16.9.2025"}
            </p>
            <p className="mt-1 text-xs text-muted">
              Trieda SNP 1707/59, 974 01 Banská Bystrica
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
