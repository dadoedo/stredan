import type { Locale } from "@/lib/translations";

/**
 * Open roles for stredan.sk. Edit this file to change copy, dates, and pay.
 *
 * Salary
 * - kind: "base" — set `amountEur` (gross EUR). Both locales format that number.
 * - kind: "placeholder" — shown until a real base figure exists. Slovak job ads
 *   must state the base salary, so do not treat a placeholder as final.
 * Both unfilled roles share SALARY_PLACEHOLDER. Give a role its own figure by
 * switching that role to kind: "base".
 */

export const CAREERS_EMAIL = "david@stredan.sk";

export const CAREERS_SITE = "https://stredan.sk";

/** Shown verbatim after the "Mzda:" / "Salary:" prefix. */
export const SALARY_PLACEHOLDER = {
  sk: "dohodou / TBD",
  en: "by agreement / TBD",
} as const;

export type CareerSalary =
  | {
      kind: "base";
      /** Gross base salary in EUR for the period in `per`. */
      amountEur: number;
      per: "month";
    }
  | {
      kind: "placeholder";
      sk: string;
      en: string;
    };

export type CareerStart =
  | { kind: "date"; iso: string }
  | { kind: "text"; sk: string; en: string };

export type CareerRole = {
  slug: string;
  /** ISO date the ad was published. */
  postedOn: string;
  title: Record<Locale, string>;
  /** One line for the homepage teaser. */
  teaser: Record<Locale, string>;
  pitch: Record<Locale, string>;
  responsibilities: Record<Locale, readonly string[]>;
  lookingFor: Record<Locale, readonly string[]>;
  offer: Record<Locale, readonly string[]>;
  cooperation: Record<Locale, string>;
  location: Record<Locale, string>;
  start: CareerStart;
  /** Schema.org employmentType values. Several when the form is genuinely open. */
  employmentType: readonly string[];
  salary: CareerSalary;
};

const OPEN_START: CareerStart = {
  kind: "text",
  sk: "Dohodou",
  en: "By agreement",
};

