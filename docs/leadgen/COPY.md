# Copy + prompty

Status: v1 v admine (`cold-1`). Ďalší tweak v `/admin/templates`.

Placeholdery, ktoré agent smie vyplniť:

| Token | Pravidlo |
|-------|----------|
| `{{company}}` | Presný názov z RPO, bez právnej formy ak je dlhý (`STEaMAR`, nie `STEaMAR, s. r. o.`) |
| `{{salutation}}` | Vykáme v tele. Oslovenie: `Dobrý deň,` alebo `Dobrý deň, David,` (**len krstné meno**). Nikdy `p.` / `pani` / priezvisko. |
| `{{hook}}` | Jedna veta o *ich* procese. Z knižnice nižšie, nie vymyslený case study. |
| `{{nace}}` | Ľudsky: `účtovníctvo`, `právo`, `veľkoobchod`, nie kód 6920 |
| `{{landing}}` | Plná URL offeru, napr. `https://stredan.sk/offers/ai-audit` |

Nepoužívať: slovo **ChatGPT** (ani Claude, Gemini) v subjecte ani v tele. `{{one_liner}}` v tele mailu. Cena. Em dash (`—`). „dovolím si“, „synergia“, „transformácia“, „AI revolúcia“.

Hlas: krátke vety. O nich, nie o nás. Jedna ponuka, jedna otázka. Ľahké „nie“.

---

## 0. Knižnica `{{hook}}` podľa NACE

Agent vyberie **jeden** riadok. Ak nesedí, hook vynechá (mail ostane bez tej vety).

| NACE | Hook |
|------|------|
| 69 účto / dane | Vo vašom odbore to zvyčajne začína pri faktúrach, DPH a pretáčaní dokladov z mailu do Pohody. |
| 69 právo | Vo vašom odbore to zvyčajne začína pri zmluvách, spisoch a tom, čo odchádza z firmy cez súkromné účty. |
| 86 zdravie | Vo vašom odbore to zvyčajne začína pri objednávkach, dokumentácii a mailoch, ktoré niekto prepisuje ručne. |
| 46 veľkoobchod | Vo vašom odbore to zvyčajne začína pri dopytoch, cenníkoch a objednávkach, ktoré idú sem-tam mailom. |
| 41 / 43 stavba | Vo vašom odbore to zvyčajne začína pri ponukách, výkazoch výmer a mailoch od subdodávateľov. |
| 10–33 výroba | Vo vašom odbore to zvyčajne začína pri sklade, objednávkach a reklamáciách, ktoré žije v Exceli. |
| 49 / 52 logistika | Vo vašom odbore to zvyčajne začína pri dispečingu, dokladoch k zásielkam a mailoch, ktoré niekto prepisuje. |
| 68 reality | Vo vašom odbore to zvyčajne začína pri dopytoch, prehliadkach a zmluvách, ktoré sa zbierajú z piatich miest. |
| 71 projekcia / inžinierstvo | Vo vašom odbore to zvyčajne začína pri dokumentácii, revíziách a mailoch okolo zákazky. |
| 45 auto | Vo vašom odbore to zvyčajne začína pri objednávkach dielov, servisných záznamoch a faktúrach. |
| 73 reklama | Vo vašom odbore to zvyčajne začína pri briefoch, reportoch a textoch, ktoré sa píšu mimo firmy. |
| 81 facility | Vo vašom odbore to zvyčajne začína pri tiketoch, objednávkach a reportoch zo zásahov. |
| 82 admin / „ostatné“ | *(žiadny hook; skóre nízke, väčšinou neposielať)* |

---

## 1. Cold A — audit

**Subject (vyber jeden):**

1. `Jeden proces vo {{company}}, nie workshop`
2. `Čo s AI ďalej vo {{company}}`

**Body:**

```
{{salutation}}

väčšina firiem už verejné AI skúša. Málokto vie, ktorý proces sa oplatí dať do prevádzky ako prvý.

{{hook}}

Pre {{company}} viem za 14 dní spísať krátky plán: tri procesy, poradie, čo kúpiť a čo nestavať. Fixná cena, písomne.

Ak to nie je téma, stačí jedno „nie“. Ak áno, odpíšte „audit“ a pošlem, ako to prebieha.

Dávid Stredánsky
{{landing}}
```

---

## 2. Cold B — jeden agent

**Subject:**

1. `Jeden agent vo {{company}}, nie prezentácia`
2. `4 až 6 týždňov, jeden proces`

**Body:**

