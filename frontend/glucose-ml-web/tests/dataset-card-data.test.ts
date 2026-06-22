import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getDatasetSourceLabels } from "../src/utils/source-labels.ts";

test("dataset card source labels match Figma card chips", () => {
  assert.deepEqual(getDatasetSourceLabels(["G", "I", "W", "M", "Q", "C"]), [
    "CGM",
    "Insulin",
    "Wearable Tracker",
    "Manual Logs",
    "Questionnaire",
    "Clinical",
  ]);
});

test("every homepage card has exact whole-number glucose range counts", () => {
  const homepageData = JSON.parse(
    readFileSync(
      new URL("../public/static_data/homepage_data.json", import.meta.url),
      "utf8"
    )
  ) as Array<{ title: string }>;
  const distributions = JSON.parse(
    readFileSync(
      new URL(
        "../public/static_data/dataset_card_glucose_distribution.json",
        import.meta.url
      ),
      "utf8"
    )
  ) as Record<string, Record<string, number>>;

  assert.equal(Object.keys(distributions).length, homepageData.length);
  assert.deepEqual(
    Object.keys(distributions).toSorted(),
    homepageData.map(({ title }) => title).toSorted()
  );

  for (const counts of Object.values(distributions)) {
    assert.deepEqual(Object.keys(counts), [
      "very_low",
      "low",
      "target",
      "high",
      "very_high",
      "total",
    ]);
    assert.ok(
      Object.values(counts).every(
        (value) => Number.isInteger(value) && value >= 0
      )
    );
    assert.equal(
      counts.total,
      counts.very_low +
        counts.low +
        counts.target +
        counts.high +
        counts.very_high
    );
  }
});