export const careers: readonly CareerRole[] = [
  {
    slug: "cmo",
    postedOn: "2026-11-21",
    title: {
      sk: "Chief Marketing Officer",
      en: "Chief Marketing Officer",
    },
    teaser: {
      sk: "Marketing a získavanie klientov. Priamo so zakladateľom.",
      en: "Marketing and client acquisition. Directly with the founder.",
    },
    pitch: {
      sk: "Prevezmete marketing a získavanie klientov Stredanu: positioning, obsah (SEO/AEO), outreach, testy reklamy a značku zakladateľa. Pracujete priamo s Dávidom, bez vrstvy medzi vami.",
      en: "You own Stredan's marketing and client acquisition: positioning, SEO/AEO content, outreach, paid tests, and the founder's public brand. You work directly with Dávid, with nobody in between.",
    },
    responsibilities: {
      sk: [
        "Držať positioning: AI agent na jeden konkrétny proces, vývoj na mieru a AI audit firmy.",
        "SEO a AEO obsah, ktorý prináša dopyty, nie návštevnosť pre návštevnosť.",
        "Outreach a malé testy platenej reklamy s jasným stropom výdavkov.",
        "Pomôcť zakladateľovi vystupovať verejne tak, aby z toho boli rozhovory s klientmi.",
        "Zastaviť to, čo neprináša rozhovory.",
      ],
      en: [
        "Hold the positioning: an AI agent for one concrete process, custom development, and an AI business audit.",
        "SEO and AEO content that brings enquiries, not traffic for its own sake.",
        "Outreach and small paid-ad tests with a clear spend cap.",
        "Help the founder show up in public in a way that turns into client conversations.",
        "Stop what does not lead to conversations.",
      ],
    },
    lookingFor: {
      sk: [
        "B2B marketing služieb alebo softvéru, najlepšie na malom tíme.",
        "Píšete po slovensky aj po anglicky. Stránka aj časť klientov sú v oboch jazykoch.",
        "Na začiatku pod vami nikto nie je. Rozhodujete sami a meriate výsledok.",
        "Počíta sa počet rozhovorov s klientmi, nie objem výstupov.",
      ],
      en: [
        "B2B marketing for services or software, ideally on a small team.",
        "You write in Slovak and English. The site and some clients are in both.",
        "At the start, nobody reports to you. You decide, and you measure.",
        "Client conversations count, not the volume of output.",
      ],
    },
    offer: {
      sk: [
        "Priama práca so zakladateľom. Žiadny stredný manažment.",
        "Celý marketing je váš, od posolstva po kanál, ktorý reálne nosí klientov.",
        "Malá firma. Rozhodnutie netrvá kvartál.",
        "Jedna značka, nie desať klientov agentúry.",
      ],
      en: [
        "Direct work with the founder. No middle management.",
        "The marketing is yours, from the message to the channel that actually brings clients.",
        "A small company. A decision does not take a quarter.",
        "One brand, not an agency roster.",
      ],
    },
    cooperation: {
      sk: "Pracovný pomer na plný úväzok",
      en: "Full-time employment",
    },
    location: {
      sk: "Remote, Slovensko. Osobne v Bratislave, keď to dáva zmysel.",
      en: "Remote, Slovakia. In person in Bratislava when it is useful.",
    },
    start: { kind: "date", iso: "2027-01-01" },
    employmentType: ["FULL_TIME"],
    salary: { kind: "base", amountEur: 3240, per: "month" },
  },
  {
    slug: "admin-assistant",
    postedOn: "2026-11-21",
    title: {
      sk: "Administratívna výpomoc",
      en: "Administrative assistant",
    },
    teaser: {
      sk: "Občasná administratíva, keď je reálne čo robiť.",
      en: "Occasional admin, when there is real work.",
    },
    pitch: {
      sk: "Malá, nepravidelná výpomoc: dokumenty, podklady k faktúram, termíny, údaje a občasný rešerš. Nie je to plný úväzok a hodiny nie sú každý týždeň rovnaké.",
      en: "A small, irregular role: documents, invoice prep, scheduling, data entry, and light research. It is not full-time, and the hours are not the same every week.",
    },
    responsibilities: {
      sk: [
        "Bežná administratíva a poriadok v dokumentoch.",
        "Príprava podkladov k faktúram. Nie účtovníctvo.",
        "Dohadovanie termínov.",
        "Zadávanie údajov.",
        "Ľahký rešerš, keď treba niečo dohľadať.",
      ],
      en: [
        "Day-to-day admin and keeping documents in order.",
        "Preparing the inputs for invoices. Not bookkeeping.",
        "Scheduling.",
        "Data entry.",
        "Light research when something needs looking up.",
      ],
    },
    lookingFor: {
      sk: [
        "Presnosť a spoľahlivosť.",
        "Pokojná práca s dokumentmi, e-mailom a tabuľkami.",
        "Úlohu vezmete a vrátite hotovú, bez doťahovania.",
        "Slovenčina. Angličtina je plus, nie podmienka.",
      ],
      en: [
        "Accuracy and reliability.",
        "Comfortable with documents, email, and spreadsheets.",
        "You take a task and send it back done.",
        "Slovak. English is useful, not required.",
      ],
    },
    offer: {
      sk: [
        "Flexibilné hodiny, len keď je reálna práca.",
        "Remote alebo Bratislava.",
        "Krátke zadanie. Žiadna umelá agenda.",
        "Dohoda alebo čiastočný úväzok.",
      ],
      en: [
        "Flexible hours, only when there is real work.",
        "Remote or Bratislava.",
        "A short brief. No invented busywork.",
        "An agreement (dohoda) or part-time.",
      ],
    },
    cooperation: {
      sk: "Dohoda (podľa potreby) alebo čiastočný úväzok",
      en: "Agreement (dohoda), as needed, or part-time",
    },
    location: {
      sk: "Remote alebo Bratislava",
      en: "Remote or Bratislava",
    },
    start: OPEN_START,
    employmentType: ["PART_TIME"],
    salary: { kind: "placeholder", ...SALARY_PLACEHOLDER },
  },
  {
    slug: "ai-developer",
    postedOn: "2026-11-21",
    title: {
      sk: "Vývojár s AI agentmi",
      en: "AI-enabled developer",
    },
    teaser: {
      sk: "TypeScript, Next.js, Postgres. Dodávate s AI coding agentmi.",
      en: "TypeScript, Next.js, Postgres. You ship with AI coding agents.",
    },
    pitch: {
      sk: "Hľadáme vývojára, ktorý dodáva s AI coding agentmi. Cursor, cloud agenti a podobné nástroje sú súčasť práce. Stack je TypeScript, Next.js a Postgres: AI agenti a integrácie, ktoré u klienta bežia.",
      en: "A developer who ships with AI coding agents. Cursor, cloud agents, and similar tools are part of the job. The stack is TypeScript, Next.js, and Postgres: AI agents and integrations that run for clients.",
    },
    responsibilities: {
      sk: [
        "Dodať AI agentov a integrácie pre klientov, až do prevádzky.",
        "Denne TypeScript, Next.js a Postgres.",
        "Používať Cursor a cloud agentov na dodávku a skontrolovať, čo vygenerujú.",
        "Nechať po sebe kód, ktorý sa dá čítať aj bez agenta.",
      ],
      en: [
        "Ship AI agents and integrations for clients, through to production.",
        "TypeScript, Next.js, and Postgres as the daily stack.",
        "Use Cursor and cloud agents to deliver, and check what they generate.",
        "Leave code that can be read without an agent in the loop.",
      ],
    },
    lookingFor: {
      sk: [
        "Veci, ktoré ste reálne dodali v TypeScripte. Next.js je silné plus.",
        "Praktická práca s Postgresom.",
        "Už používate coding agentov a viete, kedy ich výstup zahodiť.",
        "Zvládnete malý tím a priamy kontakt so zakladateľom.",
      ],
      en: [
        "Things you have actually shipped in TypeScript. Next.js is a strong plus.",
        "Practical work with Postgres.",
        "You already use coding agents, and you know when to throw the output away.",
        "You can work on a small team, in direct contact with the founder.",
      ],
    },
    offer: {
      sk: [
        "Zmluva alebo pracovný pomer, podľa toho, čo sedí obom stranám.",
        "Reálni klienti, nie interné demo.",
        "Remote, Slovensko.",
        "Priama spolupráca so zakladateľom.",
      ],
      en: [
        "Contract or employment, whichever fits both sides.",
        "Real clients, not an internal demo.",
        "Remote, Slovakia.",
        "Direct work with the founder.",
      ],
    },
    cooperation: {
      sk: "Zmluva (kontrakt) alebo pracovný pomer",
      en: "Contract or employment",
    },
    location: {
      sk: "Remote, Slovensko",
      en: "Remote, Slovakia",
    },
    start: OPEN_START,
    employmentType: ["FULL_TIME", "CONTRACTOR"],
    salary: { kind: "placeholder", ...SALARY_PLACEHOLDER },
  },
];

