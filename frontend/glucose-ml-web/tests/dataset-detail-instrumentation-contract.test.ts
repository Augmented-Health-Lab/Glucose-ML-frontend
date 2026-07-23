import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const datasetDetailTsx = readSource("../src/features/dataset-detail/DatasetDetail.tsx");
const cgmDataSectionTsx = readSource("../src/features/dataset-detail/CGMDataSection.tsx");
const datasetHeaderTsx = readSource("../src/features/dataset-detail/DatasetHeader.tsx");

// ---------------------------------------------------------------------------
// Every event helper used on the dataset-detail screen is imported from the
// barrel only, never from gtag.ts/params.ts/events.ts directly.
// ---------------------------------------------------------------------------

test("dataset-detail feature files import analytics helpers only from the barrel", () => {
  for (const [name, source] of [
    ["DatasetDetail.tsx", datasetDetailTsx],
    ["CGMDataSection.tsx", cgmDataSectionTsx],
    ["DatasetHeader.tsx", datasetHeaderTsx],
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
// CGMDataSection: detail_view_change maps the internal TabKey to the
// approved DetailView values, and the dataset name is threaded down from
// DatasetDetail as a prop rather than re-derived.
// ---------------------------------------------------------------------------

test("CGMDataSection maps hist/tir to histogram/time_in_range and tracks before switching tabs", () => {
  assert.match(cgmDataSectionTsx, /datasetName:\s*string;/);

  const handlerMatch = cgmDataSectionTsx.match(
    /const handleTabChange = \(nextTab: TabKey\) => \{([\s\S]*?)\n {2}\};/
  );
  assert.ok(handlerMatch, "handleTabChange not found");
  const body = handlerMatch[1] ?? "";

  assert.match(body, /trackDetailViewChange\(\{/);
  assert.match(body, /datasetName,/);
  assert.match(body, /detailView:\s*TAB_TO_DETAIL_VIEW\[nextTab\]/);

  const trackIndex = body.indexOf("trackDetailViewChange(");
  const setTabIndex = body.indexOf("setTab(");
  assert.ok(trackIndex !== -1 && setTabIndex !== -1 && trackIndex < setTabIndex);

  assert.match(
    cgmDataSectionTsx,
    /TAB_TO_DETAIL_VIEW\s*=\s*\{\s*hist:\s*"histogram",\s*tir:\s*"time_in_range",\s*\}/
  );

  assert.match(cgmDataSectionTsx, /<CgmTabGroup active=\{tab\} onChange=\{handleTabChange\} \/>/);
});

test("DatasetDetail threads the dataset title into CGMDataSection as datasetName", () => {
  assert.match(
    datasetDetailTsx,
    /<CGMDataSection dataset=\{dataset\} datasetName=\{dataset\.title\} \/>/
  );
});

// ---------------------------------------------------------------------------
// DatasetHeader: each outbound link tracks dataset_action with the fixed
// action and the raw href (only its hostname is ever sent, by the helper);
// no preventDefault, no async handler; disabled-button fallbacks emit
// nothing.
// ---------------------------------------------------------------------------

test("DatasetHeader's outbound links track dataset_action without touching navigation", () => {
  const expectations: Array<{ label: string; action: string; hrefExpr: string }> = [
    { label: "Request access", action: "request_access", hrefExpr: "dataset.datasetLink!" },
    { label: "Download dataset", action: "download", hrefExpr: "dataset.downloadLink!" },
    { label: "Dataset source", action: "source", hrefExpr: "dataset.datasetLink!" },
    { label: "Helper scripts", action: "helper_scripts", hrefExpr: "helperScriptsUrl" },
  ];

  for (const { label, action, hrefExpr } of expectations) {
    const escapedHref = hrefExpr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `onClick=\\{\\(\\) =>\\s*trackDatasetAction\\(\\{\\s*datasetName:\\s*dataset\\.title,\\s*action:\\s*"${action}",\\s*href:\\s*${escapedHref},?\\s*\\}\\)\\s*\\}[\\s\\S]{0,200}?${label}`
    );
    assert.match(datasetHeaderTsx, pattern, `${label} link should track dataset_action("${action}")`);
  }

  assert.doesNotMatch(datasetHeaderTsx, /preventDefault/);
  assert.doesNotMatch(datasetHeaderTsx, /onClick=\{async/);
  assert.doesNotMatch(datasetHeaderTsx, /await\s/);
});

test("DatasetHeader's disabled-button fallbacks emit no analytics event", () => {
  const disabledButtons = datasetHeaderTsx.match(/<button[^>]*disabled[\s\S]*?<\/button>/g) ?? [];
  assert.ok(disabledButtons.length > 0, "expected at least one disabled fallback button");
  for (const button of disabledButtons) {
    assert.doesNotMatch(button, /trackDatasetAction/);
  }
});

// ---------------------------------------------------------------------------
// Load error
// ---------------------------------------------------------------------------

test("DatasetDetail's load catch tracks content_load_error before setting the error state, without changing the rendered message", () => {
  const catchMatch = datasetDetailTsx.match(/\} catch \(err\) \{([\s\S]*?)\n {6}\}/);
  assert.ok(catchMatch, "load catch handler not found");
  const body = catchMatch[1] ?? "";

  assert.match(body, /trackContentLoadError\(\{\s*screen:\s*"dataset_detail",\s*error:\s*err\s*\}\)/);
  assert.match(body, /status:\s*"error"/);

  const trackIndex = body.indexOf("trackContentLoadError(");
  const setLoadIndex = body.indexOf("setLoad({");
  assert.ok(trackIndex !== -1 && setLoadIndex !== -1 && trackIndex < setLoadIndex);

  assert.match(datasetDetailTsx, /<p>\{load\.error\.message\}<\/p>/);
});
