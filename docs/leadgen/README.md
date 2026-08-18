# Leadgen (AI SME)

Kanonický popis (idea, matrix, kto čo robí, budúcnosť): **[SYSTEM.md](./SYSTEM.md)**.

Outbound lab pre slovenské SME. Predaj AI implementácie (Stredan), nie kúpený sequencer.

| Vrstva | Kde |
|--------|-----|
| Operator | Cursor Cloud Agent / Automations |
| Prístup k DB a mailom | https://mcp.stredan.sk (nie control board) |
| Ľudský ops UI | https://stredan.sk/admin |

| Doc | Purpose |
|-----|---------|
| [SYSTEM.md](./SYSTEM.md) | Celý návrh: idea, matrix A–E × 1–5, loop, budúcnosť |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, denný loop, logging (EN, kratšie) |
| [OFFERS.md](./OFFERS.md) | Ponuky A–E |
| [AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md) | Inštrukcie pre denného cloud agenta |
| [THIRD_PARTIES.md](./THIRD_PARTIES.md) | Resend, Gmail, RPO, MCP checklist |
| [COST.md](./COST.md) | Agent vs deterministic cost |
| [RPO.md](./RPO.md) | Register právnických osôb |

## Quick start (dev)

```bash
npm run db:generate
npm run db:push
npm run seed:leadgen
npm run dev
```

Admin: `/admin/matrix`

- Agency home: `/`
- CV: `/about`
- Offer landings: `/offers/ai-audit` … `/offers/custom-ai-app`
