import { z } from "zod";
import type { SearchObject } from "imapflow";
import type { EmailConfig } from "../types.js";
import { assertWritable, getAccount } from "../targets.js";
import {
  listFolders,
  listMessages,
  moveMessage,
  readMessage,
  searchMessages,
  setFlags,
} from "./imap.js";
import { sendViaSmtp } from "./smtp.js";

function fail(error: unknown) {
  return { success: false as const, error: error instanceof Error ? error.message : String(error) };
}

export const listAccountsSchema = z.object({});

export function listAccounts(config: EmailConfig) {
  return Array.from(config.accounts.values()).map((account) => ({
    key: account.key,
    name: account.name,
    address: account.address,
    permissions: account.permissions,
    imapHost: account.imap.host,
    smtpHost: account.smtp.host,
    sendVia: account.sendVia,
  }));
}

export const listFoldersSchema = z.object({
  account: z.string().describe("Account key from configuration"),
});

export async function listFoldersTool(config: EmailConfig, input: z.infer<typeof listFoldersSchema>) {
  try {
    const account = getAccount(config, input.account);
    const folders = await listFolders(account);
    return { success: true as const, account: input.account, folders };
  } catch (error) {
    return { ...fail(error), account: input.account };
  }
}

export const listMessagesSchema = z.object({
  account: z.string().describe("Account key from configuration"),
  folder: z.string().default("INBOX").describe("IMAP folder/mailbox path (default: INBOX)"),
  limit: z.number().int().positive().max(200).default(30).describe("Max messages to return"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset"),
  unreadOnly: z.boolean().default(false).describe("Only return unread messages"),
  since: z.string().datetime().optional().describe("ISO date string; only messages on or after this date"),
  before: z.string().datetime().optional().describe("ISO date string; only messages before this date"),
  from: z.string().optional().describe("Filter by sender address (partial match)"),
  to: z.string().optional().describe("Filter by recipient address (partial match)"),
  subjectContains: z.string().optional().describe("Filter by substring in Subject header"),
  bodyContains: z.string().optional().describe("Filter by substring in body"),
});

export async function listMessagesTool(config: EmailConfig, input: z.infer<typeof listMessagesSchema>) {
  try {
    const account = getAccount(config, input.account);
    const result = await listMessages(account, {
      folder: input.folder,
      limit: input.limit,
      offset: input.offset,
      unreadOnly: input.unreadOnly,
      since: input.since ? new Date(input.since) : undefined,
      before: input.before ? new Date(input.before) : undefined,
      from: input.from,
      to: input.to,
      subjectContains: input.subjectContains,
      bodyContains: input.bodyContains,
    });
    return {
      success: true as const,
      account: input.account,
      folder: input.folder,
      total: result.total,
      returned: result.messages.length,
      offset: input.offset,
      limit: input.limit,
      messages: result.messages,
    };
  } catch (error) {
    return { ...fail(error), account: input.account, folder: input.folder };
  }
}

export const readMessageSchema = z.object({
  account: z.string().describe("Account key from configuration"),
  folder: z.string().default("INBOX").describe("IMAP folder/mailbox path"),
  uid: z.number().int().positive().describe("IMAP UID of the message"),
  includeHtml: z.boolean().default(false).describe("Include HTML body in response (large)"),
  markSeen: z.boolean().default(false).describe("Mark the message as read after fetching"),
});

export async function readMessageTool(config: EmailConfig, input: z.infer<typeof readMessageSchema>) {
  try {
    const account = getAccount(config, input.account);
    if (input.markSeen) assertWritable(account);
    const message = await readMessage(account, input.folder, input.uid, {
      includeHtml: input.includeHtml,
      markSeen: input.markSeen,
    });
    return { success: true as const, account: input.account, folder: input.folder, uid: input.uid, message };
  } catch (error) {
    return { ...fail(error), account: input.account, folder: input.folder, uid: input.uid };
  }
}

export const searchMessagesSchema = z.object({
  account: z.string().describe("Account key from configuration"),
  folder: z.string().default("INBOX").describe("IMAP folder to search in"),
  limit: z.number().int().positive().max(200).default(30).describe("Max results"),
  from: z.string().optional().describe("Filter by FROM (substring)"),
  to: z.string().optional().describe("Filter by TO (substring)"),
  subject: z.string().optional().describe("Filter by SUBJECT (substring)"),
  body: z.string().optional().describe("Filter by message body (substring)"),
  since: z.string().datetime().optional().describe("ISO date — messages on/after"),
  before: z.string().datetime().optional().describe("ISO date — messages before"),
  unreadOnly: z.boolean().default(false),
  flaggedOnly: z.boolean().default(false),
});

export async function searchMessagesTool(config: EmailConfig, input: z.infer<typeof searchMessagesSchema>) {
  try {
    const account = getAccount(config, input.account);
    const search: SearchObject = {};
    if (input.from) search.from = input.from;
    if (input.to) search.to = input.to;
    if (input.subject) search.subject = input.subject;
    if (input.body) search.body = input.body;
    if (input.since) search.since = new Date(input.since);
    if (input.before) search.before = new Date(input.before);
    if (input.unreadOnly) search.seen = false;
    if (input.flaggedOnly) search.flagged = true;
    const messages = await searchMessages(account, input.folder, search, input.limit);
    return { success: true as const, account: input.account, folder: input.folder, count: messages.length, messages };
  } catch (error) {
    return { ...fail(error), account: input.account, folder: input.folder };
  }
}

const AddressSchema = z.object({
  name: z.string().optional(),
  address: z.string().email(),
});

const AttachmentSchema = z.object({
  filename: z.string(),
  content: z.string().describe("Attachment content (default base64-encoded)"),
  contentType: z.string().optional(),
  encoding: z.enum(["base64", "utf8"]).default("base64"),
});

export const sendMessageSchema = z.object({
  account: z.string().describe("Account key — message will be sent FROM this address"),
  to: z.array(AddressSchema).min(1).describe("Recipients"),
  cc: z.array(AddressSchema).optional(),
  bcc: z.array(AddressSchema).optional(),
  subject: z.string(),
  text: z.string().optional().describe("Plain text body"),
  html: z.string().optional().describe("HTML body (optional)"),
  replyTo: AddressSchema.optional(),
  attachments: z.array(AttachmentSchema).optional(),
});

export async function sendMessageTool(config: EmailConfig, input: z.infer<typeof sendMessageSchema>) {
  try {
    const account = getAccount(config, input.account);
    assertWritable(account);
    if (!input.text && !input.html) throw new Error("Either 'text' or 'html' body is required.");
    const result = await sendViaSmtp(account, {
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
      attachments: input.attachments,
    });
    return { success: true as const, account: input.account, result };
  } catch (error) {
    return { ...fail(error), account: input.account };
  }
}

export const replyMessageSchema = z.object({
  account: z.string().describe("Account key — reply will be sent FROM this address"),
  folder: z.string().default("INBOX").describe("Folder containing the original message"),
  uid: z.number().int().positive().describe("UID of the message being replied to"),
  text: z.string().optional().describe("Plain text body of reply"),
  html: z.string().optional().describe("HTML body of reply"),
  replyAll: z.boolean().default(false).describe("If true, also include CC recipients of the original message"),
  extraTo: z.array(AddressSchema).optional().describe("Additional recipients"),
  extraCc: z.array(AddressSchema).optional(),
  attachments: z.array(AttachmentSchema).optional(),
  quoteOriginal: z.boolean().default(true).describe("Append a quoted copy of the original message body"),
});

function dedupeAddresses(addrs: { name?: string; address: string }[]) {
  const seen = new Set<string>();
  const result: { name?: string; address: string }[] = [];
  for (const a of addrs) {
    const key = a.address.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(a);
    }
  }
  return result;
}

