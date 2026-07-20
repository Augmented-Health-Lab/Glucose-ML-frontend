import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const comparePageTsx = readSource("../src/features/compare/ComparePage.tsx");
const compareTableTsx = readSource("../src/features/compare/CompareTable.tsx");
const comparingChipsTsx = readSource("../src/features/compare/ComparingChips.tsx");

// ---------------------------------------------------------------------------
// Every event helper used on the compare screen is imported from the barrel
// only, never from gtag.ts/params.ts/events.ts directly.
// ---------------------------------------------------------------------------

test("compare feature files import analytics helpers only from the barrel", () => {
  for (const [name, source] of [
    ["ComparePage.tsx", comparePageTsx],
    ["CompareTable.tsx", compareTableTsx],
    ["ComparingChips.tsx", comparingChipsTsx],
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
// CompareTable: compare_section_toggle reports the resulting state
// ---------------------------------------------------------------------------

test("CompareTable's toggleSection reports the resulting section_state, not the prior one", () => {
  const toggleMatch = compareTableTsx.match(
    /const toggleSection = \(section: SectionKey\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(toggleMatch, "toggleSection not found");
  const body = toggleMatch[1] ?? "";

  assert.match(body, /trackCompareSectionToggle\(\{/);
  // Sections start expanded (all true), so a toggle where current[section]
  // is true (still-expanded, about to flip) must report "collapsed" —
  // truthy branch of the ternary must be "collapsed", not "expanded".
  assert.match(
    body,
    /sectionState:\s*expandedSections\[section\]\s*\?\s*"collapsed"\s*:\s*"expanded"/
  );

  // trackCompareSectionToggle must run before the state update, so it reads
  // the pre-toggle value and derives the correct resulting state from it.
  const trackIndex = body.indexOf("trackCompareSectionToggle(");
  const setStateIndex = body.indexOf("setExpandedSections(");
  assert.ok(trackIndex !== -1 && setStateIndex !== -1 && trackIndex < setStateIndex);
});

// ---------------------------------------------------------------------------
// CompareTable: dataset_open before navigate
// ---------------------------------------------------------------------------

test("CompareTable's details button tracks dataset_open with origin compare before navigating", () => {
  const detailsButtonMatch = compareTableTsx.match(
    /className="compare-table__details-button"\s*onClick=\{\(\) => \{([\s\S]*?)\n\s*\}\}/
  );
  assert.ok(detailsButtonMatch, "details button onClick not found");
  const body = detailsButtonMatch[1] ?? "";

  assert.match(
    body,
    /trackDatasetOpen\(\{\s*datasetName:\s*dataset\.title,\s*origin:\s*"compare"\s*\}\)/
  );
  const trackIndex = body.indexOf("trackDatasetOpen(");
  const navigateIndex = body.indexOf("navigate(");
  assert.ok(trackIndex !== -1 && navigateIndex !== -1 && trackIndex < navigateIndex);
});

// ---------------------------------------------------------------------------
// ComparePage: compare_selection_change on remove, with resulting count
// ---------------------------------------------------------------------------

test("ComparePage's handleRemoveDataset reports a remove action with the resulting selection_count", () => {
  const handleRemoveMatch = comparePageTsx.match(
    /const handleRemoveDataset = \(datasetName: string\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(handleRemoveMatch, "handleRemoveDataset not found");
  const body = handleRemoveMatch[1] ?? "";

  assert.match(body, /const remaining = selectedNames\.filter/);
  assert.match(body, /trackCompareSelectionChange\(\{/);
  assert.match(body, /selectionAction:\s*"remove"/);
  assert.match(body, /datasetName,/);
  assert.match(body, /selectionCount:\s*remaining\.length/);

  // The event must be emitted exactly once, unconditionally, ahead of the
  // branch that decides between navigating to the remaining compare view
  // and navigating home — not duplicated across both branches, and never a
  // synthesized "clear" action for the last-item-removed case.
  const trackCalls = body.match(/trackCompareSelectionChange\(/g) ?? [];
  assert.equal(trackCalls.length, 1);
  assert.doesNotMatch(body, /selectionAction:\s*"clear"/);

  const trackIndex = body.indexOf("trackCompareSelectionChange(");
  const branchIndex = body.indexOf("if (remaining.length > 0)");
  assert.ok(trackIndex !== -1 && branchIndex !== -1 && trackIndex < branchIndex);
});

// ---------------------------------------------------------------------------
// Guide open/close
// ---------------------------------------------------------------------------

test("ComparePage tracks guide_open on GuideButton click and guide_close on LegendModal close", () => {
  assert.match(
    comparePageTsx,
    /<GuideButton\s*\n?\s*onClick=\{\(\)\s*=>\s*\{\s*trackGuideOpen\(\{\s*screen:\s*"compare"\s*\}\);\s*setLegendOpen\(true\);/
  );
  assert.match(
    comparePageTsx,
    /<LegendModal[\s\S]*?onClose=\{\(\)\s*=>\s*\{\s*trackGuideClose\(\{\s*screen:\s*"compare"\s*\}\);\s*setLegendOpen\(false\);/
  );
});

// ---------------------------------------------------------------------------
// Load error
// ---------------------------------------------------------------------------

test("ComparePage's data-load catch tracks content_load_error alongside setState, without changing the rendered message", () => {
  const catchMatch = comparePageTsx.match(
    /\.catch\(\(error: unknown\) => \{([\s\S]*?)\n {6}\}\);/
  );
  assert.ok(catchMatch, "load .catch handler not found");
  const body = catchMatch[1] ?? "";

  assert.match(body, /trackContentLoadError\(\{\s*screen:\s*"compare",\s*error\s*\}\)/);
  assert.match(body, /status:\s*"error"/);

  const trackIndex = body.indexOf("trackContentLoadError(");
  const setStateIndex = body.indexOf("setState({");
  assert.ok(trackIndex !== -1 && setStateIndex !== -1 && trackIndex < setStateIndex);

  assert.match(
    comparePageTsx,
    /Unable to load compare data: \{state\.error\.message\}/
  );
});

// ---------------------------------------------------------------------------
// The ?datasets= query string is never copied into an event; names/counts
// are always derived from parsed state (selectedNames / remaining).
// ---------------------------------------------------------------------------

test("compare instrumentation never forwards location.search into an analytics call", () => {
  assert.doesNotMatch(comparePageTsx, /trackCompareSelectionChange\([^)]*location\.search/s);
  assert.doesNotMatch(comparePageTsx, /trackContentLoadError\([^)]*location\.search/s);
});
