# Automation run feedback — 2026-08-23 pipeline review (po batch 2 + prvom DRAFT_ONLY)

**Rozsah:** stav za 19.–21. 8. 2026 (ENRICH_ONLY batch 1 + 2, DRAFT_ONLY 20. 8., DRAFT_ONLY 21. 8.) + návrhy na vylepšenie.
**Zdroj:** tabuľky `AgentRun`, `Lead`, `LeadScore`, `LeadEnrichment`, `Touch`, `SendAccount` v `stredan` prod + `docs/leadgen/*`.

---

## 1. Stav behov

| Beh | Mode | Trvanie | Výsledok |
|-----|------|---------|----------|
| `dryrun-20260819` | ENRICH_ONLY (8 firiem) | < 1 min zápis | 8 enrichnutých, **bez skóre A–D** |
| `6c267879…` (batch 1) | ENRICH_ONLY 50 | ~129 min | 50 enriched, 21 s emailom |
| `fa2eb21d…` (batch 2) | ENRICH_ONLY 50 | **~6 h** | 37 enriched (+18 zachránených hollow leadov), 18 s emailom |
| `run_20260820_…` | DRAFT_ONLY | ~89 min | **30/30 draftov** (Touch.status=draft), 5 údajných leftovers |
| `run_20260821_…` | DRAFT_ONLY | 7 s | sendable = 0 → STOP (správne správanie) |

Aktuálne DB fakty (23. 8.):

- `Touch`: **30 riadkov, všetky `status=draft`**, žiadny send. Rozloženie: **C×23, A×4, B×3, D×0** cez účty 1–4.
- Leady: 30 `queued` (majú draft), 53 `enriched` (32 no_site, 12 no_email, 21 bez skip reason), 13 `skipped`.
- `Suppression`: 0 (OK, nič sa neposielalo).
- Dedupe: 0 duplicitných `LeadEnrichment` aj `LeadScore` (unique constrainty držia).
- Sendable dotaz (scripts/leadgen-sendable.sql) vracia **0 riadkov** — potvrdené ručným rerunom.

---

## 2. Čo sa opravilo oproti batch 1 (P0 spätná kontrola)

| P0 z 19. 8. | Stav |
|-------------|------|
| Idempotentný writer skript namiesto ad-hoc SQL | ✅ `leadgen-apply-enrichment.ts` + `leadgen-apply-drafts.ts` v produkcii, 0 dupl. |
| Unikátne `(leadId, kind)` / `(leadId, offerId)` | ✅ v schema.prisma, v DB 0 dupl. |
| `COPY.md` chýbal | ✅ existuje (hook knižnica, enrich/score/render prompty) |
| Shutdown až po dokumentácii | ✅ batch 2 aj obe DRAFT_ONLY behy sa zatvárali hneď; feedback md až po shutdowne |
| Progress v `outputJson` | ✅ `{phase, drafted_so_far, last_ico, errors}` |
| „Batch done“ = AgentRun.status | ✅ zapísané v playbooku i v AUTOMATION_PROMPT |

---

## 3. Zistenia

### Z1 — Sendable front je prázdny, ďalší cron opäť urobí nothing (najdôležitejšie)

Pool ~100 enrichnutých firiem je vyčerpaný: 30 má draft, zvyšok je no_site/no_email/pod prahom. DRAFT_ONLY teraz každý deň len zapíše `sendable: 0`. Guardrail „0 sendable → STOP, nepadaj do enrich“ je správny, ale znamená to, že **default mód je mŕtvy**, kým David neprepne na ENRICH_ONLY.

### Z2 — Štyri leady z dryrunu majú enrichment, ale žiadne skóre → neviditeľné pre sendable

`AK Laliková`, `Europe Express`, `Mráz Agro`, `TORA Legal` majú 3× `LeadEnrichment` a primárny email, ale **0 riadkov `LeadScore`** (dryrun zapísal len enrichment). Piaty (`UAVONIC`) má skóre 8–15 bez `send=true`. Preto „5 leftovers“ z 20. 8. v skutočnosti nie sú sendable. Root cause: neexistuje invariant „enriched lead s emailom musí mať ≥1 skóre A–D“ — pisací skript to nevynucuje.

### Z3 — 30 draftov starne v `draft` stave

