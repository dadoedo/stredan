# Leadgen system — ako to má celé fungovať

Toto je kanonický popis outbound labu Stredan. Ostatné súbory v `docs/leadgen/` sú detaily (ponuky, playbook, RPO, ceny). Ak sa niečo rozchádza, platí tento dokument.

**Produkt:** predaj AI implementácie slovenským SME (Stredan s. r. o.).  
**Lab:** vysoký objem cold emailov, ktoré testujú 5 ponúk naraz, s merateľným experimentom.

---

## 1. Idea

Nie Instantly, nie Clay, nie LeadGen OS. Lab je **vlastný**:

1. Zoznam firiem berieme z verejného registra (RPO), nie z kúpeného lead listu.
2. Cursor Cloud Agent / Automation je denný operátor: vyberie firmu, nájde kontakt, skóruje fit, pošle, triážuje odpovede.
3. Postgres je source of truth. Každý úsudok ide do DB ako `inputJson` / `outputJson`.
4. Ty ráno otvoríš admin a vidíš, čo odišlo, z ktorej bunky, aké boli odpovede, a upravíš vzory.

Cieľ v1 nie je autonómny predaj. Cieľ je **rýchlo zistiť, ktorá kombinácia obsahu × odosielacej identity ťahá meetingy**, bez budovania enrich pipeline ako produktu.

---

## 2. Tri povrchy (nezamieňať)

| Povrch | URL | Úloha |
|--------|-----|--------|
| **Cursor Automations** | cursor.com / Agents | Control board. Schedule, prompt, beh agenta. |
| **MCP** | https://mcp.stredan.sk | Len prístup: Postgres + emaily. Nie dashboard agentov. |
| **Admin** | https://stredan.sk/admin | Ľudský ops UI: matrix, šablóny, leady, odoslané, behania. |

Cloud agenti **nečítajú** laptop `~/.cursor/mcp.json`. Používajú Team MCP:

- `https://postgres.mcp.stredan.sk`
- `https://email.mcp.stredan.sk`

Kľúč `cursor-cloud` má `databases: *` a `emails: *`.

**Nie je HTTP API pre leadgen.** Agent píše priamo do DB cez Postgres MCP. Enrichment automatizácia tiež; stačí jej MCP prístup, nie endpoint na stredan.sk.

---

## 3. Experiment: matrix A–E × 1–5

```text
              účet 1     účet 2     účet 3     účet 4     účet 5
            (Gmail…)   (Resend…)     …           …           …
offer A       A×1        A×2        A×3        A×4        A×5
offer B       B×1        B×2         …          …          …
offer C        …
offer D        …
offer E        …                                         E×5
```

| Osa | Čo to je | Tabuľka |
|-----|----------|---------|
| **A–E** | Typ komunikácie / opening / cold offer (obsah) | `Offer` + `EmailTemplate` |
| **1–5** | Identita, z ktorej mail odchádza | `SendAccount` → Email MCP `accountKey` |

Šablóna **nie je** viazaná na Gmail vs Resend. Obsah je A–E. Kanál a from-address berie send účet.

Každý send (až MODE=SEND):

1. Vyberie **náhodnú aktívnu bunku**, ktorá je ešte pod capom.
2. Zapíše `Touch` s `offerId` + `sendAccountId` + `templateId` + `accountKey`.
3. Pošle cez Email MCP tým účtom.

`MODE=DRAFT_ONLY` robí kroky 1–2 a **zastaví** na `Touch.status=draft`. Neposiela. Neťahá nové firmy z RPO — ide len cez leady, ktoré už sú v `stredan`.

V admine `/admin/matrix` vidíš volume a odpovede po bunkách. Neskôr vieme pridať dimenzie (denná doba, subject variant, ICP segment) ako ďalšiu os; v1 je 2D.

### Caps (warmup)

- Max **40 sendov / deň** spolu.
- Max `SendAccount.dailyCap` na účet (default **8**).
- Offer E nie je primárny cold CTA; až po interest / vysokom skóre.

Kým mailboxy 1–5 nie sú zapojené, agent **neposiela**. Môže enrichovať, skórovať a v `DRAFT_ONLY` ukladať drafty.

Módy (jeden na beh, nemiešať):