function quoteBody(text: string | undefined, fromAddress: string | undefined, date: string | undefined): string {
  const lines = (text ?? "").split(/\r?\n/);
  const quoted = lines.map((l) => `> ${l}`).join("\n");
  return `\n\nOn ${date ?? "(unknown date)"}, ${fromAddress ?? "sender"} wrote:\n${quoted}`;
}

export async function replyMessageTool(config: EmailConfig, input: z.infer<typeof replyMessageSchema>) {
  try {
    const account = getAccount(config, input.account);
    assertWritable(account);
    if (!input.text && !input.html) throw new Error("Either 'text' or 'html' body is required.");

    const original = await readMessage(account, input.folder, input.uid, { includeHtml: false });
    const replyToAddrs = original.replyTo && original.replyTo.length > 0 ? original.replyTo : original.from;
    const baseTo = (replyToAddrs ?? []).map((a) => ({ name: a.name, address: a.address }));
    let to = dedupeAddresses([...baseTo, ...(input.extraTo ?? [])]).filter(
      (a) => a.address.toLowerCase() !== account.address.toLowerCase()
    );
    if (to.length === 0 && baseTo.length > 0) to = baseTo;

    let cc: { name?: string; address: string }[] = [];
    if (input.replyAll) {
      const originalCcs = (original.cc ?? []).map((a) => ({ name: a.name, address: a.address }));
      const originalTos = (original.to ?? [])
        .map((a) => ({ name: a.name, address: a.address }))
        .filter((a) => a.address.toLowerCase() !== account.address.toLowerCase());
      cc = dedupeAddresses([...originalCcs, ...originalTos, ...(input.extraCc ?? [])]).filter(
        (a) => !to.some((t) => t.address.toLowerCase() === a.address.toLowerCase())
      );
    } else if (input.extraCc) {
      cc = dedupeAddresses(input.extraCc);
    }

    const subject = (original.subject ?? "").match(/^re:\s/i) ? original.subject! : `Re: ${original.subject ?? ""}`.trim();
    const fromAddress = original.from?.[0]
      ? original.from[0].name
        ? `${original.from[0].name} <${original.from[0].address}>`
        : original.from[0].address
      : undefined;
    const text = input.quoteOriginal ? `${input.text ?? ""}${quoteBody(original.text, fromAddress, original.date)}` : input.text;

    const result = await sendViaSmtp(account, {
      to,
      cc: cc.length > 0 ? cc : undefined,
      subject,
      text,
      html: input.html,
      inReplyTo: original.messageId,
      references: [...(original.references ?? []), ...(original.messageId ? [original.messageId] : [])],
      attachments: input.attachments,
    });
    return { success: true as const, account: input.account, folder: input.folder, uid: input.uid, result };
  } catch (error) {
    return { ...fail(error), account: input.account, folder: input.folder, uid: input.uid };
  }
}

