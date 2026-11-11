import type { Locale } from "@/lib/translations";

type EngagementCopy = {
  offersLead: string;
  models: { title: string; body: string }[];
  offerNote: string;
};

export const engagementModels: Record<Locale, EngagementCopy> = {
  sk: {
    offersLead:
      "Implementácia jedného agenta je jednorazová a patrí k nej konzultácia.",
    models: [
      {
        title: "Patrí k implementácii",
        body: "Jeden agent pre jeden dohodnutý proces a konzultácia k tomu, ako má fungovať.",
      },
      {
        title: "Je osobitne",
        body: "Predplatné modelu, API, hosting a prípadná podpora po odovzdaní.",
      },
    ],
    offerNote:
      "Podpora po odovzdaní sa dá dohodnúť. Nie je automaticky súčasťou implementácie.",
  },
  en: {
    offersLead:
      "Implementing one agent is a one-off fee, and the consultation belongs with it.",
    models: [
      {
        title: "In the implementation",
        body: "One agent for one agreed process, and a consultation on how it should work.",
      },
      {
        title: "Separate",
        body: "Model subscriptions, API use, hosting, and any support after handover.",
      },
    ],
    offerNote:
      "Support after handover can be agreed. It is not automatically part of the implementation.",
  },
};
