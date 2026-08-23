"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/translations";
import type { OfferPublic } from "@/lib/offers";
import { AgencyEmailButton } from "@/components/AgencyEmailButton";
import { BookingCallButton } from "@/components/BookingCallButton";
import { EngagementModels } from "@/components/EngagementModels";
import { OpensInNewTab } from "@/components/OpensInNewTab";
import { trackEvent } from "@/lib/analytics";

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
  workEyebrow: string;
  workTitle: string;
  workCaption: string;
  workMeta: string;
  heroAlt: string;
  heroCap: string;
  metricsLabel: string;
  metrics: { value: string; label: string }[];
  howEyebrow: string;
  howTitle: string;
  steps: { n: string; title: string; body: string }[];
  stackEyebrow: string;
  stackTitle: string;
  stackCaption: string;
  stackItems: { label: string; desc: string }[];
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
    headline: "Ušetríme vám týždeň času. Ako ho využijete už určite viete.",
    sub: "Procesy ktoré vás reálne brzdia vieme zrýchliť a zautomatizovať. Nasadenie priamo do prevádzky, reálne výsledky, ušité na mieru.",
    ctaPrimary: "Začnime",
    ctaSecondary: "Pozrite si prácu",
    proofLine:
      "Rovnaká latka ako pri produktoch, ktoré dnes používajú desaťtisíce ľudí. Tentokrát pre vašu firmu.",
    workEyebrow: "Práca",
    workTitle: "Nie sľuby. Veci, ktoré už bežia.",
    workCaption:
      "Štúdiá, trhoviská, aplikácie. Od prvého riadku kódu až po ľudí, ktorí to otvárajú každý deň.",
    workMeta: "OFF.Studio · klient · 2025",
    heroAlt: "OFF. Contrast Therapy: rezervácie a značka",
    heroCap: "OFF.Studio · klient · 2025",
    metricsLabel: "Čísla, nie pocity",
    metrics: [
      { value: "43k+", label: "ľudí na produktoch, ktoré sme spustili" },
      { value: "20+", label: "firiem, ktoré nám už dali dôveru" },
      { value: "1", label: "úzke hrdlo na začiatok. Nie dvadsať projektov." },
    ],
    howEyebrow: "Ako",
    howTitle: "Pomenujeme, čo vás trápi; potom nájdeme riešenie.",
    steps: [
      {
        n: "01",
        title: "Identifikácia a evaluácia",
        body: "Stratené hodiny, nevyužité dáta, príliš veľa ľudskej roboty. Zadefinujeme problém a až potom sa bavíme o riešení.",
      },
      {
        n: "02",
        title: "Nasadíme to u vás",
        body: "Agent, proces, napojenie na to, čo už máte. V utorok ráno to beží, nie v prílohe e-mailu.",
      },
      {
        n: "03",
        title: "Vyhodnotenie",
        body: "Predtým a potom. Ak sa nič nepohlo, končíme. Žiadne doladenie bez dôkazu.",
      },
    ],
    stackEyebrow: "Stack",
    stackTitle: "Nie len ChatGPT v prehliadači.",
    stackCaption:
      "Tieto veci už nasadzujeme do prevádzky; nie na slide.",
    stackItems: [
      {
        label: "RAG",
        desc: "Firemné dokumenty a dáta ako kontext pre AI",
      },
      {
        label: "MCP",
        desc: "Bezpečné napojenie na CRM, e-mail, databázy",
      },
      {
        label: "Cloud Agents",
        desc: "Agenti na serveri, nie v tabe prehliadača",
      },
      {
        label: "Sandboxes",
        desc: "Izolované prostredie pre kód a nástroje",
      },
      {
        label: "AI Agents",
        desc: "Konkrétny proces od vstupu po výsledok",
      },
      {
        label: "Automatizácia",
        desc: "Triggery, workflow, napojenie na systémy",
      },
    ],
    offersEyebrow: "Ako začať",
    offersTitle: "Päť ciest. Vyberte jednu.",
    aboutEyebrow: "Kto za to ručí",
    aboutRole: "Founder · CTO",
    aboutName: "Dávid Stredánsky",
    aboutLead:
      "Stredan je AI & Software štúdio v Bratislave. S tímom šikovných ľudí navrhujeme a budujeme riešenia pre firmy na Slovensku, v Česku, ale aj v zahraničí.",
    aboutBullets: [
      "Viac ako 10 rokov od prvého riadku kódu po systém, ktorý netreba strážiť",
      "AI agenti, automatizácia a vlastný softvér; vždy jeden proces, nie celý chaos naraz",
      "Desaťtisíce používateľov na produktoch a aplikáciách, ktoré sme dodali",
    ],
    aboutCta: "Celý profil",
    finalTitle: "Jedna veta: čo vás spomaľuje.",
    finalSub: "Odpoviem narovinu: audit, agent, alebo „toto AI neriešte“.",
    finalCta: "david@stredan.sk",
    finalNote: "Zvyčajne do jedného pracovného dňa.",
  },
  en: {
    kicker: "For companies that are done collecting tools",
    headline: "Get the week back. Keep the control.",
    sub: "One process that slows you down. In production, at the standard you expect from world-class products. Not a workshop. Not a deck.",
    ctaPrimary: "Put it in production",
    ctaSecondary: "The proof is below",
    proofLine:
      "The same bar as products tens of thousands of people already use. This time, for your company.",
    workEyebrow: "Work",
    workTitle: "Not a promise. Things that run.",
    workCaption:
      "Studios, marketplaces, apps. Designed and shipped end-to-end, from the first line to people who open them every day.",
    workMeta: "OFF.Studio · client · 2025",
    heroAlt: "OFF. Contrast Therapy: booking and brand",
    heroCap: "OFF.Studio · client · 2025",
    metricsLabel: "Numbers, not mood",
    metrics: [
      { value: "43k+", label: "people on products we shipped" },
      { value: "20+", label: "companies that already trusted us" },
      { value: "1", label: "bottleneck to start. Not twenty initiatives." },
    ],
    howEyebrow: "How",
    howTitle: "We name what hurts; then we find the solution.",
    steps: [
      {
        n: "01",
        title: "Identification and evaluation",
        body: "Lost hours, unused data, too much manual work. We define the problem first; only then do we talk solutions.",
      },
      {
        n: "02",
        title: "Ship it into your Tuesday",
        body: "An agent, a workflow, a hook into what you already run. Live in the morning, not attached to an email.",
      },
      {
        n: "03",
        title: "Evaluation",
        body: "Before and after. If it didn’t move, we stop. No ‘we’ll polish it’ without proof.",
      },
    ],
    stackEyebrow: "Stack",
    stackTitle: "More than ChatGPT in a browser tab.",
    stackCaption: "What we actually deploy in production; not on a slide.",
    stackItems: [
      {
        label: "RAG",
        desc: "Company documents and data as AI context",
      },
      {
        label: "MCP",
        desc: "Secure hooks into CRM, email, databases",
      },
      {
        label: "Cloud Agents",
        desc: "Agents on the server, not in a browser tab",
      },
      {
        label: "Sandboxes",
        desc: "Isolated environments for code and tools",
      },
      {
        label: "AI Agents",
        desc: "One workflow from input to outcome",
      },
      {
        label: "Automation",
        desc: "Triggers, workflows, system integrations",
      },
    ],
    offersEyebrow: "How to start",
    offersTitle: "Five doors. Pick one.",
    aboutEyebrow: "Who owns it",
    aboutRole: "Founder · CTO",
    aboutName: "Dávid Stredánsky",
    aboutLead:
      "Stredan is an AI & software studio in Bratislava. With a sharp team, we design and build solutions for companies in Slovakia, Czechia, and abroad.",
    aboutBullets: [
      "10+ years from the first line of code to systems you don’t babysit",
      "AI agents, automation, and custom software; one process at a time, not twenty at once",
      "Tens of thousands of people on products and apps we shipped",
    ],
    aboutCta: "Full profile",
    finalTitle: "One sentence: what eats your Tuesday.",
    finalSub: "I’ll answer straight: audit, agent, or “don’t put AI on this.”",
    finalCta: "david@stredan.sk",
    finalNote: "Usually within one business day.",
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
            <a
              href="#offers"
              className="agency-btn-primary"
              onClick={() =>
                trackEvent("cta_clicked", {
                  location: "hero",
                  target: "offers",
                })
              }
            >
              {t.ctaPrimary}
            </a>
            <a
              href="#work"
              className="agency-btn-secondary"
              onClick={() =>
                trackEvent("cta_clicked", {
                  location: "hero",
                  target: "work",
                })
              }
            >
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

      <section
        className="agency-logos"
        aria-label={locale === "sk" ? "Klienti" : "Clients"}
      >
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
                  onClick={() =>
                    trackEvent("work_clicked", {
                      name: locale === "sk" ? w.titleSk : w.titleEn,
                      url: w.href,
                    })
                  }
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

      <section className="agency-stack">
        <div className="agency-shell">
          <Reveal>
            <p className="agency-section-label">{t.stackEyebrow}</p>
            <h2 className="agency-h2">{t.stackTitle}</h2>
            <p className="agency-body">{t.stackCaption}</p>
          </Reveal>
          <ul className="agency-stack-grid">
            {t.stackItems.map((item) => (
              <li key={item.label} className="agency-stack-item">
                <strong>{item.label}</strong>
                <span>{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="offers" className="agency-offers">
        <div className="agency-shell">
          <Reveal>
            <p className="agency-section-label">{t.offersEyebrow}</p>
            <h2 className="agency-h2">{t.offersTitle}</h2>
            <EngagementModels locale={locale} />
          </Reveal>
          <ol className="agency-offer-list">
            {offers.map((offer) => (
              <li key={offer.slug} className="agency-offer">
                <div>
                  <span className="agency-offer-code">{offer.code}</span>
                  <h3 className="agency-offer-name">{offer.name}</h3>
                  <p className="agency-offer-line">{offer.oneLiner}</p>
                </div>
                <Link
                  href={offer.landingPath}
                  className="agency-offer-cta"
                  onClick={() =>
                    trackEvent("cta_clicked", {
                      location: "home_offers",
                      offer: offer.slug,
                    })
                  }
                >
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
          <div className="agency-cta-row">
            <AgencyEmailButton
              href="mailto:david@stredan.sk"
              eventProps={{ location: "home_final", method: "email" }}
            >
              {t.finalCta}
            </AgencyEmailButton>
            <BookingCallButton
              label={locale === "sk" ? "Rezervovať schôdzku" : "Book a call"}
              campaign="home-final"
              eventProps={{ location: "home_final", method: "booking" }}
            />
          </div>
          <p className="agency-final-note">{t.finalNote}</p>
        </div>
      </section>
    </div>
  );
}
