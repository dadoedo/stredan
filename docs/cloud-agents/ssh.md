# SSH access for Cloud Agents

Dedicated server identity: **`stredan-cursor-agent`** (not root login).

- Groups: `sudo`, `docker`
- Sudo: `NOPASSWD:ALL` — agents can escalate, but auth/sudo logs show this username
- One ed25519 keypair shared across allowed hosts (ClientUp excluded)

Private key on David’s laptop (never commit):

```text
~/.ssh/stredan-cursor-agent/id_ed25519
~/.ssh/stredan-cursor-agent/id_ed25519.pub
```

Cursor Runtime secret name: **`AGENT_SSH_PRIVATE_KEY`**  
(full file contents including `BEGIN` / `END` lines)

Materialize the key in environment **Start** (see [environments.md](./environments.md)), not Install.

---

## Host inventory

| SSH Host alias | IP | Role / notes |
|----------------|-----|--------------|
| `stredan-hetzner` | `178.105.3.145` | Agent MCP, GeoMap prod, AskData/FP edge, etc. |
| `alldevs-hetzner` | `49.13.94.193` | Marketing Stredan, OffStudio/AllBook-style prod stacks |
| `anderro-prod` | `159.69.126.75` | Anderro production |
| `hetzner-prod` | `46.224.84.45` | Amber / BMA / Foodient / Viralsky / SkySnail DBs |
| `pozicto-prod` | `91.98.157.152` | Pozicto production |
| `alldevs-staging` | `178.104.78.239` | OffStudio + GeoMap staging |

**Out of scope:** ClientUp hosts — do not add agent SSH there unless explicitly requested.

Local laptop aliases (David’s `~/.ssh/config`) also exist as `stredan-cursor-*` pointing at the same user/key.

---

## Which hosts each repo’s Start should expose

Least privilege: only configure Host entries the repo actually needs.

| Repo / env | Hosts in Start / setup script |
|------------|-------------------------------|
| Stredan (dashboard) | Typically `stredan-hetzner` + `alldevs-hetzner` (ops); expand if needed |
| Anderro (code) | **`anderro-prod` only** → `scripts/cloud-agent-ssh.sh` |
| Geomap (code) | **`alldevs-staging` + `stredan-hetzner`** → `.cursor/setup-ssh.sh` |
| Shared “ops” env | Full inventory (snippet below) |

---

## Full Start snippet (all agent hosts)

Use for a broad ops environment. Prefer scoped scripts for product repos.

```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p ~/.ssh
chmod 700 ~/.ssh
if [[ -z "${AGENT_SSH_PRIVATE_KEY:-}" ]]; then
  echo "AGENT_SSH_PRIVATE_KEY not set; skipping SSH setup" >&2
  exit 0
fi
printf '%s\n' "$AGENT_SSH_PRIVATE_KEY" > ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
cat > ~/.ssh/config <<'EOF'
Host stredan-hetzner
  HostName 178.105.3.145
  User stredan-cursor-agent
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new

Host alldevs-hetzner
  HostName 49.13.94.193
  User stredan-cursor-agent
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new

Host anderro-prod
  HostName 159.69.126.75
  User stredan-cursor-agent
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new

Host hetzner-prod
  HostName 46.224.84.45
  User stredan-cursor-agent
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new

Host pozicto-prod
  HostName 91.98.157.152
  User stredan-cursor-agent
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new

Host alldevs-staging
  HostName 178.104.78.239
  User stredan-cursor-agent
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
chmod 600 ~/.ssh/config
```

Example usage after Start:

```bash
ssh stredan-hetzner 'docker ps'
ssh alldevs-staging 'hostname'
ssh anderro-prod 'sudo docker ps'
```

---

## Add a new host

On the new box (as root), reuse the **same** public key (`~/.ssh/stredan-cursor-agent/id_ed25519.pub`):

```bash
PUB='ssh-ed25519 AAAA… stredan-cursor-agent@…'   # paste current pubkey
adduser --disabled-password --gecos "Stredan Cursor Cloud Agent" stredan-cursor-agent
usermod -aG sudo stredan-cursor-agent
getent group docker >/dev/null && usermod -aG docker stredan-cursor-agent
echo 'stredan-cursor-agent ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/stredan-cursor-agent
chmod 440 /etc/sudoers.d/stredan-cursor-agent
visudo -cf /etc/sudoers.d/stredan-cursor-agent
install -d -m 700 -o stredan-cursor-agent -g stredan-cursor-agent /home/stredan-cursor-agent/.ssh
echo "$PUB" > /home/stredan-cursor-agent/.ssh/authorized_keys
chown stredan-cursor-agent:stredan-cursor-agent /home/stredan-cursor-agent/.ssh/authorized_keys
chmod 600 /home/stredan-cursor-agent/.ssh/authorized_keys
```

Then:

1. Add a `Host …` block to the relevant Start script / dashboard Start / `cloud-agent-ssh.sh` / `setup-ssh.sh`.
2. Update this inventory table.
3. If Cloud Agent network allowlist is restricted, allow TCP/22 to the new IP.
4. No new keypair unless you want isolation per brand.

Verify:

```bash
ssh -i ~/.ssh/stredan-cursor-agent/id_ed25519 -o IdentitiesOnly=yes \
  stredan-cursor-agent@NEW_IP 'whoami; sudo -n whoami'
```

---

## Rotate the keypair

1. Generate new key:  
   `ssh-keygen -t ed25519 -f ~/.ssh/stredan-cursor-agent/id_ed25519_new -C "stredan-cursor-agent@$(date +%Y%m%d)"`
2. Append **new** pubkey to `authorized_keys` on every host; confirm login.
3. Update Cursor secret `AGENT_SSH_PRIVATE_KEY` to the new private key.
4. Remove old pubkey lines from all `authorized_keys`.
5. Replace laptop files and any local `IdentityFile` paths.

---

## Security notes

- Prefer this identity over copying `id_ed25519_personal` into Cloud Agents.
- Prefer MCP for DB/email; SSH for process/host ops.
- Long-term: Tailscale/WireGuard so SSH is not public.
- When tightening egress allowlists, include all inventory IPs on port 22.