Drafty z 20. 8. čakajú na MODE=SEND a konfiguráciu mailboxov. Capy počítajú len dnešné Touches, takže nestavia nič blokujú — ale obsahovo zastarávajú a odpoveď „áno/nie“ CTA je časovo citlivá. Rozhodnutie SEND vs. ďalší enrich-only týždeň je na Davida; medzitým treba drafty pred sendom prečítať (kvalita bola pri vzorkovaní dobrá: hooky sedeli na NACE, bez tokenov, bez em dash, vykanie OK).

### Z4 — Matrix je jednostranný: C dominuje, D ani raz

Random výber bunky nad poolom, kde 65/100 skórovalo ≥50 na C (vs. 11 na A, 3 na B, 0 na D), dá štatisticky C×23/D×0. Nie je to chyba agenta — je to **bias zdrojového poolu** (advokáti + účtovníci). Experiment „5 ponúk naraz“ zatiaľ testuje hlavne jednu ponuku. Účet 5 neaktívny; kanály 1–4 = gmail / resend / smtp / resend (2× Resend, rozdielne domény — akceptovateľné).

### Z5 — Subject varianta: agent vždy zobral č. 1

Vzorka draftov: všetky C maily majü subject `Firemné AI, nie súkromné účty`, nikdy variantu 2. Šablóny majú 2 varianty práve na testovanie; render prompt to nenaviguje na náhodný výber.

### Z6 — Rýchlosť enrich klesla (batch 2 ~6 h vs. batch 1 ~2 h)

Batch 2 strávil čas záchrannou hollow leadov (predčasné `Lead.status` update pred zápisom enrichmentov). Cieľ „50 enrich < 60 min“ z P3 sa nedosiahol; deterministické helpery (MX check, `/kontakt` fetch) zostávajú najväčší lever.

---

## 4. Odporúčania

### P0 (pred ďalším cron)

1. **Doplniť skóre A–D štyrom dryrun leadom** (Z2) — jeden malí scoring pass podľa COPY.md §9; uvolní tým 4 sendable.
2. **Invariant do writer skriptu:** `apply-enrichment.ts` odmietne JSON, kde lead končí `enriched` + email, ale nemá žiadne `LeadScore` A–D. Zabráni opakovaniu Z2 natrvalo.
3. **Rozhodnúť plán módu:** buď prepnúť stub na `ENRICH_ONLY` (nový 50-kus, ideálne iné NACE segmenty — logistika, veľkoobchod, výroba, aby dostali B/D priestor podľa Z4), alebo ísť do SEND. Alternatíva: pevný rotacný harmonogram (napr. po/ne enrich, ut/st/št draft), aby front nikdy nevyschol.

### P1 (kvalita experimentu)

4. **Stratifikovaný výber bunky** namiesto čistého random: round-robin per offer v rámci leadových sendable offers (napr. max rozdiel 3 medzi najmenej a najviac použitou ponukou), kým nemáme ≥30 odpovedí. Inak sa experiment zrúti na „testujeme C“.
5. **Randomizácia subject varianty** v render kroku (50/50 medzi variantami 1/2, zapísať do `Touch.personalization`), inak os „subject“ netestuje nič.
6. **Pred SEND: read-through všetkých 30 draftov** v `/admin/touches` + doplniť `fromAddress`/Reply-To overenie na účtoch 1–4.

### P2 (observabilita / hygiene)

7. **Dashboard metrika „pipeline depth“:** sendable dnes / drafted celkom / enrichnuté s emailom — jeden SQL view, aby bolo vidno hladovanie skôr než v rání 05:05.
8. **Jednotný formát `AgentRun.id`** (teraz `run_YYYYMMDD_xxx` aj uuid aj `dryrun-*`) — kozmetika pre admin triedenie.
9. **Enrich rýchlosť:** deterministické helpery (MX, sitemap/kontakt fetch) ako MCP tools podľa COST.md §8; ciež ostáva <60 min/50 firiem.

---

## 5. Checklist „čo ďalej“

- [ ] Backfill skóre: AK Laliková, Europe Express, Mráz Agro, TORA Legal
- [ ] Invariant v `apply-enrichment.ts`
- [ ] Rozhodnutie: ENRICH_ONLY (nové segmenty) vs. SEND warmup
- [ ] Ak SEND: prečítať 30 draftov, potvrdit mailboxy 1–4, nastaviť Reply-To david@stredan.sk
- [ ] Playbook tweak: stratifikácia buniek + random subject varianta
