import type { Locale } from "@/lib/translations";

/**
 * Open roles for stredan.sk. Edit this file to change copy, dates, and pay.
 *
 * Salary (`amountEur` is gross EUR; both locales format that number):
 * - kind: "base" — exact monthly base.
 * - kind: "from-base" — monthly minimum. Optional `note` is appended.
 * - kind: "hourly-base" — exact hourly amount. Do not round it.
 */

export const CAREERS_EMAIL = "david@stredan.sk";

export const CAREERS_SITE = "https://stredan.sk";

export type CareerSalary =
  | {
      kind: "base";
      /** Exact gross base salary in EUR per month. */
      amountEur: number;
      per: "month";
    }
  | {
      kind: "from-base";
      /** Monthly minimum, gross EUR. */
      amountEur: number;
      per: "month";
      note?: Record<Locale, string>;
    }
  | {
      kind: "hourly-base";
      /** Exact gross EUR per hour. Keep the decimals; do not round. */
      amountEur: number;
      note?: Record<Locale, string>;
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
    salary: {
      kind: "from-base",
      amountEur: 2800,
      per: "month",
      note: {
        sk: "podľa znalostí a skúseností",
        en: "depending on knowledge and experience",
      },
    },
  },
  {
    slug: "admin-assistant",
    postedOn: "2026-11-21",
    title: {
      sk: "Administratívna výpomoc (m/ž)",
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
        "Dohoda o vykonaní práce. Nepravidelná výpomoc, najviac 350 hodín v kalendárnom roku.",
      ],
      en: [
        "Flexible hours, only when there is real work.",
        "Remote or Bratislava.",
        "A short brief. No invented busywork.",
        "Agreement on work performance (DoVP). Irregular help, at most 350 hours per calendar year.",
      ],
    },
    cooperation: {
      sk: "Dohoda o vykonaní práce. Nepravidelná výpomoc, najviac 350 hodín v kalendárnom roku.",
      en: "Agreement on work performance (DoVP). Irregular help, at most 350 hours per calendar year.",
    },
    location: {
      sk: "Remote alebo Bratislava",
      en: "Remote or Bratislava",
    },
    start: OPEN_START,
    employmentType: ["TEMPORARY", "PART_TIME"],
    salary: {
      kind: "hourly-base",
      amountEur: 5.259,
      note: {
        sk: "Vypláca sa za vykonanú prácu, v rozsahu najviac 350 hodín v kalendárnom roku.",
        en: "Paid for work performed, up to 350 hours per calendar year.",
      },
    },
  },
  {
    slug: "ai-developer",
    postedOn: "2026-11-21",
    title: {
      sk: "Vývojár / vývojárka s AI agentmi",
      en: "AI-enabled developer",
    },
    teaser: {
      sk: "Dodávate s AI coding agentmi. Nástroje volíme podľa projektu.",
      en: "You ship with AI coding agents. We pick the tools per project.",
    },
    pitch: {
      sk: "Hľadáme človeka, ktorý s AI coding agentmi dodá klientovi fungujúci softvér do prevádzky. Stack nie je daný. Nástroje aj jazyk volíme podľa projektu. Jadro práce je tá dodávka a kontrola toho, čo agent vygeneruje.",
      en: "Someone who ships working production software for clients with AI coding agents. The stack is not fixed. We pick the tools and the language per project. The core of the job is that delivery, and a review of what the agent generated.",
    },
    responsibilities: {
      sk: [
        "Dodať klientom fungujúci softvér do prevádzky.",
        "Voliť nástroje a jazyk podľa projektu. Pevný stack nemáme.",
        "Pracovať s AI coding agentmi a skontrolovať ich výstup, kým ide von.",
        "Nechať po sebe kód, ktorý sa dá čítať aj bez agenta.",
      ],
      en: [
        "Ship working production software for clients.",
        "Choose the tools and the language per project. There is no fixed stack.",
        "Work with AI coding agents and review their output before it ships.",
        "Leave code that can be read without an agent in the loop.",
      ],
    },
    lookingFor: {
      sk: [
        "Nový nástroj alebo jazyk chytíte rýchlo.",
        "Už dodávate s coding agentmi a viete, kedy ich výstup zahodiť.",
        "Záleží vám na tom, či to u klienta naozaj beží.",
        "Zvládnete malý tím a priamy kontakt so zakladateľom.",
      ],
      en: [
        "You pick up a new tool or language quickly.",
        "You already ship with coding agents, and you know when to throw the output away.",
        "You care whether it actually runs for the client.",
        "You can work on a small team, in direct contact with the founder.",
      ],
    },
    offer: {
      sk: [
        "Pracovný pomer na plný úväzok. Živnosť dohodou, ak to sedí obom stranám.",
        "Reálni klienti, nie interné demo.",
        "Remote, Slovensko.",
        "Priama spolupráca so zakladateľom.",
      ],
      en: [
        "Full-time employment. Self-employment (živnosť / B2B) if it fits both sides.",
        "Real clients, not an internal demo.",
        "Remote, Slovakia.",
        "Direct work with the founder.",
      ],
    },
    cooperation: {
      sk: "Pracovný pomer na plný úväzok; živnosť dohodou, ak to sedí obom stranám",
      en: "Full-time employment; self-employment (živnosť / B2B) if it fits both sides",
    },
    location: {
      sk: "Remote, Slovensko",
      en: "Remote, Slovakia",
    },
    start: OPEN_START,
    employmentType: ["FULL_TIME", "CONTRACTOR"],
    salary: {
      kind: "from-base",
      amountEur: 3000,
      per: "month",
      note: {
        sk: "podľa skúseností a zručností",
        en: "depending on skills and experience",
      },
    },
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
  applyTitle: string;
  applyBody: string;
  applyCta: string;
  privacyLink: string;
  privacyTitle: string;
  privacy: string;
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
    applyTitle: "Ako sa prihlásiť",
    applyBody:
      "Do predmetu dajte názov pozície a v pár vetách, prečo sa hlásite. Životopis alebo odkaz na prácu stačí. Formulár nemáme.",
    applyCta: "Napísať na",
    privacyLink: "Ako spracúvame životopis",
    privacyTitle: "Spracúvanie osobných údajov",
    privacy: `Životopis a sprievodný text spracúva Stredan s. r. o., IČO 57168504, ako prevádzkovateľ, na účel výberového konania na základe predzmluvných vzťahov a oprávneného záujmu. Údaje uchováme po dobu výberu, najdlhšie 6 mesiacov po jeho skončení, ak nedáte súhlas na dlhšie zaradenie do evidencie. Máte právo na prístup, opravu, výmaz, obmedzenie spracúvania, namietanie a sťažnosť na Úrad na ochranu osobných údajov SR. Kontakt: ${CAREERS_EMAIL}.`,
    metaTitle: "Kariéra · Stredan",
    metaDescription:
      "Otvorené pozície v Stredan s. r. o.: CMO, administratívna výpomoc (m/ž) a vývojár / vývojárka s AI agentmi. Remote, Slovensko.",
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
    applyTitle: "How to apply",
    applyBody:
      "Put the role in the subject and a few sentences on why you are writing. A CV or a link to your work is enough. There is no form.",
    applyCta: "Email",
    privacyLink: "How we handle your CV",
    privacyTitle: "Personal data",
    privacy: `Stredan s. r. o., Company ID 57168504, is the controller. We process your CV and message for this recruitment, on the basis of pre-contractual steps and legitimate interest. We keep the data for the hiring process, and for at most 6 months after it ends, unless you consent to a longer talent record. You have the right of access, rectification, erasure, restriction, objection, and to lodge a complaint with the Slovak Data Protection Authority. Contact: ${CAREERS_EMAIL}.`,
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

/** Groups the integer part. Fractional digits are kept as written, never rounded. */
function formatAmount(amount: number, locale: Locale): string {
  const [whole, frac] = amount.toString().split(".");
  const separator = locale === "sk" ? " " : ",";
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  if (!frac) return grouped;
  return `${grouped}${locale === "sk" ? "," : "."}${frac}`;
}

export function getCareer(slug: string): CareerRole | undefined {
  return careers.find((role) => role.slug === slug);
}

export function careerSalaryLabel(role: CareerRole, locale: Locale): string {
  if (role.salary.kind === "hourly-base") {
    return locale === "sk" ? "Odmena" : "Pay";
  }
  return locale === "sk" ? "Mzda" : "Salary";
}

/** Value only, without the "Mzda:" / "Odmena:" / "Pay:" prefix. */
export function careerSalaryValue(role: CareerRole, locale: Locale): string {
  const { salary } = role;
  const amount = formatAmount(salary.amountEur, locale);
  if (salary.kind === "hourly-base") {
    const rate =
      locale === "sk"
        ? `${amount} € hrubého za hodinu (základná odmena)`
        : `€${amount} gross per hour (base)`;
    return salary.note ? `${rate}. ${salary.note[locale]}` : rate;
  }
  const monthly =
    locale === "sk"
      ? `${amount} € hrubého mesačne (základná zložka)`
      : `€${amount} gross per month (base)`;
  const core = salary.kind === "from-base"
    ? locale === "sk"
      ? `od ${monthly}`
      : `from ${monthly}`
    : monthly;
  if (salary.kind === "from-base" && salary.note) {
    const note = salary.note[locale];
    return /[.!?]$/.test(note) ? `${core}, ${note}` : `${core}, ${note}.`;
  }
  return core;
}

/** Full pay line, including the label. */
export function careerSalaryLine(role: CareerRole, locale: Locale): string {
  return `${careerSalaryLabel(role, locale)}: ${careerSalaryValue(role, locale)}`;
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

function quantitativeValue(salary: CareerSalary): {
  "@type": "QuantitativeValue";
  unitText: "MONTH" | "HOUR";
  value?: number;
  minValue?: number;
} {
  if (salary.kind === "from-base") {
    return {
      "@type": "QuantitativeValue",
      minValue: salary.amountEur,
      unitText: "MONTH",
    };
  }
  if (salary.kind === "hourly-base") {
    return {
      "@type": "QuantitativeValue",
      value: salary.amountEur,
      unitText: "HOUR",
    };
  }
  return {
    "@type": "QuantitativeValue",
    value: salary.amountEur,
    unitText: "MONTH",
  };
}

/** JobPosting JSON-LD. Every role states a base salary. */
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

  data.baseSalary = {
    "@type": "MonetaryAmount",
    currency: "EUR",
    value: quantitativeValue(role.salary),
  };

  return JSON.stringify(data).replace(/</g, "\\u003c");
}
