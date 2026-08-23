# SEND warmup plán

Kedy čo zapnúť, aby prvých 40 sendov/deň nespálilo domény ani mailboxy. Playbook (`AGENT_PLAYBOOK.md`) popisuje **ako** posielať; tento súbor **kedy a koľko**.

---

## 0. Predletový checklist (všetko musí byť ✅ pred prvým sendom)

| # | Vec | Ako overiť |
|---|-----|-----------|
| 1 | Read-through všetkých 30 draftov | `/admin/touches` — urobené 23. 8., 0 chýb (bez em dash, tokenov, AI mien; oslovenia krstným menom OK) |
| 2 | Mailboxy 1–4 prijatelné | poslať test mail na vlastnú adresu z každého účtu cez Email MCP |
| 3 | Gmail App Password | `gmail-stredan` potrebuje App Password (pozri [EMAIL.md](./EMAIL.md)) — bez neho účet 1 vynechať z prvého týždňa |
| 4 | SPF/DKIM na `email.stredan.sk` aj `stredan.sk` | Resend dashboard → Domains → status Verified |
| 5 | `Reply-To: david@stredan.sk` | nastaviť pri renderi sendu (playbook to vyžaduje až v MODE=SEND) |
| 6 | Unsubscribe mechanizmus | odpoveď „nie“ = Suppression; do prvého sendu pridať do šablóny P.S. riadok „Odpovedzte „nie“ a už nepíšem.“ ak ho tam nemá |
| 7 | Triage zapnutý | MODE=SEND beh musí po sende spraviť inbox pass (COPY.md §11), inak odpovede padajú na zem |
| 8 | Drafty nie staršie než ~14 dní | 30 draftov z 20. 8. → posledný bezpečný send ~3. 9.; potom regenerovať |

## 1. Drafty z 20. 8.

Stav: 30 kusov (C×23, A×4, B×3). Obsahovo prešli kontrolami. **Neposielať všetky naraz** — ramp nižšie ich rozotrie na ~2 týždne. Ak medzitým príde nová DRAFT_ONLY várka, nové idú do radu za staré (FIFO per lead je jedno; dôležitý je denný objem).

## 2. Ramp (denný celkový limit, rozdelený rovnomerne na aktívne účty)

| Fáza | Dni | Sendy/deň | Na účet | Poznámka |
|------|-----|-----------|---------|----------|
| 0 | deň 1–3 | **4** | 1 | len bunky C×3 a C×2 (najlepší fit pool) |
| 1 | deň 4–7 | **8** | 2 | pridať C×1, C×4; Gmail až po App Password |
| 2 | týždeň 2 | **16** | 4 | pridať A bunky |
| 3 | týždeň 3 | **24** | 6 | pridať B/D keď budú mať leady |
| 4 | týždeň 4+ | **40** | 8 | plný cap; `dailyCap` 8 drží strop |

Pravidlo: **zvýš objem len ak** bounce rate < 3 % a žiadny spam report. Ktorýkoľvek bounce spike → daný účet na 48 h von (SendAccount.active=false), ostatné bežia.

## 3. Čo sledovať ráno (počas rampy)

1. `/admin/matrix` — odpovede po bunkách. Prvá odpoveď na ľubovoľný cell = hlavný signál experimentu.
2. `Touch.status=bounced` / chyby — viac ako 1 bounce na účet v dni = pauza účtu.
3. Inbox triage výstupy v AgentRun.outputJson (`interested`, `unsubscribe`).
4. Unsubscribe okamžite do `Suppression` (email + IČO) — bez diskusie.

## 4. Po 40+ sendoch (~50–60 dotazovaných firiem)

Prvá poriadna readout: odpovede per offer × subject varianta × účet. Ak má C ≥ 10 sendov a 0 odpovedí, problém nie je v matrixe alebo v copy — pozri hooky a ICP fit pred tým, než sa púšťať do ďalších 100 sendov.

## 5. Čo nerobiť

- Nezvyšovať capy rýchlejšie než tabuľka vyššie (nové domény potrebujú 2–3 týždne reputácie).
- Neposielat z `hello@stredan.sk` (brand doména) cold maily skôr než fáza 2 — chráň marketing adresu.
- Nezapínať auto-booking ani automatické odpovede na interested — vždy draft na schválenie.
