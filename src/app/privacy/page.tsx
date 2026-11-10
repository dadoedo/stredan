import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsOptOut } from "@/components/AnalyticsOptOut";
import { SiteShell } from "@/components/SiteShell";
import { getLocale } from "@/lib/locale";
import { routeMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return routeMetadata({
    path: "/privacy",
    locale,
    title: locale === "sk" ? "Ochrana súkromia | Stredan" : "Privacy | Stredan",
    description:
      locale === "sk"
        ? "Čo stredan.sk ukladá a čo meria. Klik na e-mail ani na kalendár nie je potvrdenie, že správa odišla alebo že termín vznikol."
        : "What stredan.sk stores and measures. A click on email or the calendar is not confirmation that a message was sent or a time was booked.",
  });
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const sk = locale === "sk";

  return (
    <SiteShell locale={locale}>
      <div className="agency-shell py-24">
        <Link href="/" className="agency-text-link">
          ← {sk ? "Domov" : "Home"}
        </Link>
        <h1 className="agency-h2 mt-8">
          {sk ? "Ochrana súkromia" : "Privacy"}
        </h1>
        <p className="agency-lede">
          {sk
            ? "Toto je opis toho, čo stránka robí. Nie je to právne stanovisko a nie je to sľub, že spĺňame konkrétny predpis."
            : "This describes what the site does. It is not a legal opinion, and it is not a promise that we meet a particular statute."}
        </p>

        <h2 className="agency-h2 mt-12">{sk ? "Jazyk" : "Language"}</h2>
        <p className="agency-body">
          {sk
            ? "Cookie NEXT_LOCALE si pamätá slovenčinu alebo angličtinu, aby sa voľba pri ďalšom kliknutí nestratila. Pri prvej návšteve bez tejto cookie dostane slovenčina a čeština slovenskú stránku. Vyššia anglická preferencia prehliadača dostane anglickú. Prepínač jazyka túto voľbu prepíše."
            : "The NEXT_LOCALE cookie remembers Slovak or English so the choice survives the next click. On a first visit without that cookie, Slovak and Czech get the Slovak page. A higher English browser preference gets English. The language switch overwrites that choice."}
        </p>

        <h2 className="agency-h2 mt-12">{sk ? "Meranie" : "Measurement"}</h2>
        <p className="agency-body">
          {sk
            ? "Na ostrom webe stredan.sk a www.stredan.sk môže bežať PostHog so servermi v EÚ. Zaznamenáva zobrazenia stránok a kliknutia, ktoré sme pomenovali: otvorenie kalendára, klik na e-mail, klik na odkaz v texte a zobrazenie ponuky. Lokálny vývoj, náhľady a iné domény táto aplikácia do toho projektu neposiela."
            : "On the live site stredan.sk and www.stredan.sk, PostHog may run with servers in the EU. It records page views and the clicks we named: opening the calendar, clicking an email link, clicking an in-page link, and viewing an offer. Local development, previews, and other domains do not send from this app into that project."}
        </p>
        <p className="agency-body">
          {sk
            ? "Klik na e-mail znamená, že sa otvoril poštový program. Neznamená, že správa odišla. Klik na hovor znamená, že sa otvoril Google kalendár. Neznamená, že termín vznikol. Potvrdenie schôdzky táto stránka neposiela, lebo ho nevie."
            : "An email click means a mail program opened. It does not mean a message was sent. A call click means Google Calendar opened. It does not mean a time was booked. This site does not send a booking confirmation, because it cannot see one."}
        </p>
        <p className="agency-body">
          {sk
            ? "Do týchto udalostí nedávame vašu e-mailovú adresu, meno ani text správy. Nahrávanie obrazovky z tejto stránky nespúšťame."
            : "Those events do not include your email address, your name, or the text of a message. This site does not start session recording."}
        </p>
        <AnalyticsOptOut locale={locale} />

        <h2 className="agency-h2 mt-12">{sk ? "Kontakt" : "Contact"}</h2>
        <p className="agency-body">
          Stredan s. r. o. · IČO 57168504 · Trieda SNP 1707/59, 974 01 Banská
          Bystrica · david@stredan.sk
        </p>
      </div>
    </SiteShell>
  );
}
