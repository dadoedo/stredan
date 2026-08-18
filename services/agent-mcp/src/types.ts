export type Permissions = "readonly" | "readwrite";

export interface ResolvedEnvironment {
  id: string;
  name: string;
  connectionUrl: string;
  permissions: Permissions;
}

export interface ResolvedDatabase {
  id: string;
  key: string;
  name: string;
  notes: string | null;
  enabled: boolean;
  environments: Map<string, ResolvedEnvironment>;
}

export interface ResolvedAccount {
  id: string;
  key: string;
  name: string;
  address: string;
  imap: { host: string; port: number; secure: boolean; user: string };
  smtp: { host: string; port: number; secure: boolean; user: string };
  password: string;
  permissions: Permissions;
  sendVia: "smtp";
  appendToSent: boolean;
  sentFolder: string;
}

export interface PostgresConfig {
  databases: Map<string, ResolvedDatabase>;
}

export interface EmailConfig {
  accounts: Map<string, ResolvedAccount>;
}

export interface ApiKeyRecord {
  id: string;
  label: string;
  prefix: string;
  readonly: boolean;
  databaseIds: string[] | "*";
  emailIds: string[] | "*";
}

export interface AdminSession {
  id: string;
  adminId: string;
  email: string;
  pendingTotp: boolean;
  totpEnabled: boolean;
}

export interface ApiKeyScope {
  databases: string[] | "*";
  emails: string[] | "*";
  readonly: boolean;
}
