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
      <div className="agency-shell py-24">
        <Link
          href="/careers"
          className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          ← {ui.detailBack}
        </Link>
        <p className="agency-kicker mt-8">{ui.listKicker}</p>
        <h1 className="agency-h2 max-w-none sm:text-5xl">{role.title[locale]}</h1>
        <p className="agency-lede max-w-none sm:max-w-[46rem]">
          {role.pitch[locale]}
        </p>

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
          <section key={section.title} className="mt-12">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {section.title}
            </h2>
            <ul className="agency-team-bullets">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="agency-h2 max-w-none">{ui.applyTitle}</h2>
          <p className="agency-body">{ui.applyBody}</p>
          <div className="agency-cta-row">
            <AgencyEmailButton
              href={careerApplyHref(role, locale)}
              eventProps={{ location: "careers", method: "email", role: role.slug }}
            >
              {ui.applyCta} {CAREERS_EMAIL}
            </AgencyEmailButton>
          </div>
          <p className="agency-privacy" id="osobne-udaje">
            {ui.privacy}
          </p>
        </section>
      </div>
    </SiteShell>
  );
}
