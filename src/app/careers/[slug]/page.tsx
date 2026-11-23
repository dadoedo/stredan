import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgencyEmailButton } from "@/components/AgencyEmailButton";
import { SiteShell } from "@/components/SiteShell";
import {
  CAREERS_EMAIL,
  CAREERS_SITE,
  careerApplyHref,
  careerSalaryLabel,
  careerSalaryValue,
  careerStartLabel,
  careerUi,
  careers,
  getCareer,
  jobPostingJsonLd,
} from "@/data/careers";
import { getLocale } from "@/lib/locale";
import { ogImage } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return careers.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const ui = careerUi[locale];
  const role = getCareer(slug);
  if (!role) {
    return { title: ui.metaTitle, description: ui.metaDescription };
  }

  const title = `${role.title[locale]} · ${ui.metaTitle}`;
  const description = role.pitch[locale];
  const url = `${CAREERS_SITE}/careers/${role.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Stredan",
      locale: locale === "sk" ? "sk_SK" : "en_US",
      type: "website",
      images: [ogImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage(locale)],
    },
  };
}

export default async function CareerDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const ui = careerUi[locale];
  const role = getCareer(slug);
  if (!role) notFound();

  const facts = [
    { label: ui.cooperation, value: role.cooperation[locale] },
    { label: ui.location, value: role.location[locale] },
    { label: ui.start, value: careerStartLabel(role, locale) },
    {
      label: careerSalaryLabel(role, locale),
      value: careerSalaryValue(role, locale),
    },
  ];

  const sections = [
    { title: ui.responsibilities, items: role.responsibilities[locale] },
    { title: ui.lookingFor, items: role.lookingFor[locale] },
    { title: ui.offer, items: role.offer[locale] },
  ];

  return (
    <SiteShell locale={locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jobPostingJsonLd(role, locale),
        }}
      />
      <div className="agency-careers">
        <div className="agency-shell">
        <Link href="/careers" className="agency-text-link agency-career-back">
          ← {ui.detailBack}
        </Link>
        <p className="agency-kicker">{ui.listKicker}</p>
        <h1 className="agency-h1 max-w-none">{role.title[locale]}</h1>
        <p className="agency-lede">{role.pitch[locale]}</p>

        <dl className="agency-facts">
          {facts.map((fact) => (
            <div key={fact.label} className="agency-stack-item">
              <dt>
                <strong>{fact.label}</strong>
              </dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {sections.map((section) => (
          <section key={section.title} className="agency-career-block">
            <h2 className="agency-career-heading">{section.title}</h2>
            <ul className="agency-team-bullets">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="agency-career-apply">
          <h2 className="agency-h2 max-w-none">{ui.applyTitle}</h2>
          <p className="agency-body">{ui.applyBody}</p>
          <div className="agency-cta-row">
            <AgencyEmailButton
              href={careerApplyHref(role, locale)}
              location="careers"
              offer={role.slug}
            >
              {ui.applyCta} {CAREERS_EMAIL}
            </AgencyEmailButton>
          </div>
          <p className="agency-privacy" id="osobne-udaje">
            {ui.privacy}
          </p>
        </section>
        </div>
      </div>
    </SiteShell>
  );
}
