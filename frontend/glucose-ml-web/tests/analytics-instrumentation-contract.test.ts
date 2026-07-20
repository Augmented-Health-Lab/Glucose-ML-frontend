import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (path: string) =>
  readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

test("home discovery flow emits approved analytics events", () => {
  const home = readSource("features/home/HomePage.tsx");
  const card = readSource("features/home/DatasetCard.tsx");
  const compareBar = readSource("features/home/CompareBar.tsx");
  const filterBar = readSource("features/home/FilterBar.tsx");

  assert.match(home, /trackFilterChange\(/);
  assert.match(home, /trackFilterClear\(/);
  assert.match(home, /trackCompareSelectionChange\(/);
  assert.match(home, /trackGuide\("open", "home"\)/);
  assert.match(home, /trackGuide\("close", "home"\)/);
  assert.match(home, /trackContentLoadError\("home", "static_data"\)/);
  assert.match(card, /trackDatasetOpen\(title, "home"\)/);
  assert.match(compareBar, /trackCompareStart\(selectedCards\)/);
  assert.match(filterBar, /onClearFilters/);
  assert.doesNotMatch(filterBar, /Object\.keys\(filterSelections\)\.forEach/);
});
