-- Push COPY.md v1 cold-1 bodies into prod. Safe to re-run.

UPDATE "EmailTemplate" t
SET subject = 'Jeden proces vo {{company}}, nie workshop',
    "bodyText" = $body$
{{salutation}}

väčšina firiem už verejné AI skúša. Málokto vie, ktorý proces sa oplatí dať do prevádzky ako prvý.

{{hook}}

Pre {{company}} viem za 14 dní spísať krátky plán: tri procesy, poradie, čo kúpiť a čo nestavať. Fixná cena, písomne.

Ak to nie je téma, stačí jedno „nie“. Ak áno, odpíšte „audit“ a pošlem, ako to prebieha.

Dávid Stredánsky
https://stredan.sk/offers/ai-audit
$body$,
    active = true,
    "updatedAt" = now()
FROM "Offer" o
WHERE t."offerId" = o.id AND o.code = 'A' AND t.key = 'cold-1' AND t.locale = 'sk';

UPDATE "EmailTemplate" t
SET subject = 'Jeden agent vo {{company}}, nie prezentácia',
    "bodyText" = $body$
{{salutation}}

neposielam workshop. Ide o jedného agenta na jeden opakovaný proces: maily, doklady, dopyty alebo podpora.

{{hook}}

Cieľ je prevádzka za 4 až 6 týždňov, nie slidy. Ak vo {{company}} taký proces máte, odpíšte jedným slovom, ktorý to je. Ak nie, dajte „nie“ a už vás nebudem ťahať.

Dávid Stredánsky
https://stredan.sk/offers/pilot-agent
$body$,
    active = true,
    "updatedAt" = now()
FROM "Offer" o
WHERE t."offerId" = o.id AND o.code = 'B' AND t.key = 'cold-1' AND t.locale = 'sk';

UPDATE "EmailTemplate" t
SET subject = 'Firemné AI, nie súkromné účty',
    "bodyText" = $body$
{{salutation}}

ľudia už verejné AI používajú. Často so zmluvami, faktúrami alebo spismi, bez pravidiel a bez stopy, čo odišlo von.

{{hook}}

Pre {{company}} vieme nastaviť firemné AI: vaše dokumenty, prístupy, logy, jasné čo smie a čo nesmie.

Ak to riešite, odpíšte „áno“. Ak nie, stačí „nie“.

Dávid Stredánsky
https://stredan.sk/offers/shadow-ai
$body$,
    active = true,
    "updatedAt" = now()
FROM "Offer" o
WHERE t."offerId" = o.id AND o.code = 'C' AND t.key = 'cold-1' AND t.locale = 'sk';

UPDATE "EmailTemplate" t
SET subject = 'AI do toho, čo už {{company}} má',
    "bodyText" = $body$
{{salutation}}

nový softvér väčšinou netreba. Treba, aby to, čo už beží, prestalo žrať ruky.

{{hook}}

Typicky: triáž mailov, drafty, doklady do Pohody alebo report z dát, ktoré už máte.

Má {{company}} jeden systém, kde by to hneď uľavilo? Odpíšte ním. Alebo „nie“.

Dávid Stredánsky
https://stredan.sk/offers/ai-integration
$body$,
    active = true,
    "updatedAt" = now()
FROM "Offer" o
WHERE t."offerId" = o.id AND o.code = 'D' AND t.key = 'cold-1' AND t.locale = 'sk';

UPDATE "EmailTemplate" t
SET subject = 'Vlastný systém? Len ak to má zmysel',
    "bodyText" = $body$
{{salutation}}

ak hotové nástroje nestačia, staviam systém okolo vášho procesu. Nie naopak.

Najprv treba vedieť, čo sa má pohnúť v číslach. Ak to viete pomenovať, navrhnem, či to stavať, kúpiť, alebo nechať tak.

Dávid Stredánsky
https://stredan.sk/offers/custom-ai-app
$body$,
    active = false,
    "updatedAt" = now()
FROM "Offer" o
WHERE t."offerId" = o.id AND o.code = 'E' AND t.key = 'cold-1' AND t.locale = 'sk';
