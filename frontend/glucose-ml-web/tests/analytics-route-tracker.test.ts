import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  SCROLL_MILESTONES,
  getScrollPercent,
  nextMilestones,
} from "../src/analytics/scroll-depth.ts";

// ---------------------------------------------------------------------------
// Pure tests: scroll-depth.ts
// ---------------------------------------------------------------------------

test("SCROLL_MILESTONES is exactly [25, 50, 75, 90]", () => {
  assert.deepEqual(SCROLL_MILESTONES, [25, 50, 75, 90]);
});

test("getScrollPercent computes the fraction scrolled through the scrollable range", () => {
  assert.equal(
    getScrollPercent({ scrollY: 0, viewportHeight: 800, documentHeight: 1600 }),
    0
  );
  assert.equal(
    getScrollPercent({ scrollY: 400, viewportHeight: 800, documentHeight: 1600 }),
    50
  );
  assert.equal(
    getScrollPercent({ scrollY: 800, viewportHeight: 800, documentHeight: 1600 }),
    100
  );
});

test("getScrollPercent returns 100 when the document is not taller than the viewport", () => {
  assert.equal(
    getScrollPercent({ scrollY: 0, viewportHeight: 800, documentHeight: 800 }),
    100
  );
  assert.equal(
    getScrollPercent({ scrollY: 0, viewportHeight: 800, documentHeight: 400 }),
    100
  );
});

test("getScrollPercent clamps to the 0..100 range", () => {
  assert.equal(
    getScrollPercent({ scrollY: -50, viewportHeight: 800, documentHeight: 1600 }),
    0
  );
  assert.equal(
    getScrollPercent({ scrollY: 5000, viewportHeight: 800, documentHeight: 1600 }),
    100
  );
});

test("nextMilestones returns only newly crossed milestones", () => {
  assert.deepEqual(nextMilestones(25, new Set()), [25]);
  assert.deepEqual(nextMilestones(90, new Set([25])), [50, 75, 90]);
  assert.deepEqual(nextMilestones(90, new Set([25, 50, 75, 90])), []);
});

test("nextMilestones returns nothing below the first milestone", () => {
  assert.deepEqual(nextMilestones(10, new Set()), []);
  assert.deepEqual(nextMilestones(24.9, new Set()), []);
});

test("nextMilestones returns every milestone at once for a full scroll", () => {
  assert.deepEqual(nextMilestones(100, new Set()), [25, 50, 75, 90]);
});

// ---------------------------------------------------------------------------
// Source-text contract: AnalyticsRouteTracker.tsx
// ---------------------------------------------------------------------------

const trackerSource = readFileSync(
  fileURLToPath(new URL("../src/analytics/AnalyticsRouteTracker.tsx", import.meta.url)),
  "utf8"
);

test("AnalyticsRouteTracker calls initAnalytics", () => {
  assert.match(trackerSource, /initAnalytics\(\)/);
});

test("AnalyticsRouteTracker calls trackPageView", () => {
  assert.match(trackerSource, /trackPageView\(\s*\{/);
});

test("AnalyticsRouteTracker's page-view effect depends only on [pathname], never on the query string", () => {
  // Anchored to the trackPageView call itself, not just any effect in the
  // file: the effect that calls trackPageView must be the one whose
  // dependency array closes with exactly `[pathname]`. A loose
  // `/\},\s*\[pathname\]\s*\)/` match would also be satisfied by the
  // *scroll* effect's `[pathname]` (or, after sharing routeType/datasetName,
  // its `[pathname, routeType, datasetName]`), so it wouldn't actually pin
  // the page-view effect's contract.
  assert.match(
    trackerSource,
    /trackPageView\(\s*\{[\s\S]*?\}\s*\)\s*;[\s\S]*?\},\s*\[pathname\]\s*\)/
  );
  assert.equal(trackerSource.includes("location.search"), false);
  assert.equal(trackerSource.includes(".search"), false);
});

test("AnalyticsRouteTracker derives routeType and datasetName once and shares them between effects", () => {
  const routeTypeCalls = trackerSource.match(/getRouteType\(pathname\)/g) ?? [];
  const datasetNameCalls = trackerSource.match(/getDatasetNameFromPath\(pathname\)/g) ?? [];
  assert.equal(routeTypeCalls.length, 1, "getRouteType(pathname) must be called exactly once");
  assert.equal(
    datasetNameCalls.length,
    1,
    "getDatasetNameFromPath(pathname) must be called exactly once"
  );
});

