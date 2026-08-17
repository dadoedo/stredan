"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/translations";
import type { OfferPublic } from "@/lib/offers";
import { OpensInNewTab } from "@/components/OpensInNewTab";

const CLIENTS = [
  { name: "Foodient", logo: "/logos/foodient.png" },
  { name: "ViralSky", logo: "/logos/viralsky.png" },
  { name: "SkySnail", logo: "/logos/skysnail.png" },
  { name: "Anderro", logo: "/logos/anderro.png" },
  { name: "OFF.Studio", logo: "/logos/offstudio.png" },
  { name: "AllDevs", logo: "/logos/alldevs.png" },
  { name: "Pozicto", logo: "/logos/pozicto.png" },
  { name: "Frostbox", logo: "/logos/frostbox.png" },
  { name: "AllBooks", logo: "/logos/allbooks.png" },
  { name: "Ligreza", logo: "/logos/ligreza.png" },
  { name: "Stredan", logo: "/logos/stredan.png" },
] as const;

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
    href: "https://bmacademy.sk",
    img: "/work/bma.png",
    featured: false,
    titleSk: "Bratislava Music Academy",
    titleEn: "Bratislava Music Academy",
    lineSk: "Rezervácia skúšobnej hodiny. Nástroj, lektor, termín.",
    lineEn: "Book a trial lesson. Instrument, tutor, slot.",
    metaSk: "Stredan · klient",
    metaEn: "Stredan · client",
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

type Copy = {
  kicker: string;
  headline: string;
  sub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  proofLine: string;
  trustedBy: string;
  workEyebrow: string;
  workTitle: string;
  workCaption: string;
  workMeta: string;
  workMore: string;
  heroAlt: string;
  heroCap: string;
  metricsLabel: string;
  metrics: { value: string; label: string }[];
  howEyebrow: string;
  howTitle: string;
  steps: { n: string; title: string; body: string }[];
  offersEyebrow: string;
  offersTitle: string;
  aboutEyebrow: string;
  aboutRole: string;
  aboutName: string;
  aboutLead: string;
  aboutBullets: string[];
  aboutCta: string;
  finalTitle: string;
  finalSub: string;
  finalCta: string;
  finalNote: string;
};