```
{{salutation}}

neposielam workshop. Ide o jedného agenta na jeden opakovaný proces: maily, doklady, dopyty alebo podpora.

{{hook}}

Cieľ je prevádzka za 4 až 6 týždňov, nie slidy. Ak vo {{company}} taký proces máte, odpíšte jedným slovom, ktorý to je. Ak nie, dajte „nie“ a už vás nebudem ťahať.

Dávid Stredánsky
{{landing}}
```

---

## 3. Cold C — shadow AI (právo, účto, zdravie)

**Subject:**

1. `Firemné AI, nie súkromné účty`
2. `Interné veci vo {{company}} a verejné AI`

**Body:**

```
{{salutation}}

ľudia už verejné AI používajú. Často so zmluvami, faktúrami alebo spismi, bez pravidiel a bez stopy, čo odišlo von.

{{hook}}

Pre {{company}} vieme nastaviť firemné AI: vaše dokumenty, prístupy, logy, jasné čo smie a čo nesmie.

Ak to riešite, odpíšte „áno“. Ak nie, stačí „nie“.

Dávid Stredánsky
{{landing}}
```

---

## 4. Cold D — do Pohody / mailov / CRM

**Subject:**

1. `AI do toho, čo už {{company}} má`
2. `Doklady, maily, Pohoda. Bez nového systému.`

**Body:**

```
{{salutation}}

nový softvér väčšinou netreba. Treba, aby to, čo už beží, prestalo žrať ruky.

{{hook}}

Typicky: triáž mailov, drafty, doklady do Pohody alebo report z dát, ktoré už máte.

Má {{company}} jeden systém, kde by to hneď uľavilo? Odpíšte ním. Alebo „nie“.

Dávid Stredánsky
{{landing}}
```

---

## 5. E — len po odpovedi (nesmie ísť cold)

**Subject:** `Vlastný systém? Len ak to má zmysel`

**Body (odpoveď, nie cold):**

```
{{salutation}}

ak hotové nástroje nestačia, staviam systém okolo vášho procesu. Nie naopak.

Najprv treba vedieť, čo sa má pohnúť v číslach. Ak to viete pomenovať, navrhnem, či to stavať, kúpiť, alebo nechať tak.

Dávid
```

---

## 6. Bump (cold-2), 4. až 6. deň, max raz

Rovnaký offer ako prvý mail. Kratší. Bez opakovania celej ponuky.

**Subject:** `Re: {{pôvodný subject}}` (skutočný reply thread, nie nový subject)

**Body:**

```
{{salutation}}

krátke doplnenie k mailu nižšie. Ak vo {{company}} niekto rieši, čo s AI po tom, keď ho ľudia už používajú, som k dispozícii.

Ak nie, dajte „nie“ a končím.

Dávid
```

---

## 7. Odpovede (draft, agent neposiela sám)

### Interested

```
Ďakujem.

Napíšte jednou vetou, ktorý proces vás najviac spomaľuje (maily, doklady, dopyty, niečo iné). Navrhnem ďalší krok: audit, jeden agent, alebo „toto neriešte“.

Dávid
```

### Not now

```
Jasné. Ozvem sa o pol roka, ak budete chcieť. Dovtedy vás nebudem ťahať.

Dávid
```

### Wrong person

```
Ďakujem. Máte kolegu, komu to má zmysel poslať, alebo to mám nechať tak?

Dávid
```

### Unsubscribe / „nie“

Bez odpovede. Suppression. Koniec.

---

## 8. Prompt: enrich

Vložiť do behu pred zápisom `LeadEnrichment`. **Zapisuj kontext, nielen URL.**

RPO už má konateľa (`statutoryBodies`, `validTo` IS NULL). Agregátory (Finstat, FOAF, Index podnikateľa, firmy.sk, ORSR) často ten istý register zrkadlia a občas pridajú ďalšie mená. Nie sú to firemný web.

