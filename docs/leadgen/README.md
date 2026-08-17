# Leadgen (AI SME)

End-to-end outbound lab for Slovak SMEs. Operator = Cursor Cloud Agent. You evaluate daily.

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, agent vs SQL cost, daily loop |
| [OFFERS.md](./OFFERS.md) | Offers A–E |
| [AGENT_PLAYBOOK.md](./AGENT_PLAYBOOK.md) | Instructions for the daily cloud agent |
| [THIRD_PARTIES.md](./THIRD_PARTIES.md) | Resend, Gmail, RPO DB, MCP checklist |
| [COST.md](./COST.md) | Agent vs deterministic cost |
| [RPO.md](./RPO.md) | `rpo2.sql.gz` notes |

## Quick start (dev)

```bash
npm run db:generate
npm run db:push
npm run seed:leadgen
npm run dev
```

- Agency home: `/`
- CV: `/about`
- Offer landings: `/offers/ai-audit` … `/offers/custom-ai-app`

## Related

- Cloud agents + MCP: [`../cloud-agents/README.md`](../cloud-agents/README.md)
- Email/Postgres MCP: [`../cloud-agents/mcp.md`](../cloud-agents/mcp.md)
