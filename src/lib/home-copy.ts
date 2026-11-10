import type { Locale } from "@/lib/translations";

export const homeCopy = {
  sk: {
    kicker: "Jeden proces, nie celá firma naraz",
    headline: "Vyberieme jeden proces, ktorý vás brzdí, a nasadíme naň agenta.",
    mobileTitle: ["Jeden proces.", "Jeden agent."],
    lede: "Dohodneme jednu konkrétnu prácu, ktorú dnes niekto skladá medzi e-mailom, tabuľkou a systémom. Agenta na ňu postavíme a odovzdáme. Platí sa jednorazová implementácia a konzultácia. Predplatné modelu, API, hosting a prípadná ďalšia podpora sú osobitne.",
    cta: "Vybrať termín úvodného hovoru",
    email: "Alebo napíšte na david@stredan.sk",
    note: "Hovor trvá 45 minút a je na Google Meet. Kalendár Google je po anglicky. Toto tlačidlo ho len otvorí. Termín potvrdíte v ňom.",
    heroAlt: "Dávid Stredánsky",
    founderEyebrow: "S kým hovoríte",
    founderName: "Dávid Stredánsky",
    founderRole: "Zakladateľ Stredanu",
    founderLead:
      "Na úvodnom hovore hovoríte priamo s ním. Stredan je jeho firma, nie anonymný tím za formulárom.",
    founderAlt: "Dávid Stredánsky, zakladateľ Stredanu",
    founderCta: "Celý profil",
    offerEyebrow: "Ponuka",
    offerTitle: "Jeden agent na jeden proces",
    offerLead:
      "Dostanete nasadeného agenta pre jednu dohodnutú prácu a konzultáciu k tomu, ako má fungovať. Nie balík nástrojov. A bez sľubu, koľko hodín sa vráti.",
    includedTitle: "Čo patrí k implementácii",
    included: [
      "Konzultácia, na ktorej pomenujeme jeden proces a hranice, kam agent siaha.",
      "Jednorazové nasadenie jedného agenta pre túto prácu.",
      "Napojenie len na systémy, ktoré k nej patria a ktoré odsúhlasíte.",
      "Odovzdanie tak, aby ste agenta vedeli spustiť aj zastaviť.",
    ],
    excludedTitle: "Čo je osobitne",
    excluded: [
      "Predplatné modelu, poplatky za API a hosting. To sú účty tých služieb.",
      "Úpravy a podpora po odovzdaní. Dajú sa dohodnúť, nie sú v implementácii.",
      "Ďalší proces, ďalší agent alebo celý vlastný systém.",
      "Školenie, ako písať do chatbotu.",
    ],
    auditTitle: "Keď neviete, ktorý proces zobrať",
    auditBody:
      "Audit je pre firmu, ktorá cíti, že sa niekde zasekáva, ale nevie, či na to agent vôbec sedí. Tlačidlo nič neobjednáva. Otvorí e-mail na david@stredan.sk.",
    auditCta: "Napísať ohľadom auditu",
    auditSubject: "AI audit",
    auditMore: "Viac o audite",
    customTitle: "Vlastný softvér, keď agent nestačí",
    customBody:
      "Niekedy proces potrebuje vlastnú aplikáciu, nie len agenta nad tým, čo už máte. Vieme ju postaviť, až keď je jasné, čo má robiť. Nie je to prvá voľba na tejto stránke.",
    customCta: "Napísať ohľadom vlastného softvéru",
    customSubject: "Vlastný softvér",
    customMore: "Viac o vlastnom softvéri",
    howEyebrow: "Postup",
    howTitle: "Čo sa deje po tom, čo sa ozvete",
    steps: [
      {
        n: "01",
        title: "Ozvete sa",
        body: "Vyberiete 45-minútový termín alebo napíšete e-mail. Na hovore ste s Dávidom.",
      },
      {
        n: "02",
        title: "Pomenujeme jeden proces",
        body: "Čo doň vstupuje, čo z neho má vyjsť a kto to dnes robí ručne.",
      },
      {
        n: "03",
        title: "Dohodneme rozsah",
        body: "Jednorazová implementácia a konzultácia. Model, API, hosting a prípadná podpora ostanú vypísané osobitne.",
      },
      {
        n: "04",
        title: "Nasadíme a odovzdáme",
        body: "Agent robí tú jednu prácu. Prístupy viete odobrať.",
      },
    ],
    examplesEyebrow: "Príklady",
    examplesTitle: "Ako môže vyzerať jeden proces",
    examplesNote:
      "Toto sú ilustrácie, nie zákazky a nie výsledky klientov. Konkrétny proces vyberieme až s vami.",
    exampleTag: "Príklad, nie zákazka",
    examples: [
      {
        title: "Prichádzajúce dopyty",
        body: "Agent zhrnie správu, vypíše, čo v nej chýba, a pripraví návrh odpovede. Človek ju odošle.",
      },
      {
        title: "Podklady pred faktúrou",
        body: "Agent skontroluje, či v podkladoch niečo chýba, a pripraví zoznam. Neúčtuje a faktúru sám neposiela.",
      },
      {
        title: "Opakovaný vnútorný súhrn",
        body: "Agent zloží rovnaký prehľad z podkladov, ktoré mu dáte. Niekto vo firme ho prečíta, kým ide ďalej.",
      },
    ],
    workEyebrow: "Práca",
    workTitle: "Čo už beží",
    workCaption:
      "Produkty a spolupráce, ktoré sú verejne na webe. Nerobia sa z nich čísla ani prípadové štúdie tejto ponuky.",
    logoLabel: "Verejne dostupné produkty a spolupráce",
    faqEyebrow: "Otázky",
    faqTitle: "Skôr, než sa ozvete",
    faq: [
      {
        q: "Kam sa dostanú naše dáta?",
        a: "Predtým, než sa čokoľvek napojí, povieme si, ktoré systémy agent číta a ktorý model tú prácu spracúva. Napájame len to, čo k danému procesu odsúhlasíte. Ak práca potrebuje model od dodávateľa, dáta idú k nemu. To viete vopred. Nesľubujeme, že všetko zostane len na vašom serveri, pokiaľ to tak naozaj nebude.",
      },
      {
        q: "Kto to ovláda a dá sa to vypnúť?",
        a: "Prístupy a kľúče zostávajú u vás. Keď ich odoberiete, agent sa do tých systémov nedostane. Nie je to služba, ktorú viete zastaviť len tým, že nám napíšete a budete čakať.",
      },
      {
        q: "Čo presne platíme?",
        a: "Jednorazovú implementáciu a konzultáciu. Predplatné modelu, poplatky za API a hosting sú účty tých služieb. Podpora a úpravy po odovzdaní sa dajú dohodnúť a nie sú súčasťou implementácie. Sumy na tejto stránke nie sú. Dohodneme ich, až keď je jasný ten jeden proces.",
      },
      {
        q: "Čo keď nevieme, ktorý proces zobrať?",
        a: "Napíšte ohľadom auditu. Tlačidlo nič neobjednáva. Otvorí e-mail na david@stredan.sk a v ňom sa dohodneme, či audit vôbec dáva zmysel.",
      },
      {
        q: "Mám po kliknutí už termín?",
        a: "Nie. Tlačidlo len otvorí Google kalendár. Termín vznikne, až keď ho v ňom potvrdíte. Trvá 45 minút a odkaz je na Google Meet. Cenu hovoru tu neuvádzame, preto k nemu žiadnu nepripisujeme.",
      },
      {
        q: "V akom jazyku je hovor?",
        a: "Hovor vieme viesť po slovensky. Obrazovka kalendára je po anglicky.",
      },
    ],
    finalTitle: "Ďalší krok je jeden rozhovor",
    finalSub:
      "Napíšte, ktorý proces vás brzdí, alebo si vyberte 45 minút. Z tohto webu vám nepríde správa, že ste objednaní.",
  },
  en: {
    kicker: "One process, not the whole company at once",
    headline: "We take the one process that slows you down and put an agent on it.",
    mobileTitle: ["One process.", "One agent."],
    lede: "We agree one concrete job someone still pieces together across email, a spreadsheet, and a system. We build the agent for it and hand it over. You pay a one-off implementation fee, plus consultation. Model subscriptions, API use, hosting, and any later support sit beside that fee.",
    cta: "Choose a time for an intro call",
    email: "Or write to david@stredan.sk",
    note: "The call is 45 minutes on Google Meet. Google Calendar is in English. This button only opens it. You confirm the time there.",
    heroAlt: "Dávid Stredánsky",
    founderEyebrow: "Who you talk to",
    founderName: "Dávid Stredánsky",
    founderRole: "Founder of Stredan",
    founderLead:
      "On the intro call you talk to him directly. Stredan is his company, not an anonymous team behind a form.",
    founderAlt: "Dávid Stredánsky, founder of Stredan",
    founderCta: "Full profile",
    offerEyebrow: "The offer",
    offerTitle: "One agent for one process",
    offerLead:
      "You get an agent deployed for one agreed job, and a consultation on how it should work. Not a bundle of tools. And no promise about how many hours come back.",
    includedTitle: "Included in the implementation",
    included: [
      "A consultation that names one process and how far the agent reaches.",
      "A one-off deployment of one agent for that job.",
      "Connections only to the systems that job needs, and only the ones you approve.",
      "A handover so you can start the agent and stop it.",
    ],
    excludedTitle: "Separate from that fee",
    excluded: [
      "Model subscriptions, API fees, and hosting. Those are the vendors’ accounts.",
      "Changes and support after handover. We can agree them. They are not part of the implementation.",
      "Another process, another agent, or a whole custom system.",
      "Training people how to type into a chatbot.",
    ],
    auditTitle: "When you don’t know which process to pick",
    auditBody:
      "An audit is for a company that feels stuck and doesn’t yet know whether an agent fits. The button does not place an order. It opens an email to david@stredan.sk.",
    auditCta: "Write about an audit",
    auditSubject: "AI audit",
    auditMore: "More about the audit",
    customTitle: "Custom software, when an agent is not enough",
    customBody:
      "Sometimes a process needs its own application, not an agent on top of what you already use. We can build that once it is clear what the system must do. It is not the first offer on this page.",
    customCta: "Write about custom software",
    customSubject: "Custom software",
    customMore: "More about custom software",
    howEyebrow: "How it goes",
    howTitle: "What happens after you get in touch",
    steps: [
      {
        n: "01",
        title: "You get in touch",
        body: "You pick a 45-minute time or you write an email. On the call you talk to Dávid.",
      },
      {
        n: "02",
        title: "We name one process",
        body: "What goes in, what should come out, and who does it by hand today.",
      },
      {
        n: "03",
        title: "We agree the scope",
        body: "A one-off implementation and a consultation. Model, API, hosting, and any support stay written out separately.",
      },
      {
        n: "04",
        title: "We deploy it and hand it over",
        body: "The agent does that one job. You can take the access away.",
      },
    ],
    examplesEyebrow: "Examples",
    examplesTitle: "What one process can look like",
    examplesNote:
      "These are illustrations, not engagements and not client results. We pick the real process with you.",
    exampleTag: "Example, not a client claim",
    examples: [
      {
        title: "Incoming enquiries",
        body: "The agent summarises the message, lists what is missing, and drafts a reply. A person sends it.",
      },
      {
        title: "Material before an invoice",
        body: "The agent checks what is missing from the paperwork and prepares a list. It does not invoice, and it does not send the invoice.",
      },
      {
        title: "A repeated internal summary",
        body: "The agent assembles the same digest from material you give it. Someone in the company reads it before it goes further.",
      },
    ],
    workEyebrow: "Work",
    workTitle: "What already runs",
    workCaption:
      "Products and collaborations that are already public on the web. They are not turned into numbers or case studies for this offer.",
    logoLabel: "Public products and collaborations",
    faqEyebrow: "Questions",
    faqTitle: "Before you get in touch",
    faq: [
      {
        q: "Where does our data go?",
        a: "Before anything is connected, we say which systems the agent reads and which model does the work. We connect only what you approve for that process. If the job needs a vendor’s model, the data goes there. You know that before we start. We do not promise that everything stays on your server unless that is actually how it will run.",
      },
      {
        q: "Who controls it, and can we turn it off?",
        a: "The access and the keys stay with you. When you remove them, the agent cannot reach those systems. This is not a service you can stop only by writing to us and waiting.",
      },
      {
        q: "What do we pay?",
        a: "A one-off implementation and a consultation. Model subscriptions, API fees, and hosting are those services’ own accounts. Support and changes after handover can be agreed, and they are not part of the implementation. This page has no prices. We set them once the one process is clear.",
      },
      {
        q: "What if we don’t know which process to pick?",
        a: "Write about an audit. The button does not place an order. It opens an email to david@stredan.sk, and we say whether an audit even makes sense.",
      },
      {
        q: "Do I already have a time after I click?",
        a: "No. The button only opens Google Calendar. A time exists after you confirm it there. It is 45 minutes, on Google Meet. This page does not state a price for the call, so we don’t attach one.",
      },
      {
        q: "Which language is the call?",
        a: "We can hold the call in Slovak. The calendar screen is in English.",
      },
    ],
    finalTitle: "The next step is one conversation",
    finalSub:
      "Tell us which process is slowing you down, or pick 45 minutes. This site will not send you a message saying you have booked.",
  },
} as const satisfies Record<Locale, Record<string, unknown>>;

export type HomeCopy = (typeof homeCopy)[Locale];
