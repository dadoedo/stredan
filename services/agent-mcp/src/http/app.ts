import cookieParser from "cookie-parser";
import express from "express";
import { dashboardRouter } from "../dashboard/routes.js";
import { handleMcpRequest } from "./mcp.js";

export type McpKind = "dashboard" | "postgres" | "email";

function serviceFromRequest(req: express.Request): McpKind {
  const header = (req.get("x-agent-mcp") ?? "").toLowerCase();
  if (header === "postgres" || header === "email") return header;
  const host = (req.hostname || "").toLowerCase();
  if (host.startsWith("postgres.mcp.")) return "postgres";
  if (host.startsWith("email.mcp.")) return "email";
  return "dashboard";
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(express.json({ limit: "10mb" }));

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "agent-mcp" });
  });

  app.use(async (req, res, next) => {
    const service = serviceFromRequest(req);
    if (service === "dashboard") return next();
    if (req.path === "/health") return next();
    await handleMcpRequest(service, req, res);
  });

  app.use(dashboardRouter());

  app.use((req, res) => {
    res.status(404).type("text").send("Not found");
  });

  return app;
}
