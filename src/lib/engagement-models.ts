import type { Locale } from "@/lib/translations";

type EngagementCopy = {
  offersLead: string;
  models: { title: string; body: string }[];
  offerNote: string;
};

export const engagementModels: Record<Locale, EngagementCopy> = {
  sk: {
    offersLead:
      "Nech ide o audit, agenta alebo vlastný systém — väčšinou to riešime jedným z dvoch modelov.",
    models: [
      {
        title: "Zákazka na kľúč",
        body: "Jasný rozsah, termín a výstup. Audit, pilot alebo dodávka do prevádzky.",
      },
      {
        title: "Kontinuálny vývoj",
        body: "Prenájom IT tímu — kapacita mesačne, roadmapa s vami, bez náboru naviac.",
      },
    ],
    offerNote:
      "Túto ponuku vieme riešiť v oboch modeloch. Konkrétny postup dohodneme na úvodnom calle.",
  },
  en: {
    offersLead:
      "Whether it’s an audit, an agent, or a custom system — we usually work in one of two ways.",
    models: [
      {
        title: "Fixed-scope project",
        body: "Clear scope, timeline, and deliverable. Audit, pilot, or production rollout.",
      },
      {
        title: "Ongoing development",
        body: "Embedded IT team — monthly capacity, shared roadmap, no extra hiring.",
      },
    ],
    offerNote:
      "This offer works in either model. We’ll agree the right setup on the intro call.",
  },
};
