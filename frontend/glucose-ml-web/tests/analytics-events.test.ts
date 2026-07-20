import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Fake globals — same technique as tests/analytics-gtag-contract.test.ts.
// `events.ts` sends through `gtag.ts`'s `sendEvent`, which touches
// `window`/`document`; install fakes before the dynamic import so both
// modules can be imported the same way they would run in a browser.
// ---------------------------------------------------------------------------

interface FakeWindow {
  location: { hostname: string };
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
}

interface FakeDocument {
  createElement: (tagName: string) => { tagName: string; async?: boolean; src?: string };
  head: { appendChild: (element: unknown) => void };
}

type FakeGlobal = typeof globalThis & {
  window?: FakeWindow;
  document?: FakeDocument;
};

const fakeGlobal = globalThis as FakeGlobal;

function installFakes(hostname = "www.glucose-ml-project.com"): {
  window: FakeWindow;
  gtagCalls: unknown[][];
} {
  const gtagCalls: unknown[][] = [];
  const fakeWindow: FakeWindow = {
    location: { hostname },
    dataLayer: [],
    gtag: (...args: unknown[]) => {
      gtagCalls.push(args);
    },
  };
  const fakeDocument: FakeDocument = {
    createElement: (tagName: string) => ({ tagName }),
    head: { appendChild: () => {} },
  };
  fakeGlobal.window = fakeWindow;
  fakeGlobal.document = fakeDocument;
  return { window: fakeWindow, gtagCalls };
}

function uninstallFakes(): void {
  delete fakeGlobal.window;
  delete fakeGlobal.document;
}

installFakes();
const gtagModule = await import("../src/analytics/gtag.ts");
const eventsModule = await import("../src/analytics/events.ts");
uninstallFakes();

const { resetAnalyticsForTests, __setAnalyticsEnvForTests } = gtagModule;
const {
  trackPageView,
  trackScrollDepth,
  trackFilterChange,
  trackFilterClear,
  trackDatasetOpen,
  trackCompareSelectionChange,
  trackCompareStart,
  trackCompareSectionToggle,
  trackDetailViewChange,
  trackDatasetAction,
  trackGuideOpen,
  trackGuideClose,
  trackContentLoadError,
} = eventsModule;

test.after(() => {
  uninstallFakes();
});

/** Runs `fn` with analytics enabled and fake globals installed, and returns
 * the single recorded `gtag("event", name, params)` call. Fails the test if
 * zero or more than one event call was recorded. */
function captureEvent(fn: () => void): { name: string; params: Record<string, unknown> } {
  resetAnalyticsForTests();
  __setAnalyticsEnvForTests({ PROD: true });
  const fakes = installFakes();
  try {
    fn();
    const eventCalls = fakes.gtagCalls.filter((call) => call[0] === "event");
    assert.equal(eventCalls.length, 1, "expected exactly one gtag event call");
    const call = eventCalls[0]!;
    return { name: call[1] as string, params: call[2] as Record<string, unknown> };
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
    __setAnalyticsEnvForTests(undefined);
  }
}

function keysExcludingEnvironment(params: Record<string, unknown>): string[] {
  return Object.keys(params)
    .filter((key) => key !== "environment")
    .sort();
}

// ---------------------------------------------------------------------------
// trackPageView
// ---------------------------------------------------------------------------

test("trackPageView sends page_view with the exact reference keys, dataset_name included", () => {
  const { name, params } = captureEvent(() =>
    trackPageView({
      pagePath: "/dataset/CGMacros",
      pageTitle: "CGMacros — Glucose ML",
      routeType: "dataset_detail",
      datasetName: "CGMacros",
    })
  );
  assert.equal(name, "page_view");
  assert.deepEqual(keysExcludingEnvironment(params), [
    "dataset_name",
    "page_path",
    "page_title",
    "route_type",
  ]);
  assert.equal(params.page_path, "/dataset/CGMacros");
  assert.equal(params.route_type, "dataset_detail");
  assert.equal(params.dataset_name, "CGMacros");
});

test("trackPageView omits dataset_name on non-dataset-detail routes", () => {
  const { params } = captureEvent(() =>
    trackPageView({ pagePath: "/", pageTitle: "Home", routeType: "home" })
  );
  assert.deepEqual(keysExcludingEnvironment(params), ["page_path", "page_title", "route_type"]);
});

// ---------------------------------------------------------------------------
// trackScrollDepth
// ---------------------------------------------------------------------------

