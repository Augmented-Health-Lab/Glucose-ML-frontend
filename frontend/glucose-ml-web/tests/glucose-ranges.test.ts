import assert from "node:assert/strict";
import test from "node:test";

import {
  GLUCOSE_RANGE_DEFINITIONS,
  GLUCOSE_RANGE_ORDER,
} from "../src/data/glucose-ranges.ts";

test("shared glucose ranges use the approved mg/dL labels", () => {
  assert.deepEqual(
    GLUCOSE_RANGE_ORDER.map((key) => GLUCOSE_RANGE_DEFINITIONS[key].label),
    [
      "Very low glucose (<55 mg/dL)",
      "Low glucose (55-69 mg/dL)",
      "Target glucose (70-180 mg/dL)",
      "High glucose (181-250 mg/dL)",
      "Very high glucose (>250 mg/dL)",
    ]
  );
});
