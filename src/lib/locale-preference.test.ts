import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  localeFromAcceptLanguage,
  resolveRequestLocale,
} from "./locale-preference";

describe("localeFromAcceptLanguage", () => {
  test("missing header stays Slovak", () => {
    assert.equal(localeFromAcceptLanguage(null), "sk");
    assert.equal(localeFromAcceptLanguage(""), "sk");
    assert.equal(localeFromAcceptLanguage("   "), "sk");
  });

  test("Slovak and Czech first visits stay Slovak", () => {
    assert.equal(localeFromAcceptLanguage("sk-SK,sk;q=0.9,en;q=0.8"), "sk");
    assert.equal(localeFromAcceptLanguage("cs-CZ,cs;q=0.9,en-US;q=0.8"), "sk");
    assert.equal(localeFromAcceptLanguage("cz"), "sk");
  });

  test("a higher English preference is English", () => {
    assert.equal(localeFromAcceptLanguage("en-US,en;q=0.9"), "en");
    assert.equal(localeFromAcceptLanguage("en-GB,en;q=0.8,sk;q=0.3"), "en");
  });

  test("Slovak wins a tie and unknown languages fall back to Slovak", () => {
    assert.equal(localeFromAcceptLanguage("en;q=0.8,sk;q=0.8"), "sk");
    assert.equal(localeFromAcceptLanguage("de-DE,de;q=0.9"), "sk");
    assert.equal(localeFromAcceptLanguage("fr;q=0"), "sk");
  });
});

describe("resolveRequestLocale", () => {
  test("a saved choice beats the browser language", () => {
    assert.equal(resolveRequestLocale("en", "sk-SK,sk;q=0.9"), "en");
    assert.equal(resolveRequestLocale("sk", "en-US,en;q=0.9"), "sk");
  });

  test("an unknown cookie is ignored", () => {
    assert.equal(resolveRequestLocale("de", "en-US"), "en");
    assert.equal(resolveRequestLocale(undefined, null), "sk");
  });
});
