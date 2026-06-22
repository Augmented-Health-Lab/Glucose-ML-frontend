import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { formatCgmMetric } from "../src/features/dataset-detail/cgm-metric-format.ts";

test("formatCgmMetric adds thousands separators", () => {
  assert.equal(formatCgmMetric(105_426), "105,426");
});

test("formatCgmMetric rounds to a whole number when requested", () => {
  assert.equal(formatCgmMetric(1_234.6, { round: true }), "1,235");
});

test("formatCgmMetric preserves blank display behavior for non-positive values", () => {
  assert.equal(formatCgmMetric(0), "");
  assert.equal(formatCgmMetric(-1), "");
});

test("CGMDataSection formats numeric tiles and rounds average days", () => {
  const source = readFileSync(
    new URL("../src/features/dataset-detail/CGMDataSection.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /formatCgmMetric\(dataset\.cgmSummary\.totalDays\)/);
  assert.match(source, /formatCgmMetric\(dataset\.cgmSummary\.glucoseSamples\)/);
  assert.match(
    source,
    /formatCgmMetric\(dataset\.cgmSummary\.avgDaysPerParticipant,\s*\{\s*round:\s*true,?\s*\}\)/
  );
});
