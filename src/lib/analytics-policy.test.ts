import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { analyticsAllowed, scrubAnalyticsValue } from "./analytics-policy";

describe("analyticsAllowed", () => {
  test("development and localhost never send", () => {
    assert.equal(
      analyticsAllowed({
        nodeEnv: "development",
        hostname: "stredan.sk",
        optedOut: false,
      }),
      false,
    );
    assert.equal(
      analyticsAllowed({
        nodeEnv: "production",
        hostname: "localhost",
        optedOut: false,
      }),
      false,
    );
    assert.equal(
      analyticsAllowed({
        nodeEnv: "production",
        hostname: "127.0.0.1",
        optedOut: false,
      }),
      false,
    );
  });

  test("only the public stredan hosts send, and opt-out wins", () => {
    assert.equal(
      analyticsAllowed({
        nodeEnv: "production",
        hostname: "stredan.sk",
        optedOut: false,
      }),
      true,
    );
    assert.equal(
      analyticsAllowed({
        nodeEnv: "production",
        hostname: "www.stredan.sk",
        optedOut: false,
      }),
      true,
    );
    assert.equal(
      analyticsAllowed({
        nodeEnv: "production",
        hostname: "cursor-profile.stredan.sk",
        optedOut: false,
      }),
      false,
    );
    assert.equal(
      analyticsAllowed({
        nodeEnv: "production",
        hostname: "booksonpods.com",
        optedOut: false,
      }),
      false,
    );
    assert.equal(
      analyticsAllowed({
        nodeEnv: "production",
        hostname: "stredan.sk",
        optedOut: true,
      }),
      false,
    );
  });
});

describe("scrubAnalyticsValue", () => {
  test("drops addresses and sensitive keys", () => {
    assert.deepEqual(
      scrubAnalyticsValue({
        location: "hero",
        email: "person@example.com",
        note: "write to person@example.com please",
        offer: "ai-audit",
      }),
      {
        location: "hero",
        note: "write to [redacted] please",
        offer: "ai-audit",
      },
    );
  });
});
