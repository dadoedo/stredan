import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildCursorHandlesWhere,
  buildCursorQueryString,
  classifyCursorLastError,
  hasActiveCursorFilters,
  parseCursorStatus,
} from "./cursor-admin";

describe("parseCursorStatus", () => {
  test("accepts known statuses", () => {
    assert.equal(parseCursorStatus("found"), "found");
    assert.equal(parseCursorStatus("not_found"), "not_found");
    assert.equal(parseCursorStatus("invalid"), "invalid");
  });

  test("rejects unknown or empty values", () => {
    assert.equal(parseCursorStatus(undefined), undefined);
    assert.equal(parseCursorStatus(""), undefined);
    assert.equal(parseCursorStatus("502"), undefined);
    assert.equal(parseCursorStatus("all"), undefined);
  });
});

describe("classifyCursorLastError", () => {
  test("null or empty lastError is a 200 hit", () => {
    assert.equal(classifyCursorLastError(null), "found");
    assert.equal(classifyCursorLastError(undefined), "found");
    assert.equal(classifyCursorLastError(""), "found");
  });

  test("page-payload 502 and HTTP 404 map to not_found", () => {
    assert.equal(
      classifyCursorLastError(
        'Cursor profile "@kevinnguyen" was not found in the page payload',
      ),
      "not_found",
    );
    assert.equal(
      classifyCursorLastError("Cursor profile @kevinnguyen was not found"),
      "not_found",
    );
  });

  test("invalid handle 400 maps to invalid", () => {
    assert.equal(
      classifyCursorLastError(
        'Invalid Cursor handle "x". Use 3+ lowercase letters, numbers, or hyphens.',
      ),
      "invalid",
    );
  });

  test("other probe errors stay other", () => {
    assert.equal(
      classifyCursorLastError("Cursor profile @x is not public"),
      "other",
    );
    assert.equal(classifyCursorLastError("Failed to load Cursor profile"), "other");
  });
});

describe("buildCursorHandlesWhere", () => {
  test("default (no filters) matches the unfiltered list", () => {
    assert.deepEqual(buildCursorHandlesWhere({}), {});
  });

  test("found filters lastError IS NULL (200 hits)", () => {
    assert.deepEqual(buildCursorHandlesWhere({ status: "found" }), {
      lastError: null,
    });
  });

  test("not_found hides 200s and matches 502/not-found text", () => {
    assert.deepEqual(buildCursorHandlesWhere({ status: "not_found" }), {
      lastError: { contains: "not found", mode: "insensitive" },
    });
  });

  test("invalid matches 400 handle errors", () => {
    assert.deepEqual(buildCursorHandlesWhere({ status: "invalid" }), {
      lastError: { contains: "Invalid Cursor handle", mode: "insensitive" },
    });
  });

  test("search is lexical over handle and displayName, stripping @", () => {
    assert.deepEqual(buildCursorHandlesWhere({ q: "  @Dado  " }), {
      OR: [
        { handle: { contains: "Dado", mode: "insensitive" } },
        { displayName: { contains: "Dado", mode: "insensitive" } },
      ],
    });
  });

  test("search + status combine with AND", () => {
    const where = buildCursorHandlesWhere({ q: "dado", status: "found" });
    assert.deepEqual(where, {
      AND: [
        {
          OR: [
            { handle: { contains: "dado", mode: "insensitive" } },
            { displayName: { contains: "dado", mode: "insensitive" } },
          ],
        },
        { lastError: null },
      ],
    });
  });
});

describe("query state", () => {
  test("buildCursorQueryString omits empty keys", () => {
    assert.equal(buildCursorQueryString({}), "");
    assert.equal(buildCursorQueryString({ q: "dado" }), "?q=dado");
    assert.equal(
      buildCursorQueryString({ q: "dado", status: "found" }),
      "?q=dado&status=found",
    );
    assert.equal(buildCursorQueryString({ q: undefined, status: "found" }), "?status=found");
  });

  test("hasActiveCursorFilters is false for the default view", () => {
    assert.equal(hasActiveCursorFilters({}), false);
    assert.equal(hasActiveCursorFilters({ q: "dado" }), true);
    assert.equal(hasActiveCursorFilters({ status: "found" }), true);
  });
});
