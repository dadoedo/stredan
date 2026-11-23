export const PUBLIC_OFFERS = [
  {
    slug: "pilot-agent",
    code: "B",
    ctaKind: "booking" as const,
    name: {
      sk: "Jeden agent na jeden proces",
      en: "One agent for one process",
    },
    description: {
      sk: "Jednorazovo nasadíme jedného agenta na jednu konkrétnu prácu vo firme. Konzultácia patrí k implementácii. Model, API, hosting a podpora sú osobitne.",
      en: "A one-off deployment of one agent for one concrete job in the company. Consultation is part of the implementation. Model, API, hosting, and support are separate.",
    },
    body: {
      sk: "Najprv pomenujeme proces: čo doň vstupuje, čo z neho má vyjsť a kto to dnes robí. Potom agenta postavíme a odovzdáme. Predplatné modelu, API, hosting a prípadná ďalšia podpora nie sú v cene implementácie.",
      en: "First we name the process: what goes in, what should come out, and who does it today. Then we build the agent and hand it over. Model subscriptions, API use, hosting, and any later support are not inside the implementation fee.",
    },
    cta: {
      sk: "Vybrať termín úvodného hovoru",
      en: "Choose a time for an intro call",
    },
    forWhom: {
      sk: "Pre firmu, ktorá vie ukázať jednu opakovanú prácu a chce ju dať jednému agentovi.",
      en: "A company that can point to one repeated job and wants one agent on it.",
    },
    notFor: {
      sk: "Pre koho chce naraz riešiť celú firmu, alebo ešte nevie, ktorý proces zobrať.",
      en: "Anyone who wants the whole company done at once, or who cannot yet name the process.",
    },
  },
  {
    slug: "ai-audit",
    code: "A",
    ctaKind: "email" as const,
    mailSubject: "AI audit",
    name: {
      sk: "Audit, keď neviete, kde začať",
      en: "An audit when you don’t know where to start",
    },
    description: {
      sk: "Rozhovor o tom, či na váš problém agent sedí. Tlačidlo nič neobjednáva. Otvorí e-mail.",
      en: "A conversation about whether an agent fits your problem. The button does not place an order. It opens an email.",
    },
    body: {
      sk: "Audit nie je objednávka na tlačidlo a na tejto stránke nemá cenu. Napíšete, čo vás brzdí. Ozveme sa a povieme, či má zmysel ísť ďalej, alebo či agent nie je správna cesta. Kliknutím sa nič nepotvrdí.",
      en: "An audit is not an order button, and this page does not price it. You write what is slowing you down. We reply and say whether it is worth going further, or whether an agent is the wrong tool. The click confirms nothing.",
    },
    cta: {
      sk: "Napísať ohľadom auditu",
      en: "Write about an audit",
    },
    forWhom: {
      sk: "Pre firmu, ktorá ešte nemá jeden proces, do ktorého by šla.",
      en: "A company that does not yet have one process to commit to.",
    },
    notFor: {
      sk: "Pre koho už vie, ktorý proces chce dať agentovi. Vtedy stačí úvodný hovor.",
      en: "Anyone who already knows which process the agent should take. An intro call is enough.",
    },
  },
  {
    slug: "custom-ai-app",
    code: "E",
    ctaKind: "email" as const,
    mailSubject: "Vlastný softvér",
    name: {
      sk: "Vlastný softvér",
      en: "Custom software",
    },
    description: {
      sk: "Až keď jeden proces potrebuje vlastnú aplikáciu, nie len agenta nad tým, čo už máte.",
      en: "For when one process needs its own application, not only an agent on what you already have.",
    },
    body: {
      sk: "Vlastný systém staviame, keď je jasné, čo má robiť. Nie je to prvá ponuka na webe. Napíšte, čo by mal systém zvládnuť.",
      en: "We build a custom system when it is clear what it must do. It is not the first offer on the site, and it is not a monthly team rental. Write what the system would need to handle.",
    },
    cta: {
      sk: "Napísať ohľadom vlastného softvéru",
      en: "Write about custom software",
    },
    forWhom: {
      sk: "Keď existujúci nástroj nestačí a viete pomenovať, čo má nový systém robiť.",
      en: "When the current tool is not enough and you can name what the new system must do.",
    },
    notFor: {
      sk: "Pre prácu, ktorú zvládne jeden agent nad tým, čo už používate.",
      en: "A job that one agent can do on top of what you already use.",
    },
  },
  {
    slug: "shadow-ai",
    code: "C",
    ctaKind: "booking" as const,
    name: {
      sk: "Prístup a dáta pri nasadení",
      en: "Access and data in the deployment",
    },
    description: {
      sk: "Súčasť nasadenia toho jedného agenta, nie samostatný balík.",
      en: "Part of deploying that one agent, not a separate package.",
    },
    body: {
      sk: "Pri implementácii si povieme, ktoré systémy agent číta, kam idú dáta a kto drží kľúče. Prístupy zostávajú u vás. Nie je to oddelený produkt s vlastnou cenou na tejto stránke.",
      en: "During the implementation we say which systems the agent reads, where the data goes, and who holds the keys. Access stays with you. This is not a separate product with its own price on this page.",
    },
    cta: {
      sk: "Vybrať termín úvodného hovoru",
      en: "Choose a time for an intro call",
    },
    forWhom: {
      sk: "Keď vás pri agentovi zaujíma, kto má prístup a kam dáta idú.",
      en: "When what matters is who has access and where the data goes.",
    },
    notFor: {
      sk: "Pre hľadanie sľubu, že dáta nikdy neopustia firmu. To závisí od procesu a modelu a povieme to vopred.",
      en: "Anyone looking for a promise that data never leaves the company. That depends on the process and the model, and we say so up front.",
    },
  },
  {
    slug: "ai-integration",
    code: "D",
    ctaKind: "booking" as const,
    name: {
      sk: "Napojenie na to, čo už používate",
      en: "Connecting what you already use",
    },
    description: {
      sk: "Agent sa napojí len na systémy, ktoré k tomu jednému procesu treba.",
      en: "The agent connects only to the systems that one process needs.",
    },
    body: {
      sk: "Nie je to ďalší softvér v cenníku. Ak práca sedí v pošte, tabuľke alebo v systéme, ktorý už máte, napojíme to, čo k nej patrí. Čo neodsúhlasíte, nenapájame.",
      en: "This is not another product on a price list. If the job lives in email, a spreadsheet, or a system you already have, we connect what belongs to it. What you don’t approve, we don’t connect.",
    },
    cta: {
      sk: "Vybrať termín úvodného hovoru",
      en: "Choose a time for an intro call",
    },
    forWhom: {
      sk: "Pre proces, ktorý už má svoje nástroje a nechcete kvôli nemu novú aplikáciu.",
      en: "A process that already has its tools, when you don’t want a new application for it.",
    },
    notFor: {
      sk: "Pre stavanie systému od nuly. Na to je rozhovor o vlastnom softvéri.",
      en: "Building a system from nothing. That is a conversation about custom software.",
    },
  },
] as const;

export function offerBySlug(slug: string) {
  return PUBLIC_OFFERS.find((offer) => offer.slug === slug) ?? null;
}