const copy: Record<Locale, Copy> = {
  sk: {
    kicker: "Pre firmy, ktoré už majú dosť nástrojov",
    headline: "Dostanete týždeň späť. Kontrolu si necháte.",
    sub: "Jeden proces, ktorý vás brzdí. V prevádzke, na úrovni, akú poznáte zo svetových produktov. Nie workshop. Nie prezentácia.",
    ctaPrimary: "Chcem to v prevádzke",
    ctaSecondary: "Pozrite si prácu",
    proofLine:
      "Rovnaká latka ako pri produktoch, ktoré dnes používajú desaťtisíce ľudí. Tentokrát pre vašu firmu.",
    trustedBy: "Infinee · AllDevs · Stredan",
    workEyebrow: "Práca",
    workTitle: "Nie sľuby. Veci, ktoré už bežia.",
    workCaption:
      "Štúdiá, trhoviská, aplikácie. Od prvého riadku kódu až po ľudí, ktorí to otvárajú každý deň.",
    workMeta: "OFF.Studio · klient · 2025",
    workMore: "Výber z Infinee, AllDevs a Stredan",
    heroAlt: "OFF. Contrast Therapy: rezervácie a značka",
    heroCap: "OFF.Studio · klient · 2025",
    metricsLabel: "Čísla, nie pocity",
    metrics: [
      { value: "43k+", label: "ľudí na produktoch, ktoré sme spustili" },
      { value: "4", label: "produkty za 8 mesiacov. Jeden človek na technike" },
      { value: "1", label: "úzke hrdlo na začiatok. Nie dvadsať projektov." },
    ],
    howEyebrow: "Ako",
    howTitle: "Najprv bolesť. Potom softvér.",
    steps: [
      {
        n: "01",
        title: "Pomenujeme, čo vás žerie",
        body: "Hodiny, dopyty, únik dát. Jedna vec. Kým ju nevieme pomenovať, nestaviame.",
      },
      {
        n: "02",
        title: "Nasadíme to u vás",
        body: "Agent, proces, napojenie na to, čo už máte. V utorok ráno to beží, nie v prílohe e-mailu.",
      },
      {
        n: "03",
        title: "Ukážeme číslo",
        body: "Predtým a potom. Ak sa nič nepohlo, končíme. Žiadne doladenie bez dôkazu.",
      },
    ],
    offersEyebrow: "Ako začať",
    offersTitle: "Päť ciest. Vyberte jednu.",
    aboutEyebrow: "Kto za to ručí",
    aboutRole: "Founder · CTO",
    aboutName: "Dávid Stredánsky",
    aboutLead:
      "Stredan je malé štúdio so svetovou latkou. Navrhujem to, píšem to a ručím za to, čo ostane zapnuté, keď z hovoru odídete.",
    aboutBullets: [
      "Viac ako 10 rokov vývoja: od prototypu po prevádzku, ktorú netreba strážiť",
      "Backend pre módny e-shop (CSRetail)",
      "CTO Infinee Labs: Foodient, ViralSky, SkySnail, Anderro. V prevádzke",
    ],
    aboutCta: "Celý profil",
    finalTitle: "Jedna veta: čo vás spomaľuje.",
    finalSub: "Odpoviem narovinu: audit, agent, alebo „toto AI neriešte“.",
    finalCta: "david@stredan.sk",
    finalNote: "Zvyčajne do jedného pracovného dňa. Bez prezentácie.",
  },
  en: {
    kicker: "For companies that are done collecting tools",
    headline: "Get the week back. Keep the control.",
    sub: "One process that slows you down. In production, at the standard you expect from world-class products. Not a workshop. Not a deck.",
    ctaPrimary: "Put it in production",
    ctaSecondary: "The proof is below",
    proofLine:
      "The same bar as products tens of thousands of people already use. This time, for your company.",
    trustedBy: "Infinee · AllDevs · Stredan",
    workEyebrow: "Work",
    workTitle: "Not a promise. Things that run.",
    workCaption:
      "Studios, marketplaces, apps. Designed and shipped end-to-end, from the first line to people who open them every day.",
    workMeta: "OFF.Studio · client · 2025",
    workMore: "Selected from Infinee, AllDevs, and Stredan",
    heroAlt: "OFF. Contrast Therapy: booking and brand",
    heroCap: "OFF.Studio · client · 2025",
    metricsLabel: "Numbers, not mood",
    metrics: [
      { value: "43k+", label: "people on products we shipped" },
      { value: "4", label: "products in 8 months. One technical owner" },
      { value: "1", label: "bottleneck to start. Not twenty initiatives." },
    ],
    howEyebrow: "How",
    howTitle: "Your pain first. Software second.",
    steps: [
      {
        n: "01",
        title: "Name what eats the week",
        body: "Hours, leads, leaking data. One thing. If we can’t name it, we don’t start building.",
      },
      {
        n: "02",
        title: "Ship it into your Tuesday",
        body: "An agent, a workflow, a hook into what you already run. Live in the morning, not attached to an email.",
      },
      {
        n: "03",
        title: "Show the number",
        body: "Before and after. If it didn’t move, we stop. No ‘we’ll polish it’ without proof.",
      },
    ],
    offersEyebrow: "How to start",
    offersTitle: "Five doors. Pick one.",
    aboutEyebrow: "Who owns it",
    aboutRole: "Founder · CTO",
    aboutName: "Dávid Stredánsky",
    aboutLead:
      "Stredan is a small studio with a world-class bar. I design it, write it, and own what stays on after you leave the call.",
    aboutBullets: [
      "10+ years full-stack: prototype through systems people don’t baby-sit",
      "Enterprise backend for fashion e-commerce (CSRetail)",
      "CTO, Infinee Labs: Foodient, ViralSky, SkySnail, Anderro. In production",
    ],
    aboutCta: "Full profile",
    finalTitle: "One sentence: what eats your Tuesday.",
    finalSub: "I’ll answer straight: audit, agent, or “don’t put AI on this.”",
    finalCta: "david@stredan.sk",
    finalNote: "Usually within one business day. No pitch deck.",
  },
};

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

