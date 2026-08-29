# Stredan production deploy

| | |
|--|--|
| Site | https://www.stredan.sk |
| Host | `alldevs-hetzner` (`49.13.94.193`) |
| Dir | `/root/stredan` |
| Image | `ghcr.io/dadoedo/stredan` |
| GH Environment | `stredan-production` |

MCP platform (`mcp.stredan.sk`) deploys separately via `.github/workflows/deploy-agent-mcp.yml` to **stredan-hetzner** — different host, different environment.

## CI/CD

Push to `main` (app paths) → build/push GHCR → SSH deploy compose in `deploy/docker-compose.prod.yml`.

Path filters keep app and `services/agent-mcp` deploys independent. Manual: Actions → **Deploy stredan** → Run workflow.

### Environment secrets

| Secret | Purpose |
|--------|---------|
| `PRODUCTION_HOST` | `49.13.94.193` |
| `PRODUCTION_USER` | `root` |
| `PRODUCTION_SSH_KEY` | Deploy private key (`stredan_production_deploy`) |
| `POSTGRES_PASSWORD` | Must match live DB role (first-boot `.env` only) |
| `ADMIN_PASSWORD` | Admin panel password (first-boot `.env` only) |

### Environment variables

| Variable | Default |
|----------|---------|
| `REMOTE_DIR` | `/root/stredan` |
| `COMPOSE_FILE` | `deploy/docker-compose.prod.yml` |
| `APP_URL` | `https://www.stredan.sk` |
| `IMAGE_TAG` | `prod` |

`.env` on the server is created once from secrets and **not** overwritten. Edit `/root/stredan/.env` to rotate (and GitHub secrets if you re-bootstrap).

## Local emergency deploy

```bash
./deploy.sh
```

Builds locally, loads on the server, uses the same prod compose file.

## Expanding later

- **cursor-profile.stredan.sk** — public API + demo for [`react-cursor-calendar`](https://www.npmjs.com/package/react-cursor-calendar). Merge `deploy/cursor-profile.caddy` into `/root/caddy/Caddyfile`. Same `stredan-app` container; Next.js rewrites the host.
- **DB / Prisma migrations** — add `prisma/migrations`, then teach the deploy SSH step to run `prisma migrate deploy` (image currently ships the app only; prefer a one-shot migrate container or CI job over baking migrate into boot).
- **Extra services** — add compose services under `deploy/` and keep path filters on the workflow honest.
