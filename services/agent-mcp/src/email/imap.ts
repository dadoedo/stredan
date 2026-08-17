import { ImapFlow, type ListResponse, type MailboxLockObject, type SearchObject } from "imapflow";
import { simpleParser } from "mailparser";
import type { ResolvedAccount } from "../types.js";

interface PooledClient {
  client: ImapFlow;
  lastUsed: number;
  connecting?: Promise<void>;
}

const clientPool = new Map<string, PooledClient>();
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

function poolKey(account: ResolvedAccount): string {
  return `${account.key}:${account.imap.host}:${account.imap.port}:${account.address}`;
}

async function getClient(account: ResolvedAccount): Promise<ImapFlow> {
  const key = poolKey(account);
  const existing = clientPool.get(key);

  if (existing) {
    if (existing.connecting) {
      await existing.connecting;
    }
    if (existing.client.usable) {
      existing.lastUsed = Date.now();
      return existing.client;
    }
    try {
      await existing.client.logout();
    } catch {
      // ignore
    }
    clientPool.delete(key);
  }

  const client = new ImapFlow({
    host: account.imap.host,
    port: account.imap.port,
    secure: account.imap.secure,
    auth: {
      user: account.address,
      pass: account.password,
    },
    logger: false,
  });

  // ImapFlow emits 'error' on idle socket timeouts; without a listener Node
  // treats that as an uncaught exception and kills the process.
  client.on("error", () => {
    const current = clientPool.get(key);
    if (current?.client === client) {
      clientPool.delete(key);
    }
  });

  const pooled: PooledClient = { client, lastUsed: Date.now() };
  pooled.connecting = client.connect();
  clientPool.set(key, pooled);

  try {
    await pooled.connecting;
  } catch (error) {
    clientPool.delete(key);
    throw error;
  } finally {
    pooled.connecting = undefined;
  }

  return client;
}

async function withMailbox<T>(
  account: ResolvedAccount,
  mailbox: string,
  fn: (client: ImapFlow, lock: MailboxLockObject) => Promise<T>,
  opts?: { readonly?: boolean }
): Promise<T> {
  const client = await getClient(account);
  const lock = await client.getMailboxLock(mailbox, {
    readOnly: opts?.readonly ?? false,
  });
  try {
    return await fn(client, lock);
  } finally {
    lock.release();
  }
}

function toIsoDate(d: unknown): string | undefined {
  if (!d) return undefined;
  if (d instanceof Date) return d.toISOString();
  if (typeof d === "string") {
    const parsed = new Date(d);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }
  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (value instanceof Set) return Array.from(value).map((v) => String(v));
  return [];
}

export interface FolderInfo {
  path: string;
  name: string;
  delimiter: string;
  flags: string[];
  specialUse?: string;
  subscribed: boolean;
  exists?: number;
  unseen?: number;
}

export async function listFolders(account: ResolvedAccount): Promise<FolderInfo[]> {
  const client = await getClient(account);
  const list = (await client.list({ statusQuery: { messages: true, unseen: true } })) as Array<
    ListResponse & { status?: { messages?: number; unseen?: number } }
  >;

  return list.map((m) => ({
    path: m.path,
    name: m.name,
    delimiter: m.delimiter ?? "/",
    flags: Array.from(m.flags ?? []),
    specialUse: m.specialUse,
    subscribed: m.subscribed ?? false,
    exists: m.status?.messages,
    unseen: m.status?.unseen,
  }));
}

export interface MessageSummary {
  uid: number;
  seq: number;
  messageId?: string;
  subject?: string;
  from?: { name?: string; address: string }[];
  to?: { name?: string; address: string }[];
  cc?: { name?: string; address: string }[];
  date?: string;
  flags: string[];
  size?: number;
  hasAttachments: boolean;
  threadId?: string;
  inReplyTo?: string;
  preview?: string;
}

export interface ListMessagesOptions {
  folder: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  since?: Date;
  before?: Date;
  from?: string;
  to?: string;
  subjectContains?: string;
  bodyContains?: string;
}

export interface ListMessagesResult {
  total: number;
  messages: MessageSummary[];
}

function normalizeAddresses(addrs: unknown): { name?: string; address: string }[] | undefined {
  if (!addrs || !Array.isArray(addrs)) return undefined;
  const result: { name?: string; address: string }[] = [];
  for (const a of addrs as { name?: string; address?: string }[]) {
    if (a.address) result.push({ name: a.name || undefined, address: a.address });
  }
  return result.length > 0 ? result : undefined;
}

function buildSearchQuery(options: ListMessagesOptions): SearchObject {
  const search: SearchObject = {};
  if (options.unreadOnly) search.seen = false;
  if (options.since) search.since = options.since;
  if (options.before) search.before = options.before;
  if (options.from) search.from = options.from;
  if (options.to) search.to = options.to;
  if (options.subjectContains) search.subject = options.subjectContains;
  if (options.bodyContains) search.body = options.bodyContains;
  return search;
}

