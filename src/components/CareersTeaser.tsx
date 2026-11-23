import Link from "next/link";
import {
  careerSalaryLine,
  careerStartLabel,
  careerUi,
  careers,
} from "@/data/careers";
import type { Locale } from "@/lib/translations";

export function CareersTeaser({ locale }: { locale: Locale }) {
  const ui = careerUi[locale];

  return (
    <section className="agency-hiring" aria-labelledby="careers-teaser-title">
      <div className="agency-shell">
        <div className="agency-label-row">
          <p className="agency-section-label">{ui.teaserLabel}</p>
          <span className="agency-pill">
            {locale === "en" ? "Open roles" : "Otvorené pozície"}
          </span>
        </div>
        <h2 id="careers-teaser-title" className="agency-h2">
          {ui.teaserTitle}
        </h2>
        <p className="agency-body">{ui.teaserLede}</p>
        <ul className="agency-offer-list">
          {careers.map((role) => (
            <li key={role.slug} className="agency-offer">
              <div>
                <h3 className="agency-offer-name">{role.title[locale]}</h3>
                <p className="agency-offer-line">{role.teaser[locale]}</p>
                <p className="agency-offer-price">
                  {role.cooperation[locale]} · {careerStartLabel(role, locale)}
                </p>
                <p className="agency-offer-salary">{careerSalaryLine(role, locale)}</p>
              </div>
              <Link href={`/careers/${role.slug}`} className="agency-offer-cta">
                {ui.teaserView}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/careers" className="agency-text-link">
          {ui.teaserAll} →
        </Link>
      </div>
    </section>
  );
}
