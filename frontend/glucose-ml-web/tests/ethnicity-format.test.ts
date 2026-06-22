import assert from "node:assert/strict";
import test from "node:test";

import { formatEthnicityLines } from "../src/features/dataset-detail/ethnicity-format.ts";

test("ethnicity percentages render as rounded whole numbers on separate lines", () => {
  assert.deepEqual(
    formatEthnicityLines(
      "75.5% Hispanic/Latino, 15.5% White, 8.8% Black/African Am."
    ),
    ["76% Hispanic/Latino", "16% White", "9% Black/African Am."]
  );
});

test("missing ethnicity data keeps the approved fallback", () => {
  assert.deepEqual(formatEthnicityLines("NR"), ["Not reported"]);
});