test("trackScrollDepth sends scroll_depth with the exact reference keys", () => {
  const { name, params } = captureEvent(() =>
    trackScrollDepth({ percent: 75, routeType: "compare" })
  );
  assert.equal(name, "scroll_depth");
  assert.deepEqual(keysExcludingEnvironment(params), ["percent", "route_type"]);
  assert.equal(params.percent, 75);
});

test("trackScrollDepth includes dataset_name on dataset-detail routes", () => {
  const { params } = captureEvent(() =>
    trackScrollDepth({ percent: 25, routeType: "dataset_detail", datasetName: "Park 2025" })
  );
  assert.deepEqual(keysExcludingEnvironment(params), ["dataset_name", "percent", "route_type"]);
});

// ---------------------------------------------------------------------------
// trackFilterChange / trackFilterClear
// ---------------------------------------------------------------------------

test("trackFilterChange sends filter_change with the exact reference keys", () => {
  const { name, params } = captureEvent(() =>
    trackFilterChange({
      filterCategory: "Population",
      filterOption: "Type 1 diabetes",
      filterAction: "add",
      activeFilterCount: 3,
      resultCount: 5,
    })
  );
  assert.equal(name, "filter_change");
  assert.deepEqual(keysExcludingEnvironment(params), [
    "active_filter_count",
    "filter_action",
    "filter_category",
    "filter_option",
    "result_count",
  ]);
  assert.equal(params.filter_action, "add");
});

test("trackFilterChange clamps counts above the bound", () => {
  const { params } = captureEvent(() =>
    trackFilterChange({
      filterCategory: "Population",
      filterOption: "Type 1 diabetes",
      filterAction: "remove",
      activeFilterCount: 5000,
      resultCount: -1,
    })
  );
  assert.equal(params.active_filter_count, 999);
  assert.equal(params.result_count, 0);
});

test("trackFilterClear sends filter_clear with the exact reference keys", () => {
  const { name, params } = captureEvent(() =>
    trackFilterClear({ clearedFilterCount: 4, resultCount: 12 })
  );
  assert.equal(name, "filter_clear");
  assert.deepEqual(keysExcludingEnvironment(params), ["cleared_filter_count", "result_count"]);
});

// ---------------------------------------------------------------------------
// trackDatasetOpen
// ---------------------------------------------------------------------------

test("trackDatasetOpen sends dataset_open with the exact reference keys", () => {
  const { name, params } = captureEvent(() =>
    trackDatasetOpen({ datasetName: "CGMacros", origin: "home" })
  );
  assert.equal(name, "dataset_open");
  assert.deepEqual(keysExcludingEnvironment(params), ["dataset_name", "origin"]);
  assert.equal(params.origin, "home");
});

// ---------------------------------------------------------------------------
// trackCompareSelectionChange
// ---------------------------------------------------------------------------

test("trackCompareSelectionChange (add) includes dataset_name", () => {
  const { name, params } = captureEvent(() =>
    trackCompareSelectionChange({
      selectionAction: "add",
      datasetName: "CGMacros",
      selectionCount: 2,
    })
  );
  assert.equal(name, "compare_selection_change");
  assert.deepEqual(keysExcludingEnvironment(params), [
    "dataset_name",
    "selection_action",
    "selection_count",
  ]);
});

test("trackCompareSelectionChange (remove) includes dataset_name", () => {
  const { params } = captureEvent(() =>
    trackCompareSelectionChange({
      selectionAction: "remove",
      datasetName: "CGMacros",
      selectionCount: 1,
    })
  );
  assert.deepEqual(keysExcludingEnvironment(params), [
    "dataset_name",
    "selection_action",
    "selection_count",
  ]);
});

test("trackCompareSelectionChange (clear) omits dataset_name entirely", () => {
  const { params } = captureEvent(() =>
    trackCompareSelectionChange({ selectionAction: "clear", selectionCount: 0 })
  );
  assert.deepEqual(keysExcludingEnvironment(params), ["selection_action", "selection_count"]);
  assert.equal("dataset_name" in params, false);
});

// ---------------------------------------------------------------------------
// trackCompareStart
// ---------------------------------------------------------------------------

