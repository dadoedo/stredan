import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { engagementModels } from "./engagement-models";
import { homeCopy } from "./home-copy";
import { PUBLIC_OFFERS } from "./public-offers";

const banned = [
  /ušetr/i,
  /týždeň/i,
  /990/,
  /12\s*000/,
  /4\s*[–-]\s*6/,
  /14 dní/i,
  /14 days/i,
  /zadarmo/i,
  /\bfree\b/i,
  /objednať/i,
  /desaťtisíc/i,
  /tens of thousands/i,
  /43k/i,
  /20\+/,
  /guaranteed/i,
  /zaruč/i,
  /save a week/i,
  /chatgpt/i,
  /\bRAG\b/,
  /\bMCP\b/,
  /kontinuáln/i,
  /monthly capacity/i,
];

describe("public marketing copy", () => {
  test("does not carry unapproved claims", () => {
    const blob = JSON.stringify({ homeCopy, PUBLIC_OFFERS, engagementModels });
    for (const pattern of banned) {
      assert.equal(pattern.test(blob), false, pattern.source);
    }
  });

  test("uses one intro-call label and a truthful audit label", () => {
    assert.equal(
      homeCopy.sk.cta,
      "Vybrať termín úvodného hovoru",
    );
    assert.deepEqual(homeCopy.sk.mobileTitle, ["Jeden proces.", "Jeden agent."]);
    assert.deepEqual(homeCopy.en.mobileTitle, ["One process.", "One agent."]);
    assert.equal(homeCopy.sk.founderName, "Dávid Stredánsky");
    assert.equal(homeCopy.sk.founderRole, "zakladateľ Stredan");
    assert.equal(homeCopy.en.founderRole, "Founder of Stredan");
    assert.equal(homeCopy.sk.auditCta, "Napísať ohľadom auditu");
    assert.equal(
      PUBLIC_OFFERS.find((offer) => offer.slug === "ai-audit")?.cta.sk,
      "Napísať ohľadom auditu",
    );
    assert.equal(
      PUBLIC_OFFERS.find((offer) => offer.slug === "ai-audit")?.ctaKind,
      "email",
    );
  });
});
