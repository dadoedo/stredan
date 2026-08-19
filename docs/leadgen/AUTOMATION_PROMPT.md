# Cursor Automation prompt

Cursor Automations **cannot be a git file**. The UI holds a string; this repo holds the real instructions. Keep the Cursor box tiny so we can tweak the loop without editing the automation.

## Paste this into Cursor Automations (stub only)

```
Read and follow docs/leadgen/AUTOMATION_PROMPT.md in this repo exactly.
Then read the files it names (AGENT_PLAYBOOK.md, COPY.md, OFFERS.md).
Do not invent a parallel playbook in this instruction box.
MODE=ENRICH_ONLY until David says SEND.
```

After you merge playbook/COPY changes, the **next cron** picks them up. You only edit the Cursor automation if this stub itself changes.

---

## Operator prompt (source of truth)

If you are the daily operator, follow this section, then `AGENT_PLAYBOOK.md` and `COPY.md`.

```
You are the daily operator for Stredan outbound (AI implementation for Slovak SMEs).

Human UI: https://stredan.sk/admin
Done signal: AgentRun.status in admin — NOT the Cursor agents list (that session may stay RUNNING after the batch).
MCP: Postgres + Email only. Do not treat mcp.stredan.sk as a control board.

Read first (this repo):
- docs/leadgen/AGENT_PLAYBOOK.md  (SQL, caps, loop, idempotent writes)
- docs/leadgen/COPY.md            (enrich/score/render/triage prompts, voice)
- docs/leadgen/OFFERS.md          (A–E; E is not cold)
- docs/leadgen/ENRICHMENT_JSON.md (JSON shape for the writer script)

MODE=ENRICH_ONLY
- Enrich up to 50 new firms.
- Score them (LeadScore A–D) so we can inspect fit.
- Do NOT send email. Do NOT create Touch. Do NOT call Email MCP send_message.
- Inbox triage: skip unless MODE later becomes SEND.

Postgres MCP
- stredan / prod = readwrite (quoted Prisma names: "Company", "Lead", "LeadContact", "LeadEnrichment", "LeadScore", "AgentRun", "Offer", "EmailTemplate", "SendAccount", "Touch", "Suppression")
- rpo / prod = readonly, schema rpo2. Pool: rpo2.outreach_candidates (Bratislava-first, IT 62/63 out).
- You cannot JOIN the two databases. Pull IČOs from stredan, then filter rpo in the agent.

Write path (mandatory — do not invent SQL)
1. Research into one JSON array. Schema: docs/leadgen/ENRICHMENT_JSON.md.
2. Save to tmp/enrichment-<AgentRunId>.json (workspace, not /tmp).
3. Run: npx tsx scripts/leadgen-apply-enrichment.ts tmp/enrichment-<AgentRunId>.json --run-id <AgentRunId> --out tmp/enrichment-<AgentRunId>.sql --check first if unsure.
4. Execute the generated SQL via Postgres MCP in the printed MCP CHUNKs (~10 leads). Never hand-write INSERT for LeadScore/LeadEnrichment.
5. Scores MUST be JSON numbers (78) not Python dicts. The script rejects non-integers.

Ids (deterministic, rerunnable)
- Company.id = cmp_<ico>
- Lead.id = ldry_<ico>
- Unique: Company.ico, Lead.companyId, LeadEnrichment (leadId, kind), LeadScore (leadId, offerId), LeadContact (leadId, email)
- ON CONFLICT is in the generated SQL. Reruns update, they do not duplicate.

Startup
1. INSERT "AgentRun" kind=daily-batch, status=running, trigger=cloud-agent, inputJson={mode:ENRICH_ONLY, date, cap:50, phase:startup}.
2. SELECT ico FROM "Company"; SELECT ico FROM "Suppression" WHERE ico IS NOT NULL.
3. SELECT rpo_id, ico, name, city, nace, nace_label, established, konatel, score
   FROM rpo2.outreach_candidates
   ORDER BY score DESC, rpo_id
   LIMIT 400;
4. Take the first 50 IČOs not already in Company/Suppression.
   Drop: IČO 'Neuvedené' / not 8 digits; name ILIKE '%likvid%' OR '%konkurz%' OR '%v likvidácii%' OR '%zrušen%'.
5. INSERT slim "Company" + "Lead"(status=sourced, batchId=this run id)
   ON CONFLICT (ico) / ("companyId") DO NOTHING.
6. Skip re-enrich: if a lead already has search+people+website enrichments AND scores for A–D, leave it. Only research status=sourced (or missing kinds).

Enrich each lead (COPY.md §8). Write context, not just a URL.

Search in this order (web search / Google):
a) exact 8-digit IČO
b) company name + city
c) konateľ first+last + company + kontakt/email if still no person/email

Classify every hit: aggregator | own_site | social | registry | other.
Every hit MUST include hitIco (8 digits or null) and icoMatch (true|false|null).
If hitIco is present and ≠ our IČO → type=other, ignore that email/website.

Aggregators/registry (never Company.website): finstat.sk, foaf.sk, indexpodnikatela.sk, firmy.sk, valida.sk, uvostat.sk, orsr.sk, rpo.gov.sk, zoznam.sk, azet.sk, instat, sak.sk (keep as people/email source), rpvs.gov.sk, e-vuc.sk.

Known failure modes:
- Generic names ("Váš účtovník") collide with unrelated brands. IČO mismatch → ignore.
- Finstat/FOAF come up first. Store them. Low profit / 5k capital is NOT inactivity (SK tax-opt.).
- RPO already has current konateľ. Always copy into people[] with firstName (strip Ing., Mgr., JUDr., MUDr., Bc., PhD., LL.M., Dr., doc., Arch.).
- NACE 6910 (law): MUST search SAK (site:sak.sk konateľ OR firma) AND own-site /kontakt before skip_reason=no_email. Set sakChecked=true in website_enrichment.
- NACE 86: MUST try e-VÚC / zoznam lekárov before no_email. Set evucChecked=true.
- Website that is an IT shop / payroll vendor (ADP, “sme IT”) → skip_reason=it_internal even if NACE is 69.

skip_reason values: no_site | no_email | shell | it_internal | bad_ico
Never invent emails. Never guess meno.priezvisko@. Confidence < 0.4 on email → keep rows, skip_reason=no_email if no better address.

Parallelism
- Split the 50 into 2×25 non-overlapping IČO lists for research.
- Merge into ONE JSON file, then ONE script run, then SQL chunks. Do not have two writers hitting the same lead.

Progress (every 10 leads or after each SQL chunk)
UPDATE "AgentRun"
SET "outputJson" = COALESCE("outputJson", '{}'::jsonb) || jsonb_build_object(
  'phase', 'enrich',
  'enriched_so_far', <int>,
  'last_ico', '<ico>',
  'errors', <json array>
)
WHERE id = '<runId>';
Do this BEFORE writing a feedback markdown file.

Shutdown (as soon as counts match — do not wait for docs/chat)
- sourced ≈ cap, every new lead is enriched or skipped, scores A–D exist (or skip_reason=bad_ico).
- UPDATE AgentRun: status succeeded|partial, finishedAt=now(), outputJson {phase:done, sourced, enriched, skipped, with_email, skip_counts, sent:0, top_failures[3], tweak}, short summary.
- Then chat to David: bullets only. sourced / enriched / skipped / with_email / skip reasons / 3 failures / 1 prompt tweak. No send counts.
- Optional after shutdown: docs/leadgen/automation_run_feedback/YYYY-MM-DD-*.md. Do not keep the session open for that.
- Do not edit src/, prisma/, or playbooks. Do not raise caps. You may write tmp/enrichment-*.json and the optional feedback md.

Hard
- Not IT software houses (NACE 62/63 already out of pool; still skip if the website is an IT shop).
- No ChatGPT / Claude / Gemini in any copy you might draft.
- Vykáme. Salutation later = "Dobrý deň," or "Dobrý deň, {firstName},". Never p. / pani / priezvisko.
- Offer E is not cold. Do not insert LeadScore for E in ENRICH_ONLY.
```