test("trackCompareStart sorts the dataset combination regardless of input order", () => {
  const first = captureEvent(() =>
    trackCompareStart({ selectionCount: 2, datasetNames: ["Park 2025", "CGMacros"] })
  );
  const second = captureEvent(() =>
    trackCompareStart({ selectionCount: 2, datasetNames: ["CGMacros", "Park 2025"] })
  );
  assert.equal(first.name, "compare_start");
  assert.equal(first.params.dataset_combination, "CGMacros|Park 2025");
  assert.equal(second.params.dataset_combination, "CGMacros|Park 2025");
  assert.deepEqual(keysExcludingEnvironment(first.params), [
    "dataset_combination",
    "selection_count",
  ]);
});

// ---------------------------------------------------------------------------
// trackCompareSectionToggle
// ---------------------------------------------------------------------------

test("trackCompareSectionToggle sends compare_section_toggle with the exact reference keys", () => {
  const { name, params } = captureEvent(() =>
    trackCompareSectionToggle({ section: "population", sectionState: "collapsed" })
  );
  assert.equal(name, "compare_section_toggle");
  assert.deepEqual(keysExcludingEnvironment(params), ["section", "section_state"]);
});

// ---------------------------------------------------------------------------
// trackDetailViewChange
// ---------------------------------------------------------------------------

test("trackDetailViewChange sends detail_view_change with the exact reference keys", () => {
  const { name, params } = captureEvent(() =>
    trackDetailViewChange({ datasetName: "CGMacros", detailView: "time_in_range" })
  );
  assert.equal(name, "detail_view_change");
  assert.deepEqual(keysExcludingEnvironment(params), ["dataset_name", "detail_view"]);
});

// ---------------------------------------------------------------------------
// trackDatasetAction
// ---------------------------------------------------------------------------

test("trackDatasetAction sends only destination_host, never the full URL", () => {
  const { name, params } = captureEvent(() =>
    trackDatasetAction({
      datasetName: "org/repo",
      action: "source",
      href: "https://github.com/org/repo/tree/main/x",
    })
  );
  assert.equal(name, "dataset_action");
  assert.deepEqual(keysExcludingEnvironment(params), ["action", "dataset_name", "destination_host"]);
  assert.equal(params.destination_host, "github.com");

  const serialized = JSON.stringify(params);
  assert.equal(serialized.includes("github.com/org/repo"), false);
  assert.equal(serialized.includes("/tree/main/x"), false);
  assert.equal(serialized.includes("https://"), false);
});

test("trackDatasetAction omits destination_host when no host can be derived", () => {
  const { params } = captureEvent(() =>
    trackDatasetAction({ datasetName: "org/repo", action: "download", href: "" })
  );
  assert.deepEqual(keysExcludingEnvironment(params), ["action", "dataset_name"]);
  assert.equal("destination_host" in params, false);
});

// ---------------------------------------------------------------------------
// trackGuideOpen / trackGuideClose
// ---------------------------------------------------------------------------

test("trackGuideOpen sends guide_open with the exact reference keys", () => {
  const { name, params } = captureEvent(() => trackGuideOpen({ screen: "home" }));
  assert.equal(name, "guide_open");
  assert.deepEqual(keysExcludingEnvironment(params), ["screen"]);
  assert.equal(params.screen, "home");
});

test("trackGuideClose sends guide_close with the exact reference keys", () => {
  const { name, params } = captureEvent(() => trackGuideClose({ screen: "compare" }));
  assert.equal(name, "guide_close");
  assert.deepEqual(keysExcludingEnvironment(params), ["screen"]);
});

// ---------------------------------------------------------------------------
// trackContentLoadError
// ---------------------------------------------------------------------------

test("trackContentLoadError sends only error_category, never any substring of the message", () => {
  const secretMessage = "Failed to fetch https://internal.example/secret.json";
  const { name, params } = captureEvent(() =>
    trackContentLoadError({ screen: "home", error: new Error(secretMessage) })
  );
  assert.equal(name, "content_load_error");
  assert.deepEqual(keysExcludingEnvironment(params), ["error_category", "screen"]);
  assert.equal(params.error_category, "network");

  const serialized = JSON.stringify(params);
  for (let i = 0; i < secretMessage.length - 8; i++) {
    const substring = secretMessage.slice(i, i + 8);
    assert.equal(
      serialized.includes(substring),
      false,
      `payload leaked substring of the original error message: ${substring}`
    );
  }
});

test("trackContentLoadError handles a non-Error value as unknown", () => {
  const { params } = captureEvent(() =>
    trackContentLoadError({ screen: "dataset_detail", error: "plain string error" })
  );
  assert.equal(params.error_category, "unknown");
});
