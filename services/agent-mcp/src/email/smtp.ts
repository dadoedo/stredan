import nodemailer, { type Transporter } from "nodemailer";
import type { ResolvedAccount } from "../types.js";
import { appendMessage } from "./imap.js";

const transporterPool = new Map<string, Transporter>();

export const SMTP_CONNECTION_TIMEOUT_MS = 15_000;
export const SMTP_GREETING_TIMEOUT_MS = 15_000;
export const SMTP_SOCKET_TIMEOUT_MS = 30_000;

export function smtpTransportOptions(account: ResolvedAccount): nodemailer.TransportOptions & Record<string, unknown> {
  return {
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    requireTLS: !account.smtp.secure,
    auth: {
      user: account.smtp.user,
      pass: account.password,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
  };
}

function isSmtpTimeout(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message = error instanceof Error ? error.message : "";
  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT") return true;
  return /timeout|timed out|greeting never received/i.test(message);
}

/** Maps nodemailer connection timeouts to a message that names the likely blocked port. */
export function explainSmtpError(error: unknown, target: { host: string; port: number }): Error {
  const original = error instanceof Error ? error : new Error(String(error));
  if (!isSmtpTimeout(original)) return original;
  const friendly = new Error(
    `Could not connect to SMTP ${target.host}:${target.port} within 15s — port may be blocked; try 587 with STARTTLS`
  );
  friendly.cause = original;
  return friendly;
}

function getTransporter(account: ResolvedAccount): Transporter {
  const key = `${account.key}:${account.smtp.host}:${account.smtp.port}:${account.smtp.user}:${account.smtp.secure}`;
  const existing = transporterPool.get(key);
  if (existing) return existing;

  const transporter = nodemailer.createTransport(smtpTransportOptions(account));

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

  let info;
  try {
    info = await transporter.sendMail({
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
  } catch (error) {
    throw explainSmtpError(error, account.smtp);
  }

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
