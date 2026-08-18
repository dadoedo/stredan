# Email MCP mailboxes (leadgen)

Accounts live in https://mcp.stredan.sk → Email. Secrets stay in the MCP vault, never in git.

Cursor API key `cursor-cloud` has `emails: *`, so new mailboxes show up for Cloud Agents without a new key.

MCP Email is **IMAP + SMTP** with one password per account. Resend has no IMAP; those accounts are **send-only** (replies read via `stredan-david` or Gmail). `smtp_user` exists so Resend can auth as `resend` while `From` is a domain address.

## Current keys (Stredan)

| MCP key | Address | Transport | Role |
|---------|---------|-----------|------|
| `stredan-david` | david@stredan.sk | Hostcreators IMAP+SMTP | Replies + send as David |
| `resend-email` | outreach@email.stredan.sk | Resend SMTP, send-only | Cold domain |
| `resend-stredan` | hello@stredan.sk | Resend SMTP, send-only | Brand domain |
| `gmail-stredan` | stredandavid@gmail.com | Gmail IMAP+SMTP | Warm personal Gmail — **needs App Password** |

Map these keys in `/admin/accounts` (matrix columns 1–5).

## Gmail (`stredandavid@gmail.com`)

Google will not accept the normal account password over IMAP/SMTP. Same setup as existing `gmail-anderro`:

1. On that Google account: [2-Step Verification](https://myaccount.google.com/signinoptions/two-step-verification) on.
2. [App passwords](https://myaccount.google.com/apppasswords) → app **Mail**, device **Other** (`mcp.stredan.sk`) → 16-character password.
3. Add mailbox on mcp.stredan.sk:

| Field | Value |
|-------|--------|
| Key | `gmail-stredan` |
| Address | `stredandavid@gmail.com` |
| IMAP | `imap.gmail.com` / 993 / TLS |
| SMTP | `smtp.gmail.com` / **587** / STARTTLS (`smtp_secure` off) |
| Users | blank (defaults to address) |
| Password | the App Password |
| Sent folder | `[Gmail]/Sent Mail` |
| Append sent | on |

Outbound **TCP 465 is blocked** on `stredan-hetzner` (MCP host). IMAP 993 and SMTP 587 work. All MCP mailboxes for Stredan use 587.

Existing Anderro/PožičTo mailboxes were on 465 too; they are switched to 587 on this host.

## Hostcreators (`david@stredan.sk`)

Already registered as `stredan-david`.

| Field | Value |
|-------|--------|
| IMAP | `imap.hostcreators.sk` / 993 / SSL |
| SMTP | `smtp.hostcreators.sk` / **587** / STARTTLS (`smtp_secure` off) |
| User | `david@stredan.sk` |

## Resend (`email.stredan.sk`, `stredan.sk`)

API key is the SMTP password. SMTP user **must** be `resend` (not the from-address).

| Field | `resend-email` | `resend-stredan` |
|-------|----------------|------------------|
| Address (From) | outreach@email.stredan.sk | hello@stredan.sk |
| SMTP | `smtp.resend.com` / **587** / STARTTLS | same |
| SMTP user | `resend` | `resend` |
| IMAP | unused placeholder | unused |
| Append sent | off | off |

Replies: set `Reply-To: david@stredan.sk` (or the Gmail) on cold sends so the agent can triage via IMAP.