export async function listMessages(
  account: ResolvedAccount,
  options: ListMessagesOptions
): Promise<ListMessagesResult> {
  return withMailbox(
    account,
    options.folder,
    async (client) => {
      const limit = options.limit ?? 30;
      const offset = options.offset ?? 0;

      const hasFilter =
        options.unreadOnly ||
        options.since ||
        options.before ||
        options.from ||
        options.to ||
        options.subjectContains ||
        options.bodyContains;

      let uids: number[];
      if (hasFilter) {
        const search = buildSearchQuery(options);
        const found = await client.search(search, { uid: true });
        const arr: number[] = Array.isArray(found) ? found : [];
        uids = arr.slice().sort((a, b) => b - a);
      } else {
        const status = await client.status(options.folder, { messages: true });
        const total = status.messages ?? 0;
        if (total === 0) return { total: 0, messages: [] };
        const range = `1:${total}`;
        const found: number[] = [];
        for await (const msg of client.fetch(range, { uid: true })) {
          if (msg.uid != null) found.push(msg.uid);
        }
        uids = found.sort((a, b) => b - a);
      }

      const total = uids.length;
      const pageUids = uids.slice(offset, offset + limit);

      if (pageUids.length === 0) {
        return { total, messages: [] };
      }

      const messages: MessageSummary[] = [];
      for await (const msg of client.fetch(
        pageUids,
        {
          uid: true,
          envelope: true,
          flags: true,
          size: true,
          internalDate: true,
          bodyStructure: true,
          threadId: true,
          headers: ["in-reply-to", "references"],
        },
        { uid: true }
      )) {
        const env = msg.envelope;
        const struct = msg.bodyStructure as { childNodes?: unknown[]; disposition?: string } | undefined;
        const hasAttachments = detectAttachments(struct);

        const inReplyToHeader = msg.headers?.toString("utf8").match(/in-reply-to:\s*(.*)/i)?.[1]?.trim();

        messages.push({
          uid: msg.uid!,
          seq: msg.seq,
          messageId: env?.messageId,
          subject: env?.subject,
          from: normalizeAddresses(env?.from),
          to: normalizeAddresses(env?.to),
          cc: normalizeAddresses(env?.cc),
          date: toIsoDate(env?.date) ?? toIsoDate(msg.internalDate),
          flags: asStringArray(msg.flags),
          size: msg.size,
          hasAttachments,
          threadId: msg.threadId ? String(msg.threadId) : undefined,
          inReplyTo: inReplyToHeader,
        });
      }

      messages.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

      return { total, messages };
    },
    { readonly: true }
  );
}

function detectAttachments(struct: unknown): boolean {
  if (!struct || typeof struct !== "object") return false;
  const node = struct as { disposition?: string; childNodes?: unknown[] };
  if (node.disposition && node.disposition.toLowerCase() === "attachment") return true;
  if (Array.isArray(node.childNodes)) {
    for (const child of node.childNodes) {
      if (detectAttachments(child)) return true;
    }
  }
  return false;
}

export interface FullMessage {
  uid: number;
  messageId?: string;
  subject?: string;
  from?: { name?: string; address: string }[];
  to?: { name?: string; address: string }[];
  cc?: { name?: string; address: string }[];
  bcc?: { name?: string; address: string }[];
  replyTo?: { name?: string; address: string }[];
  date?: string;
  flags: string[];
  text?: string;
  html?: string;
  attachments: { filename: string; contentType: string; size: number; cid?: string }[];
  inReplyTo?: string;
  references?: string[];
  headers: Record<string, string | string[]>;
}

