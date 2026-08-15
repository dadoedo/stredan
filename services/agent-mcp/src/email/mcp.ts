import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EmailConfig } from "../types.js";
import {
  listAccounts,
  listAccountsSchema,
  listFoldersSchema,
  listFoldersTool,
  listMessagesSchema,
  listMessagesTool,
  markMessageSchema,
  markMessageTool,
  moveMessageSchema,
  moveMessageTool,
  readMessageSchema,
  readMessageTool,
  replyMessageSchema,
  replyMessageTool,
  searchMessagesSchema,
  searchMessagesTool,
  sendMessageSchema,
  sendMessageTool,
} from "./tools.js";

function jsonText(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(error: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
    isError: true as const,
  };
}

export function createEmailMcp(config: EmailConfig): McpServer {
  const server = new McpServer({
    name: "stredan-email-mcp",
    version: "1.0.0",
  });

  server.tool(
    "list_accounts",
    "List configured email accounts visible to this API key (key, address, permissions, IMAP/SMTP host).",
    listAccountsSchema.shape,
    async () => jsonText(listAccounts(config))
  );

  server.tool(
    "list_folders",
    "List IMAP folders/mailboxes for a given account, including unread and total counts.",
    listFoldersSchema.shape,
    async (args) => {
      const result = await listFoldersTool(config, listFoldersSchema.parse(args));
      return result.success ? jsonText(result) : errorResult(result.error);
    }
  );

  server.tool(
    "list_messages",
    "List messages in a folder with optional filters. Returns paginated summaries (UID, subject, from, date, flags).",
    listMessagesSchema.shape,
    async (args) => {
      const result = await listMessagesTool(config, listMessagesSchema.parse(args));
      return result.success ? jsonText(result) : errorResult(result.error);
    }
  );

  server.tool(
    "read_message",
    "Read the full content of a specific message by UID. HTML body and markSeen are opt-in.",
    readMessageSchema.shape,
    async (args) => {
      const result = await readMessageTool(config, readMessageSchema.parse(args));
      return result.success ? jsonText(result) : errorResult(result.error);
    }
  );

  server.tool(
    "search_messages",
    "Search messages within a folder using IMAP SEARCH (server-side).",
    searchMessagesSchema.shape,
    async (args) => {
      const result = await searchMessagesTool(config, searchMessagesSchema.parse(args));
      return result.success ? jsonText(result) : errorResult(result.error);
    }
  );

  server.tool(
    "send_message",
    "Send a new email FROM the configured account address via SMTP. Blocked for readonly accounts.",
    sendMessageSchema.shape,
    async (args) => {
      const result = await sendMessageTool(config, sendMessageSchema.parse(args));
      return result.success ? jsonText(result) : errorResult(result.error);
    }
  );

  server.tool(
    "reply_message",
    "Reply to an existing message by UID. Blocked for readonly accounts.",
    replyMessageSchema.shape,
    async (args) => {
      const result = await replyMessageTool(config, replyMessageSchema.parse(args));
      return result.success ? jsonText(result) : errorResult(result.error);
    }
  );

  server.tool(
    "mark_message",
    "Mark a message as read/unread or flag/unflag. Blocked for readonly accounts.",
    markMessageSchema.shape,
    async (args) => {
      const result = await markMessageTool(config, markMessageSchema.parse(args));
      return result.success ? jsonText(result) : errorResult(result.error);
    }
  );

  server.tool(
    "move_message",
    "Move a message between folders. Blocked for readonly accounts.",
    moveMessageSchema.shape,
    async (args) => {
      const result = await moveMessageTool(config, moveMessageSchema.parse(args));
      return result.success ? jsonText(result) : errorResult(result.error);
    }
  );

  return server;
}
