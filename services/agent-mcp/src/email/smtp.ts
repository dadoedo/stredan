import nodemailer, { type Transporter } from "nodemailer";
import type { ResolvedAccount } from "../types.js";
import { appendMessage } from "./imap.js";

const transporterPool = new Map<string, Transporter>();

function getTransporter(account: ResolvedAccount): Transporter {
  const key = `${account.key}:${account.smtp.host}:${account.smtp.port}`;
  const existing = transporterPool.get(key);
  if (existing) return existing;

  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.address,
      pass: account.password,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });

  transporterPool.set(key, transporter);
  return transporter;
}

export interface Address {
  name?: string;
  address: string;
}

export interface SendOptions {
  to: Address[];
  cc?: Address[];
  bcc?: Address[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: Address;
  inReplyTo?: string;
  references?: string[];
  headers?: Record<string, string>;
  attachments?: { filename: string; content: string; contentType?: string; encoding?: "base64" | "utf8" }[];
}

export interface SendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  appendedToSent: boolean;
  appendError?: string;
}

function formatAddress(a: Address): string {
  return a.name ? `"${a.name.replace(/"/g, '\\"')}" <${a.address}>` : a.address;
}

export async function sendViaSmtp(
  account: ResolvedAccount,
  options: SendOptions
): Promise<SendResult> {
  const transporter = getTransporter(account);

  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.inReplyTo) headers["In-Reply-To"] = options.inReplyTo;
  if (options.references && options.references.length > 0) {
    headers["References"] = options.references.join(" ");
  }

  const info = await transporter.sendMail({
    from: formatAddress({ name: account.name, address: account.address }),
    to: options.to.map(formatAddress),
    cc: options.cc?.map(formatAddress),
    bcc: options.bcc?.map(formatAddress),
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo ? formatAddress(options.replyTo) : undefined,
    inReplyTo: options.inReplyTo,
    references: options.references,
    headers,
    attachments: options.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
      encoding: a.encoding ?? "base64",
    })),
  });

  let appendedToSent = false;
  let appendError: string | undefined;

  if (account.appendToSent) {
    try {
      const raw = await buildRfc822(account, options, info.messageId);
      await appendMessage(account, account.sentFolder, raw, ["\\Seen"]);
      appendedToSent = true;
    } catch (err) {
      appendError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    messageId: info.messageId,
    accepted: (info.accepted ?? []).map(String),
    rejected: (info.rejected ?? []).map(String),
    appendedToSent,
    appendError,
  };
}

async function buildRfc822(
  account: ResolvedAccount,
  options: SendOptions,
  messageId: string
): Promise<Buffer> {
  const builder = nodemailer.createTransport({ streamTransport: true, buffer: true });
  return new Promise<Buffer>((resolve, reject) => {
    builder.sendMail(
      {
        from: formatAddress({ name: account.name, address: account.address }),
        to: options.to.map(formatAddress),
        cc: options.cc?.map(formatAddress),
        bcc: options.bcc?.map(formatAddress),
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo ? formatAddress(options.replyTo) : undefined,
        inReplyTo: options.inReplyTo,
        references: options.references,
        messageId,
        headers: options.headers,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
          encoding: a.encoding ?? "base64",
        })),
      },
      (err, info) => {
        if (err) return reject(err);
        const message = (info as unknown as { message: Buffer | string }).message;
        resolve(Buffer.isBuffer(message) ? message : Buffer.from(String(message)));
      }
    );
  });
}

export async function closeAllTransporters(): Promise<void> {
  for (const [, t] of transporterPool) {
    try {
      t.close();
    } catch {
      // ignore
    }
  }
  transporterPool.clear();
}