```
Úloha: nájsť firmu na webe a verejný kontakt. Žiadny cold send bez emailu, ktorý si naozaj videl.

Vstup: názov, IČO, mesto, NACE, konateľ (RPO, full formatted name).

Krok 1 — hľadanie (Google / web search):
a) query presne IČO (8 číslic)
b) query názov firmy + Bratislava (alebo mesto)
c) ak je konateľ, query "krstné priezvisko" + názov firmy + kontakt/email

Každý hit ulož: url, title, snippet, type, hitIco, icoMatch.
type = aggregator | own_site | social | registry | other
hitIco = 8 číslic z toho hit-u, alebo null. icoMatch = hitIco === naše IČO.
Ak hitIco existuje a NIE JE naše IČO → type=other, z toho hitu neber email ani web.

NACE 6910 (právo): pred skip_reason=no_email MUSÍŠ query `site:sak.sk` + konateľ/firma a own-site /kontakt. website_enrichment.sakChecked=true.
NACE 86 (zdravie): pred no_email MUSÍŠ e-VÚC / zoznam lekárov. evucChecked=true.

Agregátory / register (nie own_site):
finstat.sk, foaf.sk, indexpodnikatela.sk, firmy.sk, instat.*, orsr.sk,
rpo.gov.sk, statistics.sk, zoznam.sk katalog, azet.sk firmy, linkedin.com,
facebook.com (stránka firmy = social, nie web).

Z agregátora ber kontext (ľudia, predmet činnosti, poznámka), nie ako oficiálny web.
Nízky zisk / 5k imanie na Finstat NIE JE skip.

Krok 2 — vlastný web:
own_site = doména, ktorá vyzerá ako firma (nie agregátor). Over kontakt / o nás / pätičku.
Parking, „pripravujeme“, Facebook-only bez mailu → skip_reason=no_site (aj tak zapíš search hity).

Krok 3 — ľudia:
- Konateľ z RPO vždy do people[] (source=rpo, role=konatel, firstName vyparsuj).
- Ďalšie mená z webu / FOAF / Finstat (source=url).
- firstName = prvé meno po odrezaní titulov (Ing., Mgr., JUDr., MUDr., Bc., PhD., LL.M., Dr., doc.).
  "Ing. Stella Slováková" → Stella. "JUDr. Peter Filip" → Peter.

Krok 4 — kontakt na firmu aj osobu:
- Emaily z own_site (kontakt, impressum, pätička, GDPR). Preferuj info@, office@, firma@.
- Osobný Gmail/Outlook len ak je výslovne pri mene.
- Nehádaj meno.priezvisko@ ak to nie je na stránke.
- Ak own_site má tím/advokáti, skús nájsť mail ku konateľovi.

Skip:
- NACE 82 + virtual office / sídlo na prenájom, kým own_site neukáže prevádzku → shell
- software house / „sme IT“ / vlastný vývoj AI → it_internal

Zápis (stredan):
- Company.website ak own_site
- LeadContact: fullName, first name môže byť v fullName, role, email, emailSource, isPrimary
- JSON do tmp/enrichment-<run>.json, SQL cez scripts/leadgen-apply-enrichment.ts (nie ručný INSERT)
- LeadEnrichment kind=search / people / website (unique per lead+kind)
- confidence 0–1. Email pod 0.4 = neposielať, skip_reason=no_email ak nemáš lepší.
- Lead.status = enriched, alebo skipped ak skip_reason. skipReason stĺpec + notes.

Nikdy nevymýšľaj email, telefón, LinkedIn. Ak si stránku neotvoril, daj type z snippetu a confidence nízke.
```

---

## 9. Prompt: score

```
Úloha: skóre 0–100 pre ponuky A–D. E len ak A–D max ≥ 80 alebo už bola odpoveď.

ICP áno: SK SME mimo IT, Bratislava priorita (už je v poole), ľudia skôr v Pohode/mailoch/Exceli ako vo vlastnom vývoji. Verejné AI už často skúšali.

ICP nie: software house, digitálna agentúra čo stavia AI, čistý NACE 82 shell, solamente živnosť, firma bez webu, payroll vendor (ADP), Big4 legal ako cold.

Pravidlá:
- Malý zisk / nízke imanie = 0 bodov. Neni to mŕtva firma.
- Žiadny web = max 30, neposielať (skip no_site).
- NACE 6920 účto: **A a C hore** (doklady, DPH, súkromné účty). C nie je len pre advokátov.
- NACE 6910 právo: **C a A hore**. B/D nižšie, kým nie je jasný workflow.
- NACE 86 zdravie: C a A hore.
- Výroba/veľkoobchod/stavba + doklady/sklad: D a B hore.
- „Chceme AI všade“ na webe bez jedného procesu: B dole.
- score je JSON integer (78), nikdy objekt / Python dict.

outputJson na každý Offer A–D:
{
  "score": 0-100,
  "send": true|false,
  "why_sk": "1–2 vety",
  "hook_id": "69-ucto" | "69-pravo" | ... | null,
  "risks": ["shell?","it?","no_email"]
}

LeadScore.score = score (integer), rationaleSk = why_sk.
ENRICH_ONLY: nequeue. skip_reason → Lead.status=skipped + skipReason. Inak enriched.
```