| Mode | Čo robí |
|------|---------|
| `ENRICH_ONLY` | Ďalších až 50 firiem z RPO + skóre A–D. Žiadny Touch. Rotuj NACE segmenty podľa „Batch mix“ v playbooku. |
| `DRAFT_ONLY` | Draft z **už enrichnutých** sendable leadov v `stredan`. Žiadny RPO pull. Cap 40. Ak je sendable = 0, STOP (nezačne enrich). |
| `SEND` | Email MCP. Ramp + predletový checklist: [SEND_PLAN.md](./SEND_PLAN.md). Zapína výslovne David. |

Rotácia módov: kým je pool tenký → `ENRICH_ONLY` (rotácia segmentov), keď má ≥20 čerstvých sendable → `DRAFT_ONLY`, send až po Davida.

---

## 4. Dáta

Dve databázy na tom istom Postgres (`stredan-db` na alldevs-hetzner). Zámerné oddelenie.

### `rpo` (readonly na MCP)

- ~380k aktívnych s.r.o. / a.s. / k.s. / v.o.s. / družstiev.
- Schema `rpo2.organizations`, JSONB `data`.
- Ranked pool `rpo2.outreach_candidates`: SME mimo IT (výroba, obchod, stavba, účto, logistika, …). NACE 62/63 sú von. **Bratislava first**. Aktívna firma = aktuálny konateľ + aktuálna adresa, nie zisk (SK daňová optimalizácia).
- Nie je to lead list. Je to register. Do `stredan` kopírujeme len firmy, ktoré reálne zaradíme do frontu.
- Detail: [RPO.md](./RPO.md). Import filter: `scripts/rpo-import-filter.py`.

### `stredan` (readwrite na MCP)

| Entita | Úloha |
|--------|--------|
| `Offer` | A–E, landing `/offers/[slug]`, ICP poznámky |
| `EmailTemplate` | Vzor (subject + body), unique `(offer, key, locale, version)` |
| `SendAccount` | Stĺpce 1–5, `mcpAccountKey`, `dailyCap`, `active` |
| `Company` | Slim kópia z RPO (IČO, mesto, NACE, `rpoId`) |
| `Lead` | Stavový stroj: sourced → … → contacted / replied / suppressed / skipped |
| `Lead.skipReason` | Enum: no_site / no_email / shell / it_internal / bad_ico (nielen notes) |
| `LeadContact` | Email, zdroj, primary; unique `(leadId, email)` |
| `LeadEnrichment` | Úsudok agenta: search / people / website; unique `(leadId, kind)`; **input/output JSON** |
| `LeadScore` | Fit 0–100 × offer; unique `(leadId, offerId)`; **input/output JSON** |
| `Touch` | Konkrétna odoslaná (alebo queued) správa + bunka matrixu |
| `TouchEvent` | sent / reply / bounce / unsubscribe |
| `AgentRun` | Jeden beh automatizácie; **input/output JSON** + summary |
| `ExperimentDaily` | Agregát `(deň, offer, sendAccount)` |
| `Suppression` | Email / IČO, ktoré sa už nesmú kontaktovať |

Ponuky A–E: [OFFERS.md](./OFFERS.md). Landingy žijú na webe; seed `npm run seed:leadgen`.

---

## 5. Denný loop (operator = Cursor automation)

Playbook pre agenta: [AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md).

```text
MODE=ENRICH_ONLY:
  RPO ranked pool → Company + Lead(sourced) → enrich → score A–D → STOP (no Touch)

MODE=DRAFT_ONLY (default teraz):
  sendable leads už v stredan (email, no skip, no Touch, A–D sendable)
    → náhodná bunka pod capom
    → render EmailTemplate → Touch(draft)
    → STOP (no Email MCP)

MODE=SEND (vypnuté):
  Touch(draft) → Email MCP send → triáž inboxu → ExperimentDaily
```

Ty ráno:

1. `/admin/runs` — čo agent spravil, chyby, input/output.
2. `/admin/matrix` — ktorá bunka koľko poslala / koľko odpovedí.
3. `/admin/touches` — konkrétne maily.
4. `/admin/leads` — enrichnuté firmy (agent to musí vyplniť do DB).
5. `/admin/templates` — úprava vzorov, keď niečo nefunguje.

Žiadny auto-booking meetingov, kým to výslovne nepovieš.

---

## 6. Admin mapa

Po logine (`ADMIN_PASSWORD`) default je matrix, nie projekty.

| Cesta | Čo |
|-------|----|
| `/admin/matrix` | A–E × 1–5, dnešné sendy, posledné behania |
| `/admin/templates` | CRUD vzorových správ |
| `/admin/accounts` | Mapovanie 1–5 → MCP account key, cap, active |
| `/admin/leads` | Leady + enrichment JSON |
| `/admin/touches` | Všetky odoslané / queued správy |
| `/admin/runs` | AgentRun log |
| `/admin/projects` | Pôvodné CMS portfólia |