type CareerUi = {
  teaserLabel: string;
  teaserTitle: string;
  teaserLede: string;
  teaserView: string;
  teaserAll: string;
  listKicker: string;
  listTitle: string;
  listLede: string;
  listView: string;
  detailBack: string;
  responsibilities: string;
  lookingFor: string;
  offer: string;
  cooperation: string;
  location: string;
  start: string;
  salary: string;
  applyTitle: string;
  applyBody: string;
  applyCta: string;
  metaTitle: string;
  metaDescription: string;
};

export const careerUi: Record<Locale, CareerUi> = {
  sk: {
    teaserLabel: "Kariéra",
    teaserTitle: "Hľadáme ľudí",
    teaserLede: "Tri otvorené miesta. Napíšte priamo, formulár nemáme.",
    teaserView: "Pozrieť",
    teaserAll: "Všetky pozície",
    listKicker: "Kariéra",
    listTitle: "Hľadáme ľudí",
    listLede:
      "Stredan stavia AI agentov na jeden konkrétny proces, plus vývoj na mieru a AI audity. Tri otvorené miesta.",
    listView: "Pozrieť pozíciu",
    detailBack: "Všetky pozície",
    responsibilities: "Náplň práce",
    lookingFor: "Čo hľadáme",
    offer: "Čo ponúkame",
    cooperation: "Forma spolupráce",
    location: "Miesto",
    start: "Nástup",
    salary: "Mzda",
    applyTitle: "Ako sa prihlásiť",
    applyBody:
      "Do predmetu dajte názov pozície a v pár vetách, prečo sa hlásite. Životopis alebo odkaz na prácu stačí. Formulár nemáme.",
    applyCta: "Napísať na",
    metaTitle: "Kariéra · Stredan",
    metaDescription:
      "Otvorené pozície v Stredan s. r. o.: CMO, administratívna výpomoc a vývojár s AI agentmi. Remote, Slovensko.",
  },
  en: {
    teaserLabel: "Careers",
    teaserTitle: "We're hiring",
    teaserLede: "Three open roles. Write to us directly. There is no form.",
    teaserView: "View",
    teaserAll: "All roles",
    listKicker: "Careers",
    listTitle: "We're hiring",
    listLede:
      "Stredan builds AI agents for one concrete business process, plus custom development and AI audits. Three open roles.",
    listView: "View role",
    detailBack: "All roles",
    responsibilities: "Responsibilities",
    lookingFor: "What we look for",
    offer: "What we offer",
    cooperation: "Form of cooperation",
    location: "Location",
    start: "Start",
    salary: "Salary",
    applyTitle: "How to apply",
    applyBody:
      "Put the role in the subject and a few sentences on why you are writing. A CV or a link to your work is enough. There is no form.",
    applyCta: "Email",
    metaTitle: "Careers · Stredan",
    metaDescription:
      "Open roles at Stredan: CMO, an administrative assistant, and an AI-enabled developer. Remote, Slovakia.",
  },
};

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function groupThousands(amount: number, separator: string): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

