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

test("CompareTable validates dataset.title against the known-dataset list before reporting dataset_open", () => {
  // buildCompareDataset (src/utils/compare-data.ts) falls back to the raw,
  // unvalidated ?datasets= query value (`?? title`) when no dataset record
  // matches, so dataset.title is not always trustworthy. Only a confirmed
  // match may reach GA4 as dataset_name; navigate(...) must still fire
  // either way.
  assert.match(
    compareTableTsx,
    /import\s*\{\s*isKnownDatasetName\s*\}\s*from\s*"\.\.\/\.\.\/utils\/dataset-names"/,
    "CompareTable must import isKnownDatasetName from utils/dataset-names"
  );

  const detailsButtonMatch = compareTableTsx.match(
    /className="compare-table__details-button"\s*onClick=\{\(\) => \{([\s\S]*?)\n\s*\}\}/
  );
  assert.ok(detailsButtonMatch, "details button onClick not found");
  const body = detailsButtonMatch[1] ?? "";

  const guardIndex = body.indexOf("isKnownDatasetName(dataset.title)");
  const trackIndex = body.indexOf("trackDatasetOpen(");
  const navigateIndex = body.indexOf("navigate(");
  assert.ok(guardIndex !== -1, "isKnownDatasetName(dataset.title) guard not found");
  assert.ok(guardIndex < trackIndex, "dataset.title must be validated before trackDatasetOpen is called");
  assert.ok(navigateIndex > trackIndex, "navigate must still run after the (possibly suppressed) tracking call");
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
// Privacy: handleRemoveDataset must not forward an unvalidated dataset name
// to GA4. `datasetName` here is one hop removed from `location.search` (it
// comes from `selectedNames`, which `parseCompareDatasets` derives from the
// `?datasets=` query string with no membership check — see
// `src/utils/compare-data.ts`), so a source-text scan for the literal
// substring `location.search` inside the `trackCompareSelectionChange` call
// proves nothing about whether the *value being sent* is trustworthy: it
// never contains that substring regardless of whether the value was
// validated. The only guarantee worth asserting is that the call is actually
// gated on `isKnownDatasetName`, imported from a source outside the
// analytics module, before the raw `datasetName` reaches
// `trackCompareSelectionChange`.
// ---------------------------------------------------------------------------

test("ComparePage validates datasetName against the known-dataset list before reporting compare_selection_change", () => {
  assert.match(
    comparePageTsx,
    /import\s*\{\s*isKnownDatasetName\s*\}\s*from\s*"\.\.\/\.\.\/utils\/dataset-names"/,
    "ComparePage must import isKnownDatasetName from utils/dataset-names"
  );

  const handleRemoveMatch = comparePageTsx.match(
    /const handleRemoveDataset = \(datasetName: string\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(handleRemoveMatch, "handleRemoveDataset not found");
  const body = handleRemoveMatch[1] ?? "";

  const guardIndex = body.indexOf("isKnownDatasetName(datasetName)");
  const trackIndex = body.indexOf("trackCompareSelectionChange(");
  assert.ok(guardIndex !== -1, "isKnownDatasetName(datasetName) guard not found in handleRemoveDataset");
  assert.ok(trackIndex !== -1, "trackCompareSelectionChange call not found in handleRemoveDataset");
  assert.ok(
    guardIndex < trackIndex,
    "datasetName must be validated by isKnownDatasetName before trackCompareSelectionChange is called"
  );

  // The navigation branches below must be unconditional on the validation
  // guard — removing an unrecognized name must still update the URL/chips
  // exactly as before, only the analytics call is suppressed.
  const branchIndex = body.indexOf("if (remaining.length > 0)");
  assert.ok(branchIndex !== -1 && branchIndex > trackIndex);
});

test("compare instrumentation never forwards location.search directly into an analytics call", () => {
  assert.doesNotMatch(comparePageTsx, /trackCompareSelectionChange\([^)]*location\.search/s);
  assert.doesNotMatch(comparePageTsx, /trackContentLoadError\([^)]*location\.search/s);
});
