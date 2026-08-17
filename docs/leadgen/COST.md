# Cost: agent-orchestrated vs full deterministic enrich

## Your pushback

> Deterministic enrich may be more expensive than Cursor auto agents.

**Mostly agree for v1 volume.**

## Math (order of magnitude)

Assume 50 leads/day enriched + scored + drafted.

| Approach | Build cost | Run cost / day | Notes |
|----------|------------|----------------|-------|
| Cursor Cloud Agent + SQL + public web | Low (playbook + DB) | Agent minutes + $0 SQL | Fits your MCP stack |
| Clay / Apollo / custom scrapers + queues | High setup + seats | $–$$ per lead | Better at 1k+/day |
| Fully coded enrich pipeline in-repo | Medium–high engineering | Cheap at scale | You become scraper maintainer |

At **<100 enrichments/day**, agent-as-operator wins on total cost of ownership.

At **>500/day**, keep the agent as orchestrator but add cheap deterministic *tools*:

- MX / disposable check
- `info@` / `kontakt@` pattern from domain
- sitemap/contact page fetch without LLM
- NACE/legal-form SQL filters only

## What stays agent forever

- Offer assignment judgment
- Personalization quality
- Reply intent
- Daily experiment tweaks proposals

## Policy in this repo

Cloud Agent is the human replacement for the daily loop.  
SQL is a tool.  
Deterministic enrich helpers are optional accelerators, not a rewrite.