export function getCareer(slug: string): CareerRole | undefined {
  return careers.find((role) => role.slug === slug);
}

export function careerSalaryIsPlaceholder(role: CareerRole): boolean {
  return role.salary.kind === "placeholder";
}

/** Value only, without the "Mzda:" / "Salary:" prefix. */
export function careerSalaryValue(role: CareerRole, locale: Locale): string {
  if (role.salary.kind === "placeholder") return role.salary[locale];
  const amount = groupThousands(
    role.salary.amountEur,
    locale === "sk" ? " " : ",",
  );
  if (locale === "sk") {
    return `${amount} € hrubého mesačne (základná zložka)`;
  }
  return `€${amount} gross per month (base)`;
}

/** Full salary line, e.g. "Mzda: dohodou / TBD". */
export function careerSalaryLine(role: CareerRole, locale: Locale): string {
  const prefix = locale === "sk" ? "Mzda" : "Salary";
  return `${prefix}: ${careerSalaryValue(role, locale)}`;
}

export function careerStartLabel(role: CareerRole, locale: Locale): string {
  if (role.start.kind === "text") return role.start[locale];
  const [year, month, day] = role.start.iso.split("-").map(Number);
  if (!year || !month || !day) return role.start.iso;
  if (locale === "sk") return `${day}. ${month}. ${year}`;
  return `${day} ${MONTHS_EN[month - 1] ?? month} ${year}`;
}

export function careerApplyHref(role: CareerRole, locale: Locale): string {
  const subject =
    locale === "sk"
      ? `Prihláška: ${role.title.sk}`
      : `Application: ${role.title.en}`;
  return `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listHtml(items: readonly string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

/** JobPosting JSON-LD. Omits baseSalary when the figure is still a placeholder. */
export function jobPostingJsonLd(role: CareerRole, locale: Locale): string {
  const ui = careerUi[locale];
  const description = [
    `<p>${escapeHtml(role.pitch[locale])}</p>`,
    `<h2>${escapeHtml(ui.responsibilities)}</h2>`,
    listHtml(role.responsibilities[locale]),
    `<h2>${escapeHtml(ui.lookingFor)}</h2>`,
    listHtml(role.lookingFor[locale]),
    `<h2>${escapeHtml(ui.offer)}</h2>`,
    listHtml(role.offer[locale]),
    `<p>${escapeHtml(ui.cooperation)}: ${escapeHtml(role.cooperation[locale])}</p>`,
    `<p>${escapeHtml(ui.location)}: ${escapeHtml(role.location[locale])}</p>`,
    `<p>${escapeHtml(ui.start)}: ${escapeHtml(careerStartLabel(role, locale))}</p>`,
    `<p>${escapeHtml(careerSalaryLine(role, locale))}</p>`,
    `<p>${escapeHtml(ui.applyTitle)}: ${escapeHtml(CAREERS_EMAIL)}</p>`,
  ].join("");

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title[locale],
    description,
    datePosted: role.postedOn,
    inLanguage: locale === "sk" ? "sk" : "en",
    employmentType:
      role.employmentType.length === 1
        ? role.employmentType[0]
        : [...role.employmentType],
    hiringOrganization: {
      "@type": "Organization",
      name: "Stredan s. r. o.",
      sameAs: CAREERS_SITE,
      logo: `${CAREERS_SITE}/logos/stredan.png`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bratislava",
        addressCountry: "SK",
      },
    },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: {
      "@type": "Country",
      name: locale === "sk" ? "Slovensko" : "Slovakia",
    },
    identifier: {
      "@type": "PropertyValue",
      name: "Stredan",
      value: role.slug,
    },
    url: `${CAREERS_SITE}/careers/${role.slug}`,
  };

  if (role.salary.kind === "base" && role.salary.per === "month") {
    data.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: {
        "@type": "QuantitativeValue",
        value: role.salary.amountEur,
        unitText: "MONTH",
      },
    };
  }

  return JSON.stringify(data).replace(/</g, "\\u003c");
}
