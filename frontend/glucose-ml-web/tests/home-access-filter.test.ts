import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import homepageData from "../public/static_data/homepage_data.json" with { type: "json" };
import { FILTERS } from "../src/data/filters.ts";

const multiSelectTsx = readFileSync(
  new URL("../src/features/home/MultiSelect.tsx", import.meta.url),
  "utf8"
);

test("access filter options match homepage access values", () => {
  const accessFilter = FILTERS.find((filter) => filter.label === "Access");
  assert.ok(accessFilter);

  const accessValues = Array.from(
    new Set(homepageData.map((dataset) => dataset.access))
  ).sort();

  assert.deepEqual([...accessFilter.options].sort(), accessValues);
});

test("access filter displays the requested access labels", () => {
  assert.match(multiSelectTsx, /Open:\s*"Public access"/);
  assert.match(multiSelectTsx, /Controlled:\s*"Controlled access"/);
  assert.match(
    multiSelectTsx,
    /if\s*\(filterLabel === "Access"\)\s*\{\s*return accessOptionLabels\[option\] \?\? option;/
  );
});
