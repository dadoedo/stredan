# Third parties & human setup checklist

## Required soon

| Item | Why | Action |
|------|-----|--------|
| **RPO Postgres** | Source of SK companies | Import `~/Downloads/rpo2.sql.gz` into dedicated DB; register in https://mcp.stredan.sk |
| **Email MCP: Gmail** | Personal / warmed sending | Add mailbox + IMAP folders `Leadgen/A`…`Leadgen/E`, `Leadgen/Replies` |
| **Email MCP: Resend** | Volume / transactional domain | Resend account + domain DNS (SPF/DKIM/DMARC) + SMTP or API via MCP SMTP fields |
| **Sending domain(s)** | Deliverability | Separate domain(s) from `stredan.sk` marketing recommended for cold |
| **Cursor Cloud Automation** | Daily operator | Schedule playbook `docs/leadgen/AGENT_PLAYBOOK.md` with Postgres+Email MCP tools |

## Optional later

| Item | Why |
|------|-----|
| Resend webhooks | Opens/bounces → `TouchEvent` |
| Hunter / Apollo / Dropcontact | Only if agent email find rate too low |
| Browserbase / scraping proxy | If sites block agent datacenter IP |
| Cal.com / Calendly | Meeting CTA on landings |
| PostHog | Landing conversion (you already have MCP) |

## Not needed day 1

- Clay / Instantly / Lemlist (you are building the lab in-house)
- Separate enrich SaaS if agent+public web is enough at low volume

## Legal / ops notes

- Confirm cold email basis under SK/EU practice with your counsel if scaling hard
- Keep suppression + unsubscribe path working before raising caps
- Prefer company contact emails from public sites

## Credentials (never commit)

- MCP API keys in Cursor dashboard
- Resend API / SMTP in MCP vault
- Gmail app password / OAuth via MCP vault
- RPO DB URL in MCP vault
