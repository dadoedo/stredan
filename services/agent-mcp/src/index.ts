import { createApp } from "./http/app.js";
import { bootstrapAdmin } from "./bootstrap.js";
import { closePlatformDb } from "./db/client.js";
import { migrate } from "./db/migrate.js";
import { env } from "./env.js";
import { closeAllConnections as closePostgres } from "./postgres/client.js";
import { closeAllConnections as closeImap } from "./email/imap.js";
import { closeAllTransporters } from "./email/smtp.js";

async function main() {
  await migrate();
  await bootstrapAdmin();

  const app = createApp();
  const server = app.listen(env.port, "0.0.0.0", () => {
    console.log(`agent-mcp listening on :${env.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down`);
    server.close();
    await Promise.allSettled([closePostgres(), closeImap(), closeAllTransporters(), closePlatformDb()]);
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
