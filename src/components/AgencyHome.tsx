"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/translations";
import { AgencyEmailButton } from "@/components/AgencyEmailButton";
import { BookingCallButton } from "@/components/BookingCallButton";
import { OpensInNewTab } from "@/components/OpensInNewTab";
import { trackEvent } from "@/lib/analytics";
import { homeCopy } from "@/lib/home-copy";

const CLIENTS = [
  { name: "Foodient", logo: "/logos/foodient.png", href: "https://foodient.app" },
  { name: "ViralSky", logo: "/logos/viralsky.png", href: "https://viralsky.ai" },
  { name: "SkySnail", logo: "/logos/skysnail.png", href: "https://skysnail.io" },
  { name: "Anderro", logo: "/logos/anderro.png", href: "https://anderro.com" },
  { name: "OFF.Studio", logo: "/logos/offstudio.png", href: "https://offstudio.sk" },
  { name: "AllDevs", logo: "/logos/alldevs.png", href: "https://alldevs.cz" },
  { name: "Pozicto", logo: "/logos/pozicto.png", href: "https://pozic.to" },
  { name: "Frostbox", logo: "/logos/frostbox.png", href: "https://frostbox.sk" },
  { name: "Ligreza", logo: "/logos/ligreza.png", href: "https://ligreza.sk" },
  { name: "AskData", logo: "/logos/askdata.svg", href: "https://askdata.sk" },
  {
    name: "Bratislava Music Academy",
    logo: "/logos/bma.svg",
    href: "https://app.bratislavamusicacademy.sk",
    wide: true,
  },
  {
    name: "Autofino",
    logo: "/logos/autofino.svg",
    href: "https://autofino.sk",
    wide: true,
  },
  {
    name: "Future Practice",
    logo: "/logos/futurepractice.svg",
    href: "https://www.futurepractice.com",
    wide: true,
  },
  {
    name: "ClientUp",
    logo: "/logos/clientup.svg",
    href: "https://clientup.io",
    wide: true,
  },
] as const;

