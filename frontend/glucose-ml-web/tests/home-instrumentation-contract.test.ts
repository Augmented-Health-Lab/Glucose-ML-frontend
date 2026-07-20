import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const homePageTsx = readSource("../src/features/home/HomePage.tsx");
const filterBarTsx = readSource("../src/features/home/FilterBar.tsx");
const multiSelectTsx = readSource("../src/features/home/MultiSelect.tsx");
const datasetCardTsx = readSource("../src/features/home/DatasetCard.tsx");
const compareBarTsx = readSource("../src/features/home/CompareBar.tsx");

// ---------------------------------------------------------------------------
// Every event helper used on the home screen is imported from the barrel
// only, never from gtag.ts/params.ts/events.ts directly.
// ---------------------------------------------------------------------------

test("home feature files import analytics helpers only from the barrel", () => {
  for (const [name, source] of [
    ["HomePage.tsx", homePageTsx],
    ["FilterBar.tsx", filterBarTsx],
    ["MultiSelect.tsx", multiSelectTsx],
    ["DatasetCard.tsx", datasetCardTsx],
    ["CompareBar.tsx", compareBarTsx],
  ] as const) {
    assert.doesNotMatch(source, /from\s+"\.\.\/\.\.\/analytics\/gtag/, `${name} must not import gtag.ts directly`);
    assert.doesNotMatch(
      source,
      /from\s+"\.\.\/\.\.\/analytics\/(events|params)/,
      `${name} must not import events.ts/params.ts directly`
    );
    assert.doesNotMatch(source, /window\.gtag/, `${name} must never touch window.gtag`);
  }
});

// ---------------------------------------------------------------------------
// MultiSelect: onOptionToggle is the only add/remove diff source
// ---------------------------------------------------------------------------

test("MultiSelect exposes an optional onOptionToggle prop with the exact add/remove signature", () => {
  assert.match(
    multiSelectTsx,
    /onOptionToggle\?:\s*\(option:\s*string,\s*action:\s*"add"\s*\|\s*"remove"\)\s*=>\s*void/
  );
});

test("MultiSelect calls onOptionToggle before onChange, from the single isSelected check", () => {
  const handleClickMatch = multiSelectTsx.match(
    /const handleOptionClick = \(option: string\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(handleClickMatch, "handleOptionClick not found");
  const body = handleClickMatch[1] ?? "";

  const toggleIndex = body.indexOf("onOptionToggle?.(");
  const changeIndex = body.indexOf("onChange(newSelected)");
  assert.ok(toggleIndex !== -1, "onOptionToggle call not found");
  assert.ok(changeIndex !== -1, "onChange call not found");
  assert.ok(toggleIndex < changeIndex, "onOptionToggle must be called before onChange");

  // Only one selected.includes(option) computation — action is derived from
  // it once, not re-derived separately upstream.
  const includesCalls = body.match(/selected\.includes\(option\)/g) ?? [];
  assert.equal(includesCalls.length, 1);
});

// ---------------------------------------------------------------------------
// FilterBar: category-scoped narrowing, dedicated clear path
// ---------------------------------------------------------------------------

test("FilterBar narrows option to FilterOption via a verified membership check, not a cast", () => {
  assert.match(filterBarTsx, /value is FilterOption/);
  assert.doesNotMatch(filterBarTsx, /option as FilterOption/);
  assert.doesNotMatch(filterBarTsx, /as FilterCategory/);
});

test("FilterBar forwards onOptionToggle with the category label", () => {
  assert.match(
    filterBarTsx,
    /onOptionToggle=\{\s*\(option,\s*action\)\s*=>\s*\{[\s\S]*?onFilterOptionToggle\(f\.label,\s*option,\s*action\)/
  );
});

test("FilterBar's clear button calls a dedicated onClearFilters prop, never onFilterChange in a loop", () => {
  assert.match(filterBarTsx, /onClick=\{onClearFilters\}/);
  assert.doesNotMatch(filterBarTsx, /forEach\(\s*\(label\)\s*=>\s*onFilterChange/);
});

// ---------------------------------------------------------------------------
// HomePage: filter_change / filter_clear use the *next* filter state
// ---------------------------------------------------------------------------

test("HomePage computes filter_change counts from the next filter state via filterDatasets", () => {
  const handleChangeMatch = homePageTsx.match(
    /const handleFilterChange = \(label: string, selected: string\[\]\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(handleChangeMatch, "handleFilterChange not found");
  const body = handleChangeMatch[1] ?? "";

  assert.match(body, /const nextFilterSelections = \{ \.\.\.filterSelections, \[label\]: selected \}/);
  assert.match(body, /trackFilterChange\(\{/);
  assert.match(body, /resultCount:\s*filterDatasets\(datasets,\s*nextFilterSelections\)\.length/);
  assert.match(body, /setFilterSelections\(nextFilterSelections\)/);

  // trackFilterChange must be called (inside the toggle-pairing branch)
  // before the state is committed — it must measure the state it reports.
  const trackIndex = body.indexOf("trackFilterChange(");
  const setStateIndex = body.indexOf("setFilterSelections(nextFilterSelections)");
  assert.ok(trackIndex !== -1 && setStateIndex !== -1 && trackIndex < setStateIndex);
});

test("HomePage's filter_clear handler fires exactly one event with pre-clear counts and the cleared next state", () => {
  const handleClearMatch = homePageTsx.match(
    /const handleClearFilters = \(\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(handleClearMatch, "handleClearFilters not found");
  const body = handleClearMatch[1] ?? "";

  assert.match(body, /trackFilterClear\(\{/);
  assert.match(body, /resultCount:\s*filterDatasets\(datasets,\s*nextFilterSelections\)\.length/);

  // Exactly one trackFilterClear call, no trackFilterChange call, in this handler.
  const clearCalls = body.match(/trackFilterClear\(/g) ?? [];
  assert.equal(clearCalls.length, 1);
  assert.doesNotMatch(body, /trackFilterChange\(/);
});

// ---------------------------------------------------------------------------
// HomePage: compare selection change / clear
// ---------------------------------------------------------------------------

test("HomePage's handleCardSelect only reports compare_selection_change when the selection actually changed", () => {
  const handleSelectMatch = homePageTsx.match(
    /const handleCardSelect = \(title: string, checked: boolean\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(handleSelectMatch, "handleCardSelect not found");
  const body = handleSelectMatch[1] ?? "";

  assert.match(body, /if \(nextSelectedCards\.length !== selectedCards\.length\) \{/);
  assert.match(body, /trackCompareSelectionChange\(\{/);
  assert.match(body, /selectionAction:\s*checked\s*\?\s*"add"\s*:\s*"remove"/);

  // The duplicate/limit guard's early `return;` must precede the analytics
  // call, so that path never reaches it.
  const guardReturnIndex = body.indexOf("return;");
  const trackIndex = body.indexOf("trackCompareSelectionChange(");
  assert.ok(guardReturnIndex !== -1 && trackIndex !== -1 && guardReturnIndex < trackIndex);
});

test("HomePage's handleCardSelect validates title against the known-dataset list before reporting compare_selection_change", () => {
  // On the uncheck (remove) path, `title` can originate from `selectedCards`
  // (parsed straight from the ?datasets= query string by
  // parseSelectedDatasets, with no membership check of its own) via
  // handleRemoveCompareSelection below. Guarding here keeps a stale/
  // hand-edited link's arbitrary query text out of dataset_name.
  assert.match(
    homePageTsx,
    /import\s*\{[\s\S]*?isKnownDatasetName[\s\S]*?\}\s*from\s*"\.\.\/\.\.\/utils\/dataset-names"/,
    "HomePage must import isKnownDatasetName from utils/dataset-names"
  );

  const handleSelectMatch = homePageTsx.match(
    /const handleCardSelect = \(title: string, checked: boolean\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(handleSelectMatch, "handleCardSelect not found");
  const body = handleSelectMatch[1] ?? "";

  const guardIndex = body.indexOf("isKnownDatasetName(title)");
  const trackIndex = body.indexOf("trackCompareSelectionChange(");
  assert.ok(guardIndex !== -1, "isKnownDatasetName(title) guard not found");
  assert.ok(trackIndex !== -1, "trackCompareSelectionChange call not found");
  assert.ok(guardIndex < trackIndex, "title must be validated before trackCompareSelectionChange is called");

  // navigate(...) below must run unconditionally on the validation guard —
  // only the analytics call is suppressed for an unrecognized title.
  const navigateIndex = body.indexOf("navigate(");
  assert.ok(navigateIndex !== -1 && navigateIndex > trackIndex);
});

test("HomePage's handleClearCompareSelection reports a clear action with selection_count 0", () => {
  assert.match(
    homePageTsx,
    /trackCompareSelectionChange\(\{\s*selectionAction:\s*"clear",\s*selectionCount:\s*0\s*\}\)/
  );
});

// ---------------------------------------------------------------------------
// DatasetCard: dataset_open before navigate
// ---------------------------------------------------------------------------

test("DatasetCard tracks dataset_open with origin home before navigating", () => {
  const handleClickMatch = datasetCardTsx.match(
    /const handleCardClick = \(\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(handleClickMatch, "handleCardClick not found");
  const body = handleClickMatch[1] ?? "";

  assert.match(body, /trackDatasetOpen\(\{\s*datasetName:\s*title,\s*origin:\s*"home"\s*\}\)/);
  const trackIndex = body.indexOf("trackDatasetOpen(");
  const navigateIndex = body.indexOf("navigate(");
  assert.ok(trackIndex !== -1 && navigateIndex !== -1 && trackIndex < navigateIndex);
});

// ---------------------------------------------------------------------------
// CompareBar: compare_start on click, no preventDefault, disabled branch silent
// ---------------------------------------------------------------------------

test("CompareBar's Compare link tracks compare_start without blocking navigation", () => {
  assert.match(
    compareBarTsx,
    /<Link[\s\S]*?onClick=\{\s*\(\)\s*=>\s*trackCompareStart\(\{[\s\S]*?selectionCount:\s*selectedCards\.length,[\s\S]*?datasetNames:\s*knownSelectedCardNames,[\s\S]*?\}\)\s*\}[\s\S]*?<\/Link>/
  );
  assert.doesNotMatch(compareBarTsx, /preventDefault/);
});

// ---------------------------------------------------------------------------
// CompareBar: dataset_combination privacy — selectedCards is parsed straight
// from the ?datasets= query string (see parseSelectedDatasets in HomePage)
// with no membership check of its own, so only a validated subset may reach
// GA4 as dataset_combination.
// ---------------------------------------------------------------------------

test("CompareBar validates selectedCards against the known-dataset list before reporting compare_start", () => {
  assert.match(
    compareBarTsx,
    /import\s*\{\s*isKnownDatasetName\s*\}\s*from\s*"\.\.\/\.\.\/utils\/dataset-names"/,
    "CompareBar must import isKnownDatasetName from utils/dataset-names"
  );
  assert.match(
    compareBarTsx,
    /const knownSelectedCardNames = selectedCards\.filter\(isKnownDatasetName\)/,
    "CompareBar must derive knownSelectedCardNames via selectedCards.filter(isKnownDatasetName)"
  );

  // The rendered slots must still map over the full, unfiltered
  // selectedCards — validation must only affect what's sent to GA4, never
  // which chips render.
  assert.match(compareBarTsx, /selectedCards\.map\(\(title\) => \(/);
});

test("CompareBar's disabled button branch does not call trackCompareStart", () => {
  const disabledButtonMatch = compareBarTsx.match(
    /<button\s+className="home-compare-bar__button home-compare-bar__button--disabled"[\s\S]*?<\/button>/
  );
  assert.ok(disabledButtonMatch, "disabled compare button not found");
  assert.doesNotMatch(disabledButtonMatch[0], /trackCompareStart/);
});

// ---------------------------------------------------------------------------
// Guide open/close
// ---------------------------------------------------------------------------

test("HomePage tracks guide_open on GuideButton click and guide_close on LegendModal close", () => {
  assert.match(
    homePageTsx,
    /<GuideButton\s+onClick=\{\(\)\s*=>\s*\{\s*trackGuideOpen\(\{\s*screen:\s*"home"\s*\}\);\s*setLegendOpen\(true\);/
  );
  assert.match(
    homePageTsx,
    /<LegendModal[\s\S]*?onClose=\{\(\)\s*=>\s*\{\s*trackGuideClose\(\{\s*screen:\s*"home"\s*\}\);\s*setLegendOpen\(false\);/
  );
});

// ---------------------------------------------------------------------------
// Load error
// ---------------------------------------------------------------------------

test("HomePage's data-load catch tracks content_load_error alongside setLoadError, without changing what's displayed", () => {
  const catchMatch = homePageTsx.match(
    /\.catch\(\(error: unknown\) => \{([\s\S]*?)\n {6}\}\);/
  );
  assert.ok(catchMatch, "load .catch handler not found");
  const body = catchMatch[1] ?? "";

  assert.match(body, /trackContentLoadError\(\{\s*screen:\s*"home",\s*error\s*\}\)/);
  assert.match(body, /setLoadError\(error instanceof Error \? error\.message : String\(error\)\)/);
});
