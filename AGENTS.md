# AGENTS.md

## Cursor Cloud specific instructions

This repo contains **two** independently deployed services:

- `stredan` (repo root) — Next.js 16 portfolio site, backed by PostgreSQL via Prisma. This is the primary app.
- `services/agent-mcp` — a standalone Express/TypeScript MCP server (separate package, own `package.json`).

The update script already runs `npm ci` (root + `services/agent-mcp`) and `npx prisma generate` on boot. The notes below cover the non-obvious parts the update script intentionally does **not** do.

### PostgreSQL (local dev DB for `stredan`)

- A local PostgreSQL 16 cluster is installed. It does **not** auto-start on boot — start it each session with:
  `sudo pg_ctlcluster 16 main start`
- Dev database is `stredan` / user `stredan` / password `stredan_secret` on `127.0.0.1:5432` (matches `docker-compose.yml` / `.env.example`, minus Docker — we run Postgres natively instead of via Compose because Docker isn't installed).
- Root `.env` (git-ignored) holds the connection string and admin password:
  ```
  DATABASE_URL="postgresql://stredan:stredan_secret@127.0.0.1:5432/stredan"
  ADMIN_PASSWORD="stredan_admin_dev"
  ```
  Recreate it if it is missing.

### Running / testing `stredan` (root)

- There are **no Prisma migrations** in this repo. Sync the schema with `npx prisma db push` (not `prisma migrate`). Run it once after the DB is up / after schema changes. This is left out of the update script because it needs a live DB.
- The Prisma client is generated to `src/generated/prisma` (git-ignored), so `npx prisma generate` must run before build/dev — the update script handles this.
- Dev server: `npm run dev` → http://localhost:3000. Lint: `npm run lint`. Build: `npm run build` (see `package.json`). Health check: `GET /api/health`.
- The homepage reads projects/jobs from the DB and renders fine against an empty DB. To add content, log in at `/admin/login` using the `ADMIN_PASSWORD` value, then create projects under `/admin/projects`. Created projects with `featured` + `visible` show up on the homepage "Selected Work" section.

### Running / testing `services/agent-mcp`

- Separate package — run commands from `services/agent-mcp`. Build/typecheck: `npm run build` (this is all CI does for it). Dev: `npm run dev`.
- To actually run it you must provide `DATABASE_URL` (its own Postgres, separate from the `stredan` DB), plus required `MASTER_ENCRYPTION_KEY` and `SESSION_SECRET` (see `services/agent-mcp/env.ts` and `services/agent-mcp/deploy/.env.example`). It refuses to boot if those are unset.
