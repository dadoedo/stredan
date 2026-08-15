import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response } from "express";
import { extractBearer, lookupApiKey } from "../auth/api-keys.js";
import { createEmailMcp } from "../email/mcp.js";
import { createPostgresMcp } from "../postgres/mcp.js";
import { loadEmailConfig, loadPostgresConfig } from "../targets.js";

function unauthorized(res: Response): void {
  res.setHeader("WWW-Authenticate", 'Bearer realm="stredan-mcp"');
  res.status(401).json({
    jsonrpc: "2.0",
    error: { code: -32001, message: "Unauthorized" },
    id: null,
  });
}

export async function handleMcpRequest(kind: "postgres" | "email", req: Request, res: Response): Promise<void> {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, mcp-session-id");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.status(204).end();
    return;
  }

  const token = extractBearer(req.header("authorization"));
  if (!token) {
    unauthorized(res);
    return;
  }
  const apiKey = await lookupApiKey(token);
  if (!apiKey) {
    unauthorized(res);
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const server =
    kind === "postgres"
      ? createPostgresMcp(await loadPostgresConfig(apiKey))
      : createEmailMcp(await loadEmailConfig(apiKey));

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed:", error instanceof Error ? error.message : error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
}
