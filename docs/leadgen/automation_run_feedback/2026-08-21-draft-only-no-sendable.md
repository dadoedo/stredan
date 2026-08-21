# DRAFT_ONLY 2026-08-21 — no sendable leads

**AgentRun:** `run_20260821_d4e8f1a2`  
**Status:** succeeded (early stop)  
**Mode:** DRAFT_ONLY

## Result

- **Sendable found:** 0
- **Drafted:** 0
- **Sent:** 0

## Pipeline state

| Bucket | Count |
|--------|------:|
| Queued with draft Touch (yesterday) | 30 |
| Enriched, no Touch | 65 |
| Enriched + email + score≥50 but `skipReason` set | 10 |
| Enriched + email + no skipReason | 0 |

## Why 0 sendable

`scripts/leadgen-sendable.sql` requires `Lead.skipReason IS NULL`. All 10 untouched leads that have both email and A–D score≥50 carry `skipReason` of `no_site` or `no_email` from ENRICH_ONLY (email was found on a later pass or via aggregator, but skip was not cleared).

The other 55 untouched enriched leads have no email.

## Recommended next step

1. **ENRICH_ONLY** on next cron (flip stub) to pull 50 new RPO firms, **or**
2. David reviews the 10 skipReason+email leads in admin and clears skip where email is verified.

## Top failures

1. Sendable pool exhausted after yesterday's 30 drafts
2. 10 leads blocked by stale skipReason despite having LeadContact email
3. 55 enriched leads still missing public email

## Tweak

Consider a one-time admin pass to reconcile `skipReason=no_email` when `LeadContact.email` exists and confidence ≥ 0.4, before next DRAFT_ONLY.
