import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sanitizeAnalyticsParameters } from "../src/analytics/google-analytics.ts";
import {
  getDestinationHostname,
  serializeDatasetNames,
} from "../src/analytics/events.ts";

const analyticsSource = readFileSync(
  new URL("../src/analytics/google-analytics.ts", import.meta.url),
  "utf8"
);

test("analytics parameters retain only bounded GA-safe primitives", () => {
  const raw = {
    valid_string: "  home  ",
    long_string: "x".repeat(140),
    count: 3,
    enabled: true,
    missing: undefined,
    invalid_number: Number.NaN,
    nested: { private: "value" },
  };

  assert.deepEqual(sanitizeAnalyticsParameters(raw), {
    valid_string: "home",
    long_string: "x".repeat(100),
    count: 3,
    enabled: true,
  });
});

test("dataset combinations aggregate independent of selection order", () => {
  assert.equal(
    serializeDatasetNames(["CGMacros", "AI-READI", "AZT1D"]),
    "AI-READI|AZT1D|CGMacros"
  );
});

test("destination tracking keeps only an http or https hostname", () => {
  assert.equal(
    getDestinationHostname("https://github.com/org/repo?token=private"),
    "github.com"
  );
  assert.equal(getDestinationHostname("javascript:alert(1)"), "unknown");
  assert.equal(getDestinationHostname("not a url"), "unknown");
});

test("GA initialization is idempotent, manual, and failure-safe", () => {
  assert.match(analyticsSource, /initializedMeasurementId === measurementId/);
  assert.match(analyticsSource, /script\[data-ga-measurement-id=/);
  assert.match(analyticsSource, /send_page_view:\s*false/);
  assert.match(analyticsSource, /catch\s*\{\s*return false;\s*\}/s);
  assert.doesNotMatch(analyticsSource, /user_id|participant_id|cohort_id/);
});
