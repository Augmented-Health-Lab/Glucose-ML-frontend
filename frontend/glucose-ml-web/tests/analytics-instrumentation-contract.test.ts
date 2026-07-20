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

test("comparison exploration emits approved analytics events", () => {
  const page = readSource("features/compare/ComparePage.tsx");
  const table = readSource("features/compare/CompareTable.tsx");

  assert.match(page, /trackCompareSelectionChange\("remove"/);
  assert.match(page, /trackGuide\("open", "compare"\)/);
  assert.match(page, /trackGuide\("close", "compare"\)/);
  assert.match(page, /trackContentLoadError\("compare", "static_data"\)/);
  assert.match(table, /trackCompareSectionToggle\(/);
  assert.match(table, /trackDatasetOpen\(dataset\.title, "compare"\)/);
});

test("dataset details emit approved analytics events", () => {
  const section = readSource("features/dataset-detail/CGMDataSection.tsx");
  const header = readSource("features/dataset-detail/DatasetHeader.tsx");
  const detail = readSource("features/dataset-detail/DatasetDetail.tsx");

  assert.match(section, /trackDetailViewChange\(dataset\.title/);
  assert.match(header, /trackDatasetAction\(dataset\.title, "request_access"/);
  assert.match(header, /trackDatasetAction\(dataset\.title, "download"/);
  assert.match(header, /trackDatasetAction\(dataset\.title, "source"/);
  assert.match(header, /trackDatasetAction\(dataset\.title, "helper_scripts"/);
  assert.match(detail, /trackContentLoadError\("dataset_detail"/);
});