export async function readMessage(
  account: ResolvedAccount,
  folder: string,
  uid: number,
  opts?: { includeHtml?: boolean; markSeen?: boolean }
): Promise<FullMessage> {
  return withMailbox(
    account,
    folder,
    async (client) => {
      const download = await client.download(`${uid}`, undefined, { uid: true });
      if (!download || !download.content) {
        throw new Error(`Message uid ${uid} not found in folder "${folder}"`);
      }

      const parsed = await simpleParser(download.content);

      const fetched = await client.fetchOne(`${uid}`, { uid: true, flags: true }, { uid: true });
      const flags = asStringArray(fetched && typeof fetched === "object" ? fetched.flags : undefined);

      if (opts?.markSeen && !flags.includes("\\Seen")) {
        await client.messageFlagsAdd(`${uid}`, ["\\Seen"], { uid: true });
        flags.push("\\Seen");
      }

      const headers: Record<string, string | string[]> = {};
      for (const [k, v] of parsed.headers.entries()) {
        headers[k] = typeof v === "string" ? v : Array.isArray(v) ? (v as unknown[]).map((x) => String(x)) : String(v);
      }

      const collectAddrs = (
        input: unknown
      ): { name?: string; address: string }[] | undefined => {
        if (!input) return undefined;
        const arr = Array.isArray(input) ? input : [input];
        const out: { name?: string; address: string }[] = [];
        for (const obj of arr as { value?: { name?: string; address?: string }[] }[]) {
          for (const v of obj.value ?? []) {
            if (v.address) out.push({ name: v.name || undefined, address: v.address });
          }
        }
        return out.length > 0 ? out : undefined;
      };

      const refsRaw = parsed.references;
      const references = !refsRaw
        ? undefined
        : Array.isArray(refsRaw)
        ? refsRaw
        : String(refsRaw).split(/\s+/).filter(Boolean);

      return {
        uid,
        messageId: parsed.messageId,
        subject: parsed.subject,
        from: collectAddrs(parsed.from),
        to: collectAddrs(parsed.to),
        cc: collectAddrs(parsed.cc),
        bcc: collectAddrs(parsed.bcc),
        replyTo: collectAddrs(parsed.replyTo),
        date: parsed.date?.toISOString(),
        flags,
        text: parsed.text || undefined,
        html: opts?.includeHtml ? (typeof parsed.html === "string" ? parsed.html : undefined) : undefined,
        attachments: (parsed.attachments ?? []).map((a) => ({
          filename: a.filename || "(unnamed)",
          contentType: a.contentType,
          size: a.size,
          cid: a.cid,
        })),
        inReplyTo: typeof parsed.inReplyTo === "string" ? parsed.inReplyTo : undefined,
        references,
        headers,
      };
    },
    { readonly: !opts?.markSeen }
  );
}

export async function setFlags(
  account: ResolvedAccount,
  folder: string,
  uid: number,
  flags: string[],
  action: "add" | "remove"
): Promise<{ flags: string[] }> {
  return withMailbox(account, folder, async (client) => {
    if (action === "add") {
      await client.messageFlagsAdd(`${uid}`, flags, { uid: true });
    } else {
      await client.messageFlagsRemove(`${uid}`, flags, { uid: true });
    }
    const fetched = await client.fetchOne(`${uid}`, { uid: true, flags: true }, { uid: true });
    return { flags: asStringArray(fetched && typeof fetched === "object" ? fetched.flags : undefined) };
  });
}

export async function moveMessage(
  account: ResolvedAccount,
  fromFolder: string,
  uid: number,
  toFolder: string
): Promise<{ destinationUid?: number }> {
  return withMailbox(account, fromFolder, async (client) => {
    const result = await client.messageMove(`${uid}`, toFolder, { uid: true });
    const destinationUidsRaw = (result as unknown as { uidMap?: Map<number, number> }).uidMap;
    const destinationUid = destinationUidsRaw?.get(uid);
    return { destinationUid };
  });
}

export async function appendMessage(
  account: ResolvedAccount,
  folder: string,
  rawRfc822: Buffer | string,
  flags: string[] = ["\\Seen"]
): Promise<void> {
  const client = await getClient(account);
  await client.append(folder, rawRfc822, flags);
}

export async function searchMessages(
  account: ResolvedAccount,
  folder: string,
  search: SearchObject,
  limit = 30
): Promise<MessageSummary[]> {
  return withMailbox(
    account,
    folder,
    async (client) => {
      const found = await client.search(search, { uid: true });
      const arr: number[] = Array.isArray(found) ? found : [];
      const sorted = arr.slice().sort((a, b) => b - a).slice(0, limit);
      if (sorted.length === 0) return [];

      const messages: MessageSummary[] = [];
      for await (const msg of client.fetch(
        sorted,
        { uid: true, envelope: true, flags: true, size: true, internalDate: true, bodyStructure: true },
        { uid: true }
      )) {
        const env = msg.envelope;
        messages.push({
          uid: msg.uid!,
          seq: msg.seq,
          messageId: env?.messageId,
          subject: env?.subject,
          from: normalizeAddresses(env?.from),
          to: normalizeAddresses(env?.to),
          cc: normalizeAddresses(env?.cc),
          date: toIsoDate(env?.date) ?? toIsoDate(msg.internalDate),
          flags: asStringArray(msg.flags),
          size: msg.size,
          hasAttachments: detectAttachments(msg.bodyStructure),
        });
      }
      messages.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
      return messages;
    },
    { readonly: true }
  );
}

export async function closeAllConnections(): Promise<void> {
  for (const [, pooled] of clientPool) {
    try {
      await pooled.client.logout();
    } catch {
      // ignore
    }
  }
  clientPool.clear();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, pooled] of clientPool) {
    if (now - pooled.lastUsed > IDLE_TIMEOUT_MS && !pooled.connecting) {
      pooled.client.logout().catch(() => {});
      clientPool.delete(key);
    }
  }
}, 60_000).unref();