Účet 1–5 sa v matrici berie ako aktívny, len keď má `mcpAccountKey` a `active = true`.

---

## 7. Ako to má ísť dokopy (ľudský setup)

1. **Mailboxy 1–5** na mcp.stredan.sk (Gmail / Resend / SMTP). IMAP foldre `Leadgen/A`…`E`, `Leadgen/Replies`.
2. V `/admin/accounts` doplniť `mcpAccountKey` = kľúč z MCP UI, zapnúť.
3. Sending domain(y) oddelené od marketing `stredan.sk` (deliverabilita).
4. Cursor Automation: denný schedule. **Do UI daj len stub** z [AUTOMATION_PROMPT.md](./AUTOMATION_PROMPT.md) — celý playbook žije v gite, nie v duplicite v Cursor boxe.
5. Prvý beh: **50 firiem, enrich only, 0 sendov**. Skontrolovať JSON v admine.
6. Potom `DRAFT_ONLY` na tých istých leadov (Touch draft, 0 sendov). Writer: `scripts/leadgen-apply-drafts.ts`.
7. Až potom warmup sendy pod capmi.

Checklist treťostrán: [THIRD_PARTIES.md](./THIRD_PARTIES.md).

---

## 8. Prečo agent, nie scraper produkt

Pri ~50 enrich/deň je Cursor agent lacnejší na TCO ako Clay/Apollo/vlastný crawler. SQL z RPO je zadarmo. LLM je na úsudok (fit, personalizácia, intent), nie na `SELECT` 380k riadkov.

Keď objem prekročí ~200–500 enrich/deň, **nemeníme architektúru**. Pridáme lacné nástroje, ktoré agent volá: MX check, `info@` pattern, sitemap fetch, prísnejší NACE filter. Orchestrátor ostáva agent. Detail: [COST.md](./COST.md).

---

## 9. Idea do budúcna

V tomto poradí, nie naraz:

1. **Ďalšie osi matrixu** — napr. time-of-day, subject variant (`cold-1` / `cold-2`), ICP segment (NACE / mesto). `Touch` už drží bunku; extra dimenzie môžu ísť ako JSON alebo nové FK.
2. **Váhy namiesto čistého random** — po ≥30 odpovediach upweight winner bunky, 10–20 % exploration na looseroch.
3. **Resend webhooks** → `TouchEvent` (open/bounce) bez Gmail pixelov.
4. **Deterministic helpers** ako MCP/SQL tools (pozri §8).
5. **Meeting CTA** (Cal.com) na landingoch, stále human-gated booking.
6. **PostHog** na konverziu `/offers/*` (MCP už existuje).
7. **Viaceré sending domains** + warmup per účet.
8. Až pri veľkom objeme zvážiť frontu/worker. Nie deň 1.

Čo **nechceme** stavať: full CRM produkt v tomto repo, mcp.stredan.sk ako control board, autonómne míňanie bez denného pohľadu.

---

## 10. Compliance (pevné)

RPO/ORSR je verejný. Objavovanie emailov **nie je** automaticky súhlas na spam.

- Preferovať firemné / kontaktné adresy z webu pred hádáním osobných inboxov.
- `emailSource` logovať v enrichment output.
- Unsubscribe → `Suppression` + stop. Bez funkčného unsubscribe nezvyšovať capy.
- Pri väčšom scale konzultovať SK/EU základ s právnikom.

---

## 11. Kde čo žije (infra)

| Vec | Kde |
|-----|-----|
| Web + admin | `stredan.sk`, image `ghcr.io/dadoedo/stredan`, host `alldevs-hetzner` |
| App DB `stredan` | `stredan-db`, port 15434 public / 5434 na hoste |
| RPO DB `rpo` | ten istý Postgres, iná databáza |
| MCP platform | `stredan-hetzner` (`178.105.3.145`), dashboard mcp.stredan.sk |
| Deploy | GitHub Actions `Deploy stredan` pri pushi na `main` |
| Schema | Prisma v tomto repo; deploy **nerobí** `db push` sám. Leadgen tabuľky sú na produ už. |

Ďalší infra kontext: [../infrastructure.md](../infrastructure.md), [../cloud-agents/mcp.md](../cloud-agents/mcp.md).