export const markMessageSchema = z.object({
  account: z.string().describe("Account key from configuration"),
  folder: z.string().default("INBOX").describe("IMAP folder/mailbox path"),
  uid: z.number().int().positive().describe("IMAP UID of the message"),
  action: z.enum(["read", "unread", "flag", "unflag"]).describe("Flag operation"),
});

export async function markMessageTool(config: EmailConfig, input: z.infer<typeof markMessageSchema>) {
  try {
    const account = getAccount(config, input.account);
    assertWritable(account);
    const map = {
      read: { flags: ["\\Seen"], mode: "add" as const },
      unread: { flags: ["\\Seen"], mode: "remove" as const },
      flag: { flags: ["\\Flagged"], mode: "add" as const },
      unflag: { flags: ["\\Flagged"], mode: "remove" as const },
    }[input.action];
    const result = await setFlags(account, input.folder, input.uid, map.flags, map.mode);
    return { success: true as const, account: input.account, folder: input.folder, uid: input.uid, flags: result.flags };
  } catch (error) {
    return { ...fail(error), account: input.account, folder: input.folder, uid: input.uid };
  }
}

export const moveMessageSchema = z.object({
  account: z.string().describe("Account key from configuration"),
  fromFolder: z.string().describe("Source IMAP folder"),
  uid: z.number().int().positive().describe("IMAP UID of the message in source folder"),
  toFolder: z.string().describe("Destination IMAP folder (e.g. 'Trash', 'Archive')"),
});

export async function moveMessageTool(config: EmailConfig, input: z.infer<typeof moveMessageSchema>) {
  try {
    const account = getAccount(config, input.account);
    assertWritable(account);
    const result = await moveMessage(account, input.fromFolder, input.uid, input.toFolder);
    return {
      success: true as const,
      account: input.account,
      fromFolder: input.fromFolder,
      uid: input.uid,
      toFolder: input.toFolder,
      destinationUid: result.destinationUid,
    };
  } catch (error) {
    return {
      ...fail(error),
      account: input.account,
      fromFolder: input.fromFolder,
      uid: input.uid,
      toFolder: input.toFolder,
    };
  }
}
