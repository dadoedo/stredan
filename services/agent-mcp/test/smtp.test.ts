import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import nodemailer from "nodemailer";
import {
  SMTP_CONNECTION_TIMEOUT_MS,
  SMTP_GREETING_TIMEOUT_MS,
  SMTP_SOCKET_TIMEOUT_MS,
  closeAllTransporters,
  explainSmtpError,
  sendViaSmtp,
} from "../src/email/smtp.js";
import type { ResolvedAccount } from "../src/types.js";

function account(overrides: Partial<ResolvedAccount["smtp"]> = {}): ResolvedAccount {
  return {
    id: "acc-1",
    key: overrides.host ? `box-${overrides.host}-${overrides.port}` : "box",
    name: "Box",
    address: "box@example.com",
    imap: { host: "imap.example.com", port: 993, secure: true, user: "box@example.com" },
    smtp: { host: "smtp.example.com", port: 587, secure: false, user: "box@example.com", ...overrides },
    password: "secret",
    permissions: "readwrite",
    sendVia: "smtp",
    appendToSent: false,
    sentFolder: "Sent",
  };
}

const originalCreateTransport = nodemailer.createTransport;

afterEach(async () => {
  nodemailer.createTransport = originalCreateTransport;
  await closeAllTransporters();
});

test("SMTP transport uses connection, greeting, and socket timeouts", async () => {
  let captured: Record<string, unknown> | undefined;
  nodemailer.createTransport = ((options: Record<string, unknown>) => {
    captured = options;
    return {
      sendMail: async () => ({ messageId: "<id@test>", accepted: ["a@b.c"], rejected: [] }),
      close() {},
    };
  }) as unknown as typeof nodemailer.createTransport;

  const result = await sendViaSmtp(account(), {
    to: [{ address: "a@b.c" }],
    subject: "Hi",
    text: "Body",
  });

  assert.equal(result.messageId, "<id@test>");
  assert.equal(captured?.connectionTimeout, SMTP_CONNECTION_TIMEOUT_MS);
  assert.equal(captured?.greetingTimeout, SMTP_GREETING_TIMEOUT_MS);
  assert.equal(captured?.socketTimeout, SMTP_SOCKET_TIMEOUT_MS);
  assert.equal(SMTP_CONNECTION_TIMEOUT_MS, 15_000);
  assert.equal(SMTP_GREETING_TIMEOUT_MS, 15_000);
  assert.equal(SMTP_SOCKET_TIMEOUT_MS, 30_000);
  assert.equal(captured?.port, 587);
  assert.equal(captured?.secure, false);
  assert.equal(captured?.requireTLS, true);
});

test("SMTP timeouts become a blocked-port error", async () => {
  nodemailer.createTransport = (() => ({
    sendMail: async () => {
      const error = new Error("Connection timeout") as Error & { code?: string; command?: string };
      error.code = "ETIMEDOUT";
      error.command = "CONN";
      throw error;
    },
    close() {},
  })) as unknown as typeof nodemailer.createTransport;

  await assert.rejects(
    () => sendViaSmtp(account({ host: "smtp.blocked.example", port: 465, secure: true }), { to: [{ address: "a@b.c" }], subject: "Hi", text: "Body" }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(
        error.message,
        "Could not connect to SMTP smtp.blocked.example:465 within 15s — port may be blocked; try 587 with STARTTLS"
      );
      assert.ok(error.cause instanceof Error);
      assert.equal(error.cause.message, "Connection timeout");
      return true;
    }
  );
});

test("explainSmtpError leaves authentication failures unchanged", () => {
  const auth = new Error("Invalid login: 535") as Error & { code?: string };
  auth.code = "EAUTH";
  const result = explainSmtpError(auth, { host: "smtp.example.com", port: 587 });
  assert.equal(result, auth);
  assert.equal(result.message, "Invalid login: 535");
});

test("explainSmtpError recognizes greeting and socket timeouts", () => {
  const greeting = new Error("Greeting never received") as Error & { code?: string };
  greeting.code = "ETIMEDOUT";
  const socket = new Error("Timeout") as Error & { code?: string };
  socket.code = "ETIMEDOUT";
  for (const error of [greeting, socket]) {
    const result = explainSmtpError(error, { host: "mail.example.com", port: 465 });
    assert.match(result.message, /Could not connect to SMTP mail\.example\.com:465 within 15s/);
    assert.match(result.message, /try 587 with STARTTLS/);
  }
});
