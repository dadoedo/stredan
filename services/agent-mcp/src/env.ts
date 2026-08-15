function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "production",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL"),
  masterEncryptionKey: required("MASTER_ENCRYPTION_KEY"),
  sessionSecret: required("SESSION_SECRET"),
  adminEmail: (process.env.ADMIN_EMAIL ?? "d.stredansky@gmail.com").toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  publicDashboardUrl: process.env.PUBLIC_DASHBOARD_URL ?? "https://mcp.stredan.sk",
  cookieSecure: (process.env.COOKIE_SECURE ?? "true") !== "false",
};

export function isProduction(): boolean {
  return env.nodeEnv !== "development";
}
