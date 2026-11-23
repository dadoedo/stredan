import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import {
  CAREERS_SITE,
  careerSalaryLine,
  careerStartLabel,
  careerUi,
  careers,
} from "@/data/careers";
import { getLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ui = careerUi[locale];
  const title = ui.metaTitle;
  const description = ui.metaDescription;

  return {
    title,
    description,
    alternates: { canonical: `${CAREERS_SITE}/careers` },
    openGraph: {
      title,
      description,
      url: `${CAREERS_SITE}/careers`,
      siteName: "Stredan",
      locale: locale === "sk" ? "sk_SK" : "en_US",
      type: "website",
    },
  };
}

export default async function CareersPage() {
  const locale = await getLocale();
  const ui = careerUi[locale];

  return (
    <SiteShell locale={locale}>
      <div className="agency-careers">
        <div className="agency-shell">
        <p className="agency-kicker">{ui.listKicker}</p>
        <h1 className="agency-h1 max-w-none">{ui.listTitle}</h1>
        <p className="agency-lede">{ui.listLede}</p>

        <ul className="agency-offer-list">
          {careers.map((role) => {
            const salary = careerSalaryLine(role, locale);
            return (
              <li key={role.slug} className="agency-offer">
                <div>
                  <h2 className="agency-offer-name">{role.title[locale]}</h2>
                  <p className="agency-offer-line">{role.pitch[locale]}</p>
                  <p className="agency-offer-price">
                    {role.cooperation[locale]} · {careerStartLabel(role, locale)}
                  </p>
                  <p className="agency-offer-salary">{salary}</p>
                </div>
                <Link
                  href={`/careers/${role.slug}`}
                  className="agency-offer-cta"
                >
                  {ui.listView}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-10">
          <a href="#osobne-udaje" className="agency-text-link">
            {ui.privacyLink}
          </a>
        </p>
        <section id="osobne-udaje" className="agency-career-note">
          <h2 className="agency-career-heading">{ui.privacyTitle}</h2>
          <p className="agency-privacy">{ui.privacy}</p>
        </section>
        </div>
      </div>
    </SiteShell>
  );
}