function ClientLogosMarquee({ locale }: { locale: Locale }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const track = reduceMotion ? [...CLIENTS] : [...CLIENTS, ...CLIENTS];

  return (
    <div className="agency-logo-marquee">
      <ul className="agency-logo-track">
        {track.map((client, index) => (
          <li key={`${client.name}-${index}`}>
            <a
              href={client.href}
              target="_blank"
              rel="noopener noreferrer"
              className="agency-logo-link"
              aria-label={client.name}
            >
              <img
                src={client.logo}
                alt=""
                className={
                  "wide" in client && client.wide
                    ? "agency-logo-img is-wide"
                    : "agency-logo-img"
                }
                width={120}
                height={32}
                loading="lazy"
                decoding="async"
              />
              <OpensInNewTab locale={locale} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const WORK = [
  {
    href: "https://anderro.com",
    img: "/work/anderro.png",
    featured: true,
    titleSk: "Anderro",
    titleEn: "Anderro",
    lineSk: "Affiliate programy. Kliky, konverzie, výplaty. V prevádzke.",
    lineEn: "Affiliate programs. Clicks, conversions, payouts. In production.",
    metaSk: "Infinee · produkt",
    metaEn: "Infinee · product",
  },
  {
    href: "https://app.bratislavamusicacademy.sk",
    img: "/work/bma.png",
    featured: false,
    titleSk: "Bratislava Music Academy",
    titleEn: "Bratislava Music Academy",
    lineSk:
      "Nie len rezervácie. Celý interný systém: lektori, žiaci, admin, evidencia, SMS, upozornenia.",
    lineEn:
      "Not just booking. Full internal system: tutors, students, admin, records, SMS, alerts.",
    metaSk: "Stredan · spolupráca",
    metaEn: "Stredan · collaboration",
  },
  {
    href: "https://foodient.app",
    img: "/work/foodient.webp",
    featured: false,
    titleSk: "Foodient",
    titleEn: "Foodient",
    lineSk: "Fotka taniera. Verdikt, či to smieš jesť. Web, iOS, Android.",
    lineEn: "A photo of the plate. A verdict on whether you can eat it. Web, iOS, Android.",
    metaSk: "Infinee · produkt",
    metaEn: "Infinee · product",
  },
  {
    href: "https://viralsky.ai",
    img: "/work/viralsky.png",
    featured: false,
    titleSk: "ViralSky",
    titleEn: "ViralSky",
    lineSk: "Správa dnu. LinkedIn post von. Znie ako človek.",
    lineEn: "A news URL in. A LinkedIn post out. Sounds like a person.",
    metaSk: "Infinee · produkt",
    metaEn: "Infinee · product",
  },
  {
    href: "https://skysnail.io",
    img: "/work/skysnail.png",
    featured: false,
    titleSk: "SkySnail",
    titleEn: "SkySnail",
    lineSk: "Thumbnaily pre YouTube. Generuješ, upravíš, stiahneš.",
    lineEn: "YouTube thumbnails. Generate, edit, download.",
    metaSk: "Infinee · produkt",
    metaEn: "Infinee · product",
  },
] as const;

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`agency-reveal ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function IntroCallButton({
  locale,
  location,
  className = "agency-btn-primary",
}: {
  locale: Locale;
  location: string;
  className?: string;
}) {
  return (
    <BookingCallButton
      label={homeCopy[locale].cta}
      className={className}
      campaign={`intro-${location}`}
      eventProps={{ location }}
    />
  );
}

export function AgencyHome({ locale }: { locale: Locale }) {
  const t = homeCopy[locale];
  const auditMail = `mailto:david@stredan.sk?subject=${encodeURIComponent(t.auditSubject)}`;
  const customMail = `mailto:david@stredan.sk?subject=${encodeURIComponent(t.customSubject)}`;

  return (
    <div className="agency">
      <section className="agency-hero">
        <picture className="agency-hero-media">
          <source
            media="(min-width: 720px)"
            srcSet="/team/david-hero-desktop.webp"
            type="image/webp"
          />
          <source
            media="(max-width: 719px)"
            srcSet="/team/david-hero-mobile-640.webp 640w, /team/david-hero-mobile.webp 864w"
            sizes="100vw"
            type="image/webp"
          />
          <img
            src="/team/david-hero-desktop.webp"
            alt={t.heroAlt}
            width={1280}
            height={720}
            decoding="async"
          />
        </picture>
        <div className="agency-shell">
          <div className="agency-hero-copy">
            <p className="agency-kicker">{t.kicker}</p>
            <h1 className="agency-h1">
              <span className="agency-hero-title-full">{t.headline}</span>
              <span className="agency-hero-title-short" aria-hidden="true">
                {t.mobileTitle[0]}
                <br />
                {t.mobileTitle[1]}
              </span>
            </h1>
            <p className="agency-lede">{t.lede}</p>
            <div className="agency-cta-row">
              <IntroCallButton locale={locale} location="hero" />
            </div>
            <AgencyEmailButton
              href="mailto:david@stredan.sk"
              className="agency-text-link agency-hero-mail"
              location="hero"
            >
              {t.email}
            </AgencyEmailButton>
            <p className="agency-cta-note">{t.note}</p>
          </div>
        </div>
      </section>
      <div className="agency-hero-detail">
        <div className="agency-shell">
          <p className="agency-lede">{t.lede}</p>
          <AgencyEmailButton
            href="mailto:david@stredan.sk"
            className="agency-text-link agency-hero-mail"
            location="hero-detail"
          >
            {t.email}
          </AgencyEmailButton>
          <p className="agency-cta-note">{t.note}</p>
        </div>
      </div>

      <section className="agency-trust" aria-labelledby="founder-heading">
        <div className="agency-shell">
          <article className="agency-trust-card">
            <img
              src="/team/david-portrait.webp"
              srcSet="/team/david-portrait-480.webp 480w, /team/david-portrait.webp 800w"
              sizes="148px"
              alt={t.founderAlt}
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
            />
            <div>
              <p className="agency-section-label">{t.founderEyebrow}</p>
              <h2 id="founder-heading" className="agency-team-name">
                {t.founderName}
              </h2>
              <p className="agency-role">{t.founderRole}</p>
              <p className="agency-body">{t.founderLead}</p>
              <Link href="/about" className="agency-text-link">
                {t.founderCta} →
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section id="ponuka" className="agency-offers">
        <div className="agency-shell">
          <Reveal>
            <p className="agency-section-label">{t.offerEyebrow}</p>
            <h2 className="agency-h2">{t.offerTitle}</h2>
            <p className="agency-body">{t.offerLead}</p>
          </Reveal>
          <div className="agency-bounds">
            <div>
              <h3>{t.includedTitle}</h3>
              <ul>
                {t.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="agency-bounds-out">
              <h3>{t.excludedTitle}</h3>
              <ul>
                {t.excluded.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="agency-cta-row">
            <IntroCallButton locale={locale} location="offer" />
          </div>
          <div className="agency-paths">
            <article className="agency-path">
              <h3>{t.auditTitle}</h3>
              <p>{t.auditBody}</p>
              <AgencyEmailButton
                href={auditMail}
                className="agency-btn-secondary"
                location="home_audit"
                offer="ai-audit"
              >
                {t.auditCta}
              </AgencyEmailButton>
              <Link
                href="/offers/ai-audit"
                className="agency-text-link"
                onClick={() =>
                  trackEvent("cta_clicked", {
                    location: "home_audit",
                    target: "ai-audit",
                  })
                }
              >
                {t.auditMore} →
              </Link>
            </article>
            <article className="agency-path">
              <h3>{t.customTitle}</h3>
              <p>{t.customBody}</p>
              <AgencyEmailButton
                href={customMail}
                className="agency-btn-secondary"
                location="home_custom"
                offer="custom-ai-app"
              >
                {t.customCta}
              </AgencyEmailButton>
              <Link
                href="/offers/custom-ai-app"
                className="agency-text-link"
                onClick={() =>
                  trackEvent("cta_clicked", {
                    location: "home_custom",
                    target: "custom-ai-app",
                  })
                }
              >
                {t.customMore} →
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section id="postup" className="agency-how">
        <div className="agency-shell">
          <Reveal>
            <p className="agency-section-label">{t.howEyebrow}</p>
            <h2 className="agency-h2">{t.howTitle}</h2>
          </Reveal>
          <ol className="agency-steps">
            {t.steps.map((step) => (
              <li key={step.n}>
                <span className="agency-step-n">{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="priklady" className="agency-examples">
        <div className="agency-shell">
          <p className="agency-section-label">{t.examplesEyebrow}</p>
          <h2 className="agency-h2">{t.examplesTitle}</h2>
          <p className="agency-body">{t.examplesNote}</p>
          <ul className="agency-examples-grid">
            {t.examples.map((example) => (
              <li key={example.title} className="agency-example">
                <p className="agency-example-tag">{t.exampleTag}</p>
                <h3>{example.title}</h3>
                <p>{example.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="agency-logos"
        aria-label={t.logoLabel}
      >
        <p className="agency-logo-caption">{t.logoLabel}</p>
        <ClientLogosMarquee locale={locale} />
      </section>

      <section id="work" className="agency-work">
        <div className="agency-shell">
          <div className="agency-work-head">
            <p className="agency-section-label">{t.workEyebrow}</p>
            <h2 className="agency-h2">{t.workTitle}</h2>
            <p className="agency-body">{t.workCaption}</p>
          </div>
          <ul className="agency-work-bento">
            {WORK.map((item) => (
              <li
                key={item.href}
                className={
                  item.featured ? "agency-work-card is-featured" : "agency-work-card"
                }
              >
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="agency-shot"
                  onClick={() =>
                    trackEvent("work_clicked", {
                      name: locale === "sk" ? item.titleSk : item.titleEn,
                      url: item.href,
                    })
                  }
                >
                  <span className="agency-shot-chrome" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                  <img
                    src={item.img}
                    alt={locale === "sk" ? item.titleSk : item.titleEn}
                    width={1440}
                    height={900}
                  />
                </a>
                <p className="agency-work-card-meta">
                  {locale === "sk" ? item.metaSk : item.metaEn}
                </p>
                <h3 className="agency-work-card-title">
                  {locale === "sk" ? item.titleSk : item.titleEn}
                </h3>
                <p className="agency-work-card-line">
                  {locale === "sk" ? item.lineSk : item.lineEn}
                  <OpensInNewTab locale={locale} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="otazky" className="agency-faq-section">
        <div className="agency-shell">
          <p className="agency-section-label">{t.faqEyebrow}</p>
          <h2 className="agency-h2">{t.faqTitle}</h2>
          <div className="agency-faq">
            {t.faq.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="kontakt" className="agency-final">
        <div className="agency-shell">
          <h2 className="agency-h2">{t.finalTitle}</h2>
          <p className="agency-lede">{t.finalSub}</p>
          <div className="agency-cta-row">
            <IntroCallButton locale={locale} location="contact" />
            <AgencyEmailButton
              href="mailto:david@stredan.sk"
              className="agency-btn-secondary"
              location="contact"
            >
              david@stredan.sk
            </AgencyEmailButton>
          </div>
          <p className="agency-final-note">{t.note}</p>
        </div>
      </section>
    </div>
  );
}