---

## 10. Prompt: render (draft) + send

`MODE=DRAFT_ONLY`: vyplň šablónu a **ulož** `Touch.status=draft` cez `scripts/leadgen-apply-drafts.ts`. **Neposielaj.** Žiadny Email MCP `send_message`. Žiadny nový RPO pull — len už enrichnuté leady v `stredan`.

`MODE=SEND` (zatiaľ vypnuté): až potom `send_message`, `Touch.status=sent`, `TouchEvent`, `Lead.contacted`.

```
Vezmi aktívny EmailTemplate (key=cold-1, locale=sk) pre ponuku z matrix bunky.

Vyplň len:
- {{salutation}} = "Dobrý deň," alebo "Dobrý deň, {krstné}," ak máme firstName. Nikdy priezvisko, p., pani, pán.
- {{company}} skrátene
- {{hook}} z knižnice podľa hook_id; ak null, vyhoď celý odsek s {{hook}} aj prázdny riadok
- {{landing}} = https://stredan.sk + Offer.landingPath

Nesmieš:
- dopísať vetu navyše
- zmeniť CTA
- dať cenu
- použiť em dash
- poslať E cold
- poslať na skip_reason, Suppression, alebo keď žiadne A–D nemá send=true ani score≥50
- nechať {{token}} v subjecte / tele

From = SendAccount. Reply-To = david@stredan.sk (použije sa až pri SEND).
DRAFT_ONLY: JSON → scripts/leadgen-apply-drafts.ts → INSERT Touch draft. Lead queued z early statusov. STOP.
SEND: až potom status=sent, TouchEvent sent, Lead.status=contacted.
```

---

## 11. Prompt: triáž inboxu

```
Hľadaj nové maily na účtoch 1–5 a na david@ (Leadgen/Replies ak existuje) od last run.

Match podľa Message-ID / In-Reply-To / from email = LeadContact.

Klasifikuj ReplyIntent:
- interested: chce call, „audit“, pomenoval proces, pýta cenu
- not_now: neskôr, po sezóne
- wrong_person: poslať kolegovi / ja to neriešim
- unsubscribe: odhlásiť, „nie“, „nekontaktujte“, GDPR
- bounce, ooo, unclear, other

Akcie:
- unsubscribe → Suppression (email + ico) + Lead.suppressed. Bez odpovede.
- interested → Lead.replied, Touch.replyIntent=interested. Draft odpovede podľa COPY.md §7. NEPOSIELAŤ, kým to David neschváli.
- not_now / wrong_person → intent zapísať, draft podľa §7, neposielať.
- ooo → ignorovať, neskôr.
- bounce → Touch.bounced, email do notes, neskúšať znovu.

Do AgentRun.outputJson: counts by intent + 3 surové citácie interested.
```

---

## 12. Cursor Automation (lepiť ako system)

Krátky overlay nad `AGENT_PLAYBOOK.md`. Playbook ostáva zdroj pravdy pre SQL a capy.

```
Si denný operátor Stredan outbound. Ľudský UI je stredan.sk/admin. MCP je len Postgres + mail.

Dnes: playbook + docs/leadgen/COPY.md + DRAFT_JSON.md (DRAFT_ONLY) / ENRICHMENT_JSON.md (ENRICH_ONLY).
SQL: drafts cez scripts/leadgen-apply-drafts.ts, enrich cez scripts/leadgen-apply-enrichment.ts.
Hotový beh = AgentRun.status v admine, nie Cursor RUNNING.

Hard:
- max 40 sendov, dailyCap na účet
- nie IT software house
- nízky zisk ≠ mŕtva firma
- Bratislava pool je už zoradený, nerieš to znova
- E nie cold
- Reply-To david@stredan.sk
- žiadny vymyslený email
- žiadny em dash v copy
- slovo ChatGPT / Claude / Gemini do mailu nedávaj
- oslovenie len krstným menom, inak bez mena; v tele vykanie
- odpovede nenaosobne neodosielaj
- search hity (aj Finstat/FOAF) zapisuj do LeadEnrichment kind=search

Default tento beh: DRAFT_ONLY (draft už enrichnutých, 0 sendov, žiadny nový RPO pull), kým David nepovie SEND.
ENRICH_ONLY ostáva ako flip, keď treba ďalších 50 firiem — stále 0 sendov.

Na konci: krátky bullet report (bunky, interested, 3 fail, 1 tweak).
```