test("AnalyticsRouteTracker updates a live-pathname ref during render, not inside an effect", () => {
  // The scroll-handler guard (see next test) is only correct if the value it
  // compares against is kept current independent of effect flush ordering.
  // Assigning `.current` during render — before any `useEffect(` call in
  // source order — is what gives that: React always finishes running this
  // component's function body before it runs any effect (cleanup or setup)
  // for the resulting commit.
  const refAssignIndex = trackerSource.indexOf(".current = pathname;");
  const firstEffectIndex = trackerSource.indexOf("useEffect(");
  assert.ok(refAssignIndex !== -1, "ref assignment `.current = pathname;` not found");
  assert.ok(firstEffectIndex !== -1, "no useEffect(...) call found");
  assert.ok(
    refAssignIndex < firstEffectIndex,
    "ref must be assigned during render, before the first useEffect call"
  );
});

test("AnalyticsRouteTracker's scroll handler bails out unless its captured pathname still matches the live pathname", () => {
  // RouteScrollManager (../src/app/RouteScrollManager.tsx) generates
  // synthetic scroll activity during navigation (a useLayoutEffect scroll,
  // plus a ResizeObserver that retries it). The handler must guard against
  // misattributing that activity to the wrong route from its own logic —
  // not merely by relying on React flushing this effect's cleanup/setup
  // before the browser dispatches the async `scroll` event.
  const handleScrollMatch = trackerSource.match(
    /handleScroll\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\};/
  );
  assert.ok(handleScrollMatch, "handleScroll function not found");
  const handleScrollBody = handleScrollMatch[1] ?? "";

  const guardMatch = handleScrollBody.match(
    /if\s*\(\s*([\w.]+)\s*!==\s*([\w.]+)\s*\)\s*return;/
  );
  assert.ok(guardMatch, "pathname-mismatch guard not found in handleScroll");

  const guardIndex = handleScrollBody.indexOf(guardMatch[0]);
  const trackCallIndex = handleScrollBody.indexOf("trackScrollDepth(");
  assert.ok(trackCallIndex !== -1, "trackScrollDepth call not found in handleScroll");
  assert.ok(
    guardIndex !== -1 && guardIndex < trackCallIndex,
    "the guard must run before trackScrollDepth can be called"
  );

  // One side of the comparison must read a ref's live value, proving the
  // guard checks the captured-at-setup pathname against something that can
  // change independent of this listener's own lifecycle.
  assert.ok(
    guardMatch[1].includes(".current") || guardMatch[2].includes(".current"),
    "guard must compare against a ref's live .current value"
  );
});

test("AnalyticsRouteTracker registers the scroll listener as passive and removes it on unmount", () => {
  assert.match(
    trackerSource,
    /addEventListener\(\s*"scroll",\s*\w+,\s*\{\s*passive:\s*true,?\s*\}\s*\)/
  );
  assert.match(trackerSource, /removeEventListener\(\s*"scroll",\s*\w+\)/);
});

test("AnalyticsRouteTracker calls trackScrollDepth", () => {
  assert.match(trackerSource, /trackScrollDepth\(\s*\{/);
});

test("AnalyticsRouteTracker renders null", () => {
  assert.match(trackerSource, /return null;/);
});

// ---------------------------------------------------------------------------
// Source-text contract: App.tsx
// ---------------------------------------------------------------------------

const appSource = readFileSync(
  fileURLToPath(new URL("../src/app/App.tsx", import.meta.url)),
  "utf8"
);

test("App.tsx mounts AnalyticsRouteTracker inside BrowserRouter", () => {
  const routerOpen = appSource.indexOf("<BrowserRouter>");
  const tracker = appSource.indexOf("<AnalyticsRouteTracker");
  const routerClose = appSource.indexOf("</BrowserRouter>");

  assert.ok(routerOpen !== -1, "BrowserRouter opening tag not found");
  assert.ok(tracker !== -1, "AnalyticsRouteTracker not found");
  assert.ok(routerClose !== -1, "BrowserRouter closing tag not found");
  assert.ok(routerOpen < tracker && tracker < routerClose);
});

test("App.tsx still mounts RouteScrollManager and the Vercel Analytics component", () => {
  assert.match(appSource, /<RouteScrollManager\s*\/>/);
  assert.match(appSource, /<Analytics\s*\/>/);
  assert.match(appSource, /from\s+"@vercel\/analytics\/react"/);
});
