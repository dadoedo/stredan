# Stredan.sk — Infraštruktúra

## Server

- **Host**: alldevs-hetzner (`49.13.94.193`)
- **Doména**: stredan.sk, www.stredan.sk
- **Produkčný adresár**: `/root/stredan/`
- **Reverse proxy**: Caddy (spoločný pre všetky projekty na serveri)

## Docker kontajnery (produkcia)

| Kontajner | Image | Interný port | Externý port |
|-----------|-------|-------------|-------------|
| `stredan-app` | `stredan-app:latest` | 3000 | — (cez Caddy) |
| `stredan-db` | `postgres:16-alpine` | 5432 | `127.0.0.1:5434` |

### Docker siete

- `stredan_internal` — komunikácia app ↔ db
- `web` (externá) — komunikácia app ↔ Caddy

## DatabázaRead, Build, Write

- **Engine**: PostgreSQL 16
- **DB name**: `stredan`
- **User**: `stredan`
- **Password**: `stredan_secret`
- **Produkčný connection string** (v docker-compose): `postgresql://stredan:stredan_secret@stredan-db:5432/stredan`

## SSH tunely (lokálny vývoj)

Definované v `~/.ssh/config` pod `Host alldevs-hetzner`:

| Lokálny port | Server port | Kontajner | Projekt |
|-------------|------------|-----------|---------|
| 5455 | 5433 | `offstudio-db` | OFF.Studio |
| 5456 | 5432 | `allbook-db` | AllBook |
| 5457 | 5434 | `stredan-db` | Stredan |

Lokálny `.env` pre stredan:
```
DATABASE_URL="postgresql://stredan:stredan_secret@localhost:5457/stredan"
ADMIN_PASSWORD="tvoje-tajne-heslo"
```

Produkcia: `ADMIN_PASSWORD` sa predáva cez env v `docker compose up` (napr. v `.env` na serveri).

Pre aktiváciu tunelov stačí mať otvorené SSH spojenie:
```bash
ssh alldevs-hetzner
```

## DBeaver pripojenia

| Projekt | Host | Port | User | DB |
|---------|------|------|------|----|
| OFF.Studio | localhost | 5455 | (podľa offstudio compose) | (podľa offstudio compose) |
| AllBook | localhost | 5456 | (podľa allbook compose) | (podľa allbook compose) |
| Stredan | localhost | 5457 | stredan | stredan |

## Deploy

Spustenie z koreňa projektu:
```bash
./deploy.sh
```

Čo robí:
1. Buildne Docker image `stredan-app:latest` lokálne
2. Uloží a kompresne ho do `stredan-app.tar.gz`
3. Nahrá cez SCP na server do `/root/stredan/`
4. Na serveri loadne image a zmaže archív
5. Nahrá `docker-compose.yml` a spustí `docker compose up -d`

## Caddy konfigurácia

Pridané do `/root/caddy/Caddyfile` na serveri:
```
stredan.sk, www.stredan.sk {
    reverse_proxy stredan-app:3000
    encode gzip zstd
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
}
```

SSL certifikát sa vystaví automaticky cez Let's Encrypt po nasmerovaní DNS.

## DNS záznamy (nastaviť u registrátora)

| Typ | Názov | Hodnota |
|-----|-------|---------|
| A | `@` | `49.13.94.193` |
| A | `www` | `49.13.94.193` |
| AAAA | `@` | `2a01:4f8:c014:ba27::1` |
| AAAA | `www` | `2a01:4f8:c014:ba27::1` |

## Tech stack

- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS 4)
- **ORM**: Prisma 7 (s `@prisma/adapter-pg`)
- **DB**: PostgreSQL 16
- **Runtime**: Node.js 22 Alpine (Docker)
- **Reverse proxy**: Caddy 2
- **Hosting**: Hetzner VPS
