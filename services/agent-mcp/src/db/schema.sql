-- Platform metadata for Stredan Agent MCP.
-- Applied on every boot; every statement must stay idempotent.
-- Tenancy (users, owner_id) is appended after the original tables so existing
-- databases migrate in place. Data backfill runs in src/db/migrate.ts.

CREATE TABLE IF NOT EXISTS vault_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ciphertext BYTEA NOT NULL,
  nonce BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  totp_secret_id UUID REFERENCES vault_secrets (id),
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  pending_totp BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS database_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS database_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID NOT NULL REFERENCES database_targets (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  host TEXT,
  port INTEGER,
  database_name TEXT,
  username TEXT,
  ssl BOOLEAN NOT NULL DEFAULT true,
  connection_url_secret_id UUID REFERENCES vault_secrets (id),
  password_secret_id UUID REFERENCES vault_secrets (id),
  secret_hint TEXT,
  permissions TEXT NOT NULL DEFAULT 'readonly'
    CHECK (permissions IN ('readonly', 'readwrite')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (database_id, name)
);

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_secure BOOLEAN NOT NULL DEFAULT true,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 465,
  smtp_secure BOOLEAN NOT NULL DEFAULT true,
  imap_user TEXT,
  smtp_user TEXT,
  password_secret_id UUID REFERENCES vault_secrets (id),
  secret_hint TEXT,
  permissions TEXT NOT NULL DEFAULT 'readwrite'
    CHECK (permissions IN ('readonly', 'readwrite')),
  append_to_sent BOOLEAN NOT NULL DEFAULT true,
  sent_folder TEXT NOT NULL DEFAULT 'Sent',
  notes TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '{}'::jsonb,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys (key_hash);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);

-- Multi-user tenancy. users replaces admins as the login principal.
-- Existing admins rows are copied forward by migrate.ts; admins is left in place
-- so this script can still boot databases created before tenancy.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'user')),
  totp_secret_id UUID REFERENCES vault_secrets (id),
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'user')),
  invited_by UUID REFERENCES users (id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_invites_email_idx ON user_invites (email);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE sessions ALTER COLUMN admin_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

ALTER TABLE vault_secrets ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users (id);
ALTER TABLE database_targets ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users (id);
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users (id);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users (id);

CREATE INDEX IF NOT EXISTS vault_secrets_owner_idx ON vault_secrets (owner_id);
CREATE INDEX IF NOT EXISTS database_targets_owner_idx ON database_targets (owner_id);
CREATE INDEX IF NOT EXISTS email_accounts_owner_idx ON email_accounts (owner_id);
CREATE INDEX IF NOT EXISTS api_keys_owner_idx ON api_keys (owner_id);

-- Keys are unique per owner. Drop the pre-tenancy global UNIQUE (key) so two
-- tenants can reuse a key. MCP resolves the key inside the API key's owner.
DO $$
DECLARE
  constraint_name text;
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['database_targets', 'email_accounts']
  LOOP
    FOR constraint_name IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'public'
        AND rel.relname = table_name
        AND con.contype = 'u'
        AND pg_get_constraintdef(con.oid) = 'UNIQUE (key)'
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', table_name, constraint_name);
    END LOOP;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS database_targets_owner_key_idx ON database_targets (owner_id, key);
CREATE UNIQUE INDEX IF NOT EXISTS email_accounts_owner_key_idx ON email_accounts (owner_id, key);

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES api_keys (id) ON DELETE SET NULL;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS success BOOLEAN;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS tool TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS target TEXT;

CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_api_key_id_idx ON audit_log (api_key_id, created_at DESC);