export function AgencyHome({
  locale,
  offers,
}: {
  locale: Locale;
  offers: OfferPublic[];
}) {
  const t = copy[locale];

  return (
    <div className="agency">
      <section className="agency-hero">
        <div className="agency-shell">
          <p className="agency-kicker">{t.kicker}</p>
          <h1 className="agency-h1">{t.headline}</h1>
          <p className="agency-lede">{t.sub}</p>
          <div className="agency-cta-row">
            <Link href="/offers/ai-audit" className="agency-btn-primary">
              {t.ctaPrimary}
            </Link>
            <a href="#work" className="agency-btn-ghost">
              {t.ctaSecondary}
            </a>
          </div>
          <p className="agency-proof">{t.proofLine}</p>
          <ul className="agency-metrics-grid" aria-label={t.metricsLabel}>
            {t.metrics.map((m) => (
              <li key={m.value}>
                <p className="agency-metric-value">{m.value}</p>
                <p className="agency-metric-label">{m.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="agency-logos" aria-label={t.trustedBy}>
        <div className="agency-shell">
          <p className="agency-section-label">{t.trustedBy}</p>
          <ul className="agency-logo-row">
            {CLIENTS.map((c) => (
              <li key={c.name}>
                <img src={c.logo} alt={c.name} className="agency-logo-img" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="work" className="agency-work">
        <div className="agency-shell">
          <div className="agency-work-head">
            <p className="agency-section-label">{t.workEyebrow}</p>
            <h2 className="agency-h2">{t.workTitle}</h2>
            <p className="agency-body">{t.workCaption}</p>
            <p className="agency-work-src">{t.workMore}</p>
          </div>
          <ul className="agency-work-bento">
            {WORK.map((w) => (
              <li
                key={w.href}
                className={
                  w.featured ? "agency-work-card is-featured" : "agency-work-card"
                }
              >
                <a
                  href={w.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="agency-shot"
                >
                  <span className="agency-shot-chrome" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                  <img
                    src={w.img}
                    alt={locale === "sk" ? w.titleSk : w.titleEn}
                    width={1440}
                    height={900}
                  />
                </a>
                <p className="agency-work-card-meta">
                  {locale === "sk" ? w.metaSk : w.metaEn}
                </p>
                <h3 className="agency-work-card-title">
                  {locale === "sk" ? w.titleSk : w.titleEn}
                </h3>
                <p className="agency-work-card-line">
                  {locale === "sk" ? w.lineSk : w.lineEn}
                  <OpensInNewTab locale={locale} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="agency-how">
        <div className="agency-shell">
          <Reveal>
            <p className="agency-section-label">{t.howEyebrow}</p>
            <h2 className="agency-h2">{t.howTitle}</h2>
          </Reveal>
          <ol className="agency-steps">
            {t.steps.map((s) => (
              <li key={s.n}>
                <span className="agency-step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="offers" className="agency-offers">
        <div className="agency-shell">
          <Reveal>
            <p className="agency-section-label">{t.offersEyebrow}</p>
            <h2 className="agency-h2">{t.offersTitle}</h2>
          </Reveal>
          <ol className="agency-offer-list">
            {offers.map((offer) => (
              <li key={offer.slug} className="agency-offer">
                <div>
                  <span className="agency-offer-code">{offer.code}</span>
                  <h3 className="agency-offer-name">{offer.name}</h3>
                  <p className="agency-offer-line">{offer.oneLiner}</p>
                  {offer.priceHint && (
                    <p className="agency-offer-price">{offer.priceHint}</p>
                  )}
                </div>
                <Link href={offer.landingPath} className="agency-offer-cta">
                  {offer.cta}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="agency-about">
        <div className="agency-shell">
          <p className="agency-section-label">{t.aboutEyebrow}</p>
          <article className="agency-team">
            <img
              src="/team/david.webp"
              alt=""
              className="agency-team-photo"
              width={96}
              height={96}
            />
            <div>
              <p className="agency-role">{t.aboutRole}</p>
              <h2 className="agency-team-name">{t.aboutName}</h2>
              <p className="agency-body">{t.aboutLead}</p>
              <ul className="agency-team-bullets">
                {t.aboutBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <Link href="/about" className="agency-text-link">
                {t.aboutCta} →
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="agency-final">
        <div className="agency-shell">
          <h2 className="agency-h2">{t.finalTitle}</h2>
          <p className="agency-lede">{t.finalSub}</p>
          <a href="mailto:david@stredan.sk" className="agency-btn-primary">
            {t.finalCta}
          </a>
          <p className="agency-final-note">{t.finalNote}</p>
        </div>
      </section>
    </div>
  );
}
