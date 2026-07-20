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
  assert.match(trackerSource, /\},\s*\[pathname\]\s*\)/);
  assert.equal(trackerSource.includes("location.search"), false);
  assert.equal(trackerSource.includes(".search"), false);
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
