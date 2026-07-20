# Google Analytics 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add detailed, anonymous GA4 route and product-interaction analytics to the Glucose-ML Vite/React application using Measurement ID `G-7VEBP7G8TE`.

**Architecture:** A focused `src/analytics/` package owns GA loading, privacy-safe typed events, route normalization, and scroll tracking. Existing UI handlers call named analytics helpers, while a single router-mounted component sends SPA page views and route-specific scroll milestones. GA failures are no-ops and never affect navigation or data loading.

**Tech Stack:** React 19, React Router 7, Vite 7, TypeScript 5.9, GA4 `gtag.js`, Node's built-in test runner.

## Global Constraints

- Use GA4 Measurement ID `G-7VEBP7G8TE` by default and allow `VITE_GA_MEASUREMENT_ID` to override it.
- Start analytics immediately on deployed production and preview builds; do not add a consent banner.
- Disable analytics in local development unless `VITE_GA_DEBUG=true`.
- Keep reports anonymous: never send user, participant, cohort, health, free-form text, raw exception, or uncontrolled query-string values.
- Keep the existing `@vercel/analytics` integration.
- Preserve the user's existing uncommitted changes in `AboutPage.tsx`, `about-page.css`, and `about-page-contract.test.ts`.
- The public-release contract excludes root `docs/`; the spec and plan are transient workflow artifacts and must be removed in the final task after implementation is complete.
- Add no analytics dependency; load the official GA4 script directly.

---

## File Structure

- Create `frontend/glucose-ml-web/src/analytics/google-analytics.ts`: GA initialization, environment detection, safe parameter normalization, and typed event dispatch.
- Create `frontend/glucose-ml-web/src/analytics/events.ts`: domain-specific event helper functions used by feature components.
- Create `frontend/glucose-ml-web/src/analytics/route-analytics.ts`: pure route normalization and scroll-milestone calculations.
- Create `frontend/glucose-ml-web/src/analytics/RouteAnalytics.tsx`: React Router page-view and scroll tracking.
- Create `frontend/glucose-ml-web/src/features/home/filter-datasets.ts`: reuse the existing filtering rules for rendering and next-state result counts.
- Create `frontend/glucose-ml-web/tests/google-analytics.test.ts`: pure analytics behavior and privacy tests.
- Create `frontend/glucose-ml-web/tests/analytics-instrumentation-contract.test.ts`: integration contracts across application handlers.
- Modify `frontend/glucose-ml-web/src/app/App.tsx`: mount route analytics without changing Vercel Analytics.
- Modify home, compare, and dataset-detail components listed in Tasks 3–5 to emit approved events.
- Modify `frontend/glucose-ml-web/README.md`: configuration, DebugView, custom dimensions, and user-testing reports.

---

### Task 1: Privacy-safe GA4 core and domain event API

**Files:**
- Create: `frontend/glucose-ml-web/src/analytics/google-analytics.ts`
- Create: `frontend/glucose-ml-web/src/analytics/events.ts`
- Test: `frontend/glucose-ml-web/tests/google-analytics.test.ts`

**Interfaces:**
- Produces: `initializeGoogleAnalytics(): boolean`
- Produces: `trackEvent<Name extends AnalyticsEventName>(name: Name, parameters: AnalyticsEventMap[Name]): void`
- Produces: `sanitizeAnalyticsParameters(parameters): AnalyticsParameters`
- Produces: named helpers `trackFilterChange`, `trackFilterClear`, `trackDatasetOpen`, `trackCompareSelectionChange`, `trackCompareStart`, `trackCompareSectionToggle`, `trackDetailViewChange`, `trackDatasetAction`, `trackGuide`, and `trackContentLoadError`.
- Consumes: no application modules.

- [ ] **Step 1: Write failing tests for parameter privacy, stable dataset combinations, and safe destinations**

Add these imports and tests to `tests/google-analytics.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sanitizeAnalyticsParameters } from "../src/analytics/google-analytics.ts";
import {
  getDestinationHostname,
  serializeDatasetNames,
} from "../src/analytics/events.ts";

const analyticsSource = readFileSync(
  new URL("../src/analytics/google-analytics.ts", import.meta.url),
  "utf8"
);

test("analytics parameters retain only bounded GA-safe primitives", () => {
  const raw = {
    valid_string: "  home  ",
    long_string: "x".repeat(140),
    count: 3,
    enabled: true,
    missing: undefined,
    invalid_number: Number.NaN,
    nested: { private: "value" },
  };

  assert.deepEqual(sanitizeAnalyticsParameters(raw), {
    valid_string: "home",
    long_string: "x".repeat(100),
    count: 3,
    enabled: true,
  });
});

test("dataset combinations aggregate independent of selection order", () => {
  assert.equal(
    serializeDatasetNames(["CGMacros", "AI-READI", "AZT1D"]),
    "AI-READI|AZT1D|CGMacros"
  );
});

test("destination tracking keeps only an http or https hostname", () => {
  assert.equal(
    getDestinationHostname("https://github.com/org/repo?token=private"),
    "github.com"
  );
  assert.equal(getDestinationHostname("javascript:alert(1)"), "unknown");
  assert.equal(getDestinationHostname("not a url"), "unknown");
});

test("GA initialization is idempotent, manual, and failure-safe", () => {
  assert.match(analyticsSource, /initializedMeasurementId === measurementId/);
  assert.match(analyticsSource, /script\[data-ga-measurement-id=/);
  assert.match(analyticsSource, /send_page_view:\s*false/);
  assert.match(analyticsSource, /catch\s*\{\s*return false;\s*\}/s);
  assert.doesNotMatch(analyticsSource, /user_id|participant_id|cohort_id/);
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run:

```bash
cd frontend/glucose-ml-web
node --test tests/google-analytics.test.ts
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/analytics/google-analytics.ts`.

- [ ] **Step 3: Implement the typed GA loader and sanitizer**

Create `src/analytics/google-analytics.ts` with these exported contracts and behaviors:

```ts
type AnalyticsPrimitive = string | number | boolean;

export type AnalyticsParameters = Record<
  string,
  AnalyticsPrimitive | undefined
>;

export type AnalyticsEventMap = {
  page_view: {
    page_path: string;
    page_location: string;
    page_referrer?: string;
    page_title: string;
    route_type: string;
    dataset_name?: string;
  };
  scroll_depth: {
    page_path: string;
    route_type: string;
    percent_scrolled: number;
    dataset_name?: string;
  };
  filter_change: {
    filter_name: string;
    filter_value: string;
    action: "add" | "remove";
    active_filter_count: number;
    result_count: number;
  };
  filter_clear: { cleared_filter_count: number; result_count: number };
  dataset_open: { dataset_name: string; origin: "home" | "compare" };
  compare_selection_change: {
    action: "add" | "remove" | "clear";
    selection_count: number;
    dataset_name?: string;
  };
  compare_start: { selection_count: number; dataset_names: string };
  compare_section_toggle: {
    section: "population" | "sources" | "cgm";
    state: "expanded" | "collapsed";
  };
  detail_view_change: {
    dataset_name: string;
    view: "histogram" | "time_in_range";
  };
  dataset_action: {
    dataset_name: string;
    action: "download" | "request_access" | "source" | "helper_scripts";
    destination_hostname: string;
  };
  guide_open: { screen: "home" | "compare" | "dataset_detail" };
  guide_close: { screen: "home" | "compare" | "dataset_detail" };
  content_load_error: {
    screen: "home" | "compare" | "dataset_detail";
    category: "static_data" | "dataset_not_found" | "missing_dataset_id";
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

const DEFAULT_MEASUREMENT_ID = "G-7VEBP7G8TE";
const MAX_PARAMETER_LENGTH = 100;
let initializedMeasurementId: string | null = null;

const viteEnv = (
  import.meta as ImportMeta & {
    env?: Record<string, string | boolean | undefined>;
  }
).env;

function getMeasurementId() {
  const configured = viteEnv?.VITE_GA_MEASUREMENT_ID;
  return typeof configured === "string" && configured.trim()
    ? configured.trim()
    : DEFAULT_MEASUREMENT_ID;
}

function isDebugEnabled() {
  return viteEnv?.VITE_GA_DEBUG === "true";
}

function isAnalyticsEnabled() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  return viteEnv?.DEV !== true || isDebugEnabled();
}

export function getAnalyticsEnvironment(): "production" | "preview" | "local" {
  if (typeof window === "undefined") return "local";
  if (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
    return "local";
  }
  return ["glucose-ml-project.com", "www.glucose-ml-project.com"].includes(
    window.location.hostname
  )
    ? "production"
    : "preview";
}

export function sanitizeAnalyticsParameters(
  parameters: Record<string, unknown>
): AnalyticsParameters {
  return Object.fromEntries(
    Object.entries(parameters).flatMap(([key, value]) => {
      if (typeof value === "string") {
        const normalized = value.trim().slice(0, MAX_PARAMETER_LENGTH);
        return normalized ? [[key, normalized]] : [];
      }
      if (typeof value === "number") {
        return Number.isFinite(value) ? [[key, value]] : [];
      }
      return typeof value === "boolean" ? [[key, value]] : [];
    })
  );
}

export function initializeGoogleAnalytics(): boolean {
  if (!isAnalyticsEnabled()) return false;

  try {
    const measurementId = getMeasurementId();
    if (initializedMeasurementId === measurementId) return true;

    window.dataLayer ??= [];
    window.gtag ??= (...args: unknown[]) => window.dataLayer?.push(args);

    if (!document.querySelector(`script[data-ga-measurement-id="${measurementId}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        measurementId
      )}`;
      script.dataset.gaMeasurementId = measurementId;
      document.head.append(script);
    }

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      anonymize_ip: true,
      debug_mode: isDebugEnabled(),
    });
    initializedMeasurementId = measurementId;
    return true;
  } catch {
    return false;
  }
}

export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  parameters: AnalyticsEventMap[Name]
): void {
  try {
    if (!initializeGoogleAnalytics() || !window.gtag) return;
    window.gtag("event", name, {
      ...sanitizeAnalyticsParameters(parameters),
      environment: getAnalyticsEnvironment(),
    });
  } catch {
    // Analytics must never interrupt application behavior.
  }
}
```

- [ ] **Step 4: Implement domain-specific helpers**

Create `src/analytics/events.ts`. It must import `trackEvent`, use the exact event names from `AnalyticsEventMap`, sort dataset combinations, reduce outbound URLs to hostnames, and expose helpers with these signatures:

```ts
import { trackEvent } from "./google-analytics";

export function serializeDatasetNames(datasetNames: string[]) {
  return [...datasetNames].sort((a, b) => a.localeCompare(b)).join("|");
}

export function getDestinationHostname(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.hostname
      : "unknown";
  } catch {
    return "unknown";
  }
}

export const trackFilterChange = (parameters: {
  filterName: string;
  filterValue: string;
  action: "add" | "remove";
  activeFilterCount: number;
  resultCount: number;
}) => trackEvent("filter_change", {
  filter_name: parameters.filterName,
  filter_value: parameters.filterValue,
  action: parameters.action,
  active_filter_count: parameters.activeFilterCount,
  result_count: parameters.resultCount,
});

export const trackFilterClear = (clearedFilterCount: number, resultCount: number) =>
  trackEvent("filter_clear", {
    cleared_filter_count: clearedFilterCount,
    result_count: resultCount,
  });

export const trackDatasetOpen = (
  datasetName: string,
  origin: "home" | "compare"
) => trackEvent("dataset_open", { dataset_name: datasetName, origin });

export const trackCompareSelectionChange = (
  action: "add" | "remove" | "clear",
  selectionCount: number,
  datasetName?: string
) => trackEvent("compare_selection_change", {
  action,
  selection_count: selectionCount,
  dataset_name: datasetName,
});

export const trackCompareStart = (datasetNames: string[]) =>
  trackEvent("compare_start", {
    selection_count: datasetNames.length,
    dataset_names: serializeDatasetNames(datasetNames),
  });

export const trackCompareSectionToggle = (
  section: "population" | "sources" | "cgm",
  expanded: boolean
) => trackEvent("compare_section_toggle", {
  section,
  state: expanded ? "expanded" : "collapsed",
});

export const trackDetailViewChange = (
  datasetName: string,
  view: "histogram" | "time_in_range"
) => trackEvent("detail_view_change", { dataset_name: datasetName, view });

export const trackDatasetAction = (
  datasetName: string,
  action: "download" | "request_access" | "source" | "helper_scripts",
  destinationUrl: string
) => trackEvent("dataset_action", {
  dataset_name: datasetName,
  action,
  destination_hostname: getDestinationHostname(destinationUrl),
});

export const trackGuide = (
  action: "open" | "close",
  screen: "home" | "compare" | "dataset_detail"
) => trackEvent(action === "open" ? "guide_open" : "guide_close", { screen });

export const trackContentLoadError = (
  screen: "home" | "compare" | "dataset_detail",
  category: "static_data" | "dataset_not_found" | "missing_dataset_id"
) => trackEvent("content_load_error", { screen, category });
```

- [ ] **Step 5: Run the focused test and the TypeScript build**

Run:

```bash
node --test tests/google-analytics.test.ts
npm run build
```

Expected: the new test passes and the build completes without TypeScript errors.

- [ ] **Step 6: Commit the analytics core**

```bash
git add frontend/glucose-ml-web/src/analytics/google-analytics.ts frontend/glucose-ml-web/src/analytics/events.ts frontend/glucose-ml-web/tests/google-analytics.test.ts
git commit -m "feat: add privacy-safe GA4 event layer"
```

---

### Task 2: SPA page views and scroll-depth tracking

**Files:**
- Create: `frontend/glucose-ml-web/src/analytics/route-analytics.ts`
- Create: `frontend/glucose-ml-web/src/analytics/RouteAnalytics.tsx`
- Modify: `frontend/glucose-ml-web/src/app/App.tsx`
- Test: `frontend/glucose-ml-web/tests/google-analytics.test.ts`

**Interfaces:**
- Consumes: `initializeGoogleAnalytics()` and `trackEvent()` from Task 1.
- Produces: `getRouteAnalyticsContext(pathname: string): RouteAnalyticsContext`.
- Produces: `getNewScrollMilestones(seen, scrollTop, scrollHeight, viewportHeight): number[]`.
- Produces: default React component `RouteAnalytics` mounted inside `BrowserRouter`.

- [ ] **Step 1: Add failing pure route and scroll tests**

Append to `tests/google-analytics.test.ts`:

```ts
import {
  getNewScrollMilestones,
  getRouteAnalyticsContext,
  getSafeReferrerOrigin,
} from "../src/analytics/route-analytics.ts";

test("route analytics recognizes only approved application paths", () => {
  assert.deepEqual(getRouteAnalyticsContext("/"), {
    pagePath: "/",
    pageTitle: "Explore CGM datasets",
    routeType: "home",
  });
  assert.deepEqual(getRouteAnalyticsContext("/dataset/AI-READI"), {
    pagePath: "/dataset/AI-READI",
    pageTitle: "AI-READI dataset",
    routeType: "dataset_detail",
    datasetName: "AI-READI",
  });
  assert.deepEqual(getRouteAnalyticsContext("/unknown/private-value"), {
    pagePath: "/other",
    pageTitle: "Glucose-ML",
    routeType: "other",
  });
  assert.deepEqual(getRouteAnalyticsContext("/dataset/private-value"), {
    pagePath: "/dataset/other",
    pageTitle: "Dataset detail",
    routeType: "dataset_detail",
  });
});

test("scroll analytics returns only newly crossed milestones", () => {
  assert.deepEqual(getNewScrollMilestones(new Set(), 500, 2000, 500), [25]);
  assert.deepEqual(
    getNewScrollMilestones(new Set([25, 50]), 1200, 2000, 500),
    [75]
  );
  assert.deepEqual(
    getNewScrollMilestones(new Set([25, 50, 75, 90]), 1500, 2000, 500),
    []
  );
});

test("initial referrers retain only a safe web origin", () => {
  assert.equal(
    getSafeReferrerOrigin("https://example.com/private?email=user@example.com"),
    "https://example.com/"
  );
  assert.equal(getSafeReferrerOrigin("javascript:alert(1)"), undefined);
});
```

- [ ] **Step 2: Run the test and confirm the missing route module**

Run `node --test tests/google-analytics.test.ts`.

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `route-analytics.ts`.

- [ ] **Step 3: Implement pure route and scroll calculations**

Create `src/analytics/route-analytics.ts` with this complete route whitelist and milestone calculation. Unknown dataset route values are deliberately reduced to `/dataset/other` and are not sent as dataset names:

```ts
export type RouteAnalyticsContext = {
  pagePath: string;
  pageTitle: string;
  routeType: "home" | "background" | "about" | "compare" | "dataset_detail" | "other";
  datasetName?: string;
};

const PUBLIC_DATASET_NAMES = new Set([
  "Hall 2018",
  "D1NAMO",
  "Colas 2019",
  "OhioT1DM",
  "T1DEXI",
  "T1DEXIP",
  "BIGIDEAs",
  "DiaTrend",
  "ShanghaiT1DM",
  "ShanghaiT2DM",
  "T1DiabetesGranada",
  "AI-READI",
  "UCHTT1DM",
  "HUPA-UCM",
  "CGMacros Dexcom",
  "CGMacros Libre",
  "T1D-UOM",
  "Bris-T1D Open",
  "AZT1D",
  "Park 2025",
  "PhysioCGM",
]);

const STATIC_ROUTES: Record<string, RouteAnalyticsContext> = {
  "/": {
    pagePath: "/",
    pageTitle: "Explore CGM datasets",
    routeType: "home",
  },
  "/background": {
    pagePath: "/background",
    pageTitle: "CGM background",
    routeType: "background",
  },
  "/about": {
    pagePath: "/about",
    pageTitle: "About Glucose-ML",
    routeType: "about",
  },
  "/compare": {
    pagePath: "/compare",
    pageTitle: "Compare CGM datasets",
    routeType: "compare",
  },
};

const SCROLL_MILESTONES = [25, 50, 75, 90] as const;

export function getRouteAnalyticsContext(
  pathname: string
): RouteAnalyticsContext {
  const staticRoute = STATIC_ROUTES[pathname];
  if (staticRoute) return staticRoute;

  if (pathname.startsWith("/dataset/")) {
    try {
      const datasetName = decodeURIComponent(pathname.slice("/dataset/".length));
      if (PUBLIC_DATASET_NAMES.has(datasetName)) {
        return {
          pagePath: `/dataset/${encodeURIComponent(datasetName)}`,
          pageTitle: `${datasetName} dataset`,
          routeType: "dataset_detail",
          datasetName,
        };
      }
    } catch {
      // Invalid route escapes are reported only as a generic detail route.
    }

    return {
      pagePath: "/dataset/other",
      pageTitle: "Dataset detail",
      routeType: "dataset_detail",
    };
  }

  return {
    pagePath: "/other",
    pageTitle: "Glucose-ML",
    routeType: "other",
  };
}

export function getSafeReferrerOrigin(referrer: string): string | undefined {
  try {
    const url = new URL(referrer);
    return url.protocol === "http:" || url.protocol === "https:"
      ? `${url.origin}/`
      : undefined;
  } catch {
    return undefined;
  }
}

export function getNewScrollMilestones(
  seen: ReadonlySet<number>,
  scrollTop: number,
  scrollHeight: number,
  viewportHeight: number
) {
  const scrollableHeight = Math.max(scrollHeight - viewportHeight, 0);
  const percent = scrollableHeight === 0
    ? 100
    : Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
  return SCROLL_MILESTONES.filter(
    (milestone) => percent >= milestone && !seen.has(milestone)
  );
}
```

- [ ] **Step 4: Implement the router-mounted tracker**

Create `src/analytics/RouteAnalytics.tsx`:

```tsx
import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initializeGoogleAnalytics, trackEvent } from "./google-analytics";
import {
  getNewScrollMilestones,
  getRouteAnalyticsContext,
  getSafeReferrerOrigin,
} from "./route-analytics";

let lastTrackedPageLocation: string | null = null;

export default function RouteAnalytics() {
  const location = useLocation();
  const seenMilestones = useRef(new Set<number>());
  const context = useMemo(
    () => getRouteAnalyticsContext(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    initializeGoogleAnalytics();
    seenMilestones.current = new Set();
    const pageLocation = `${window.location.origin}${context.pagePath}`;

    if (lastTrackedPageLocation !== pageLocation) {
      trackEvent("page_view", {
        page_path: context.pagePath,
        page_location: pageLocation,
        page_referrer:
          lastTrackedPageLocation ?? getSafeReferrerOrigin(document.referrer),
        page_title: context.pageTitle,
        route_type: context.routeType,
        dataset_name: context.datasetName,
      });
      lastTrackedPageLocation = pageLocation;
    }

    let animationFrame = 0;
    const measureScroll = () => {
      animationFrame = 0;
      const milestones = getNewScrollMilestones(
        seenMilestones.current,
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      for (const milestone of milestones) {
        seenMilestones.current.add(milestone);
        trackEvent("scroll_depth", {
          page_path: context.pagePath,
          route_type: context.routeType,
          percent_scrolled: milestone,
          dataset_name: context.datasetName,
        });
      }
    };
    const scheduleMeasurement = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(measureScroll);
    };

    scheduleMeasurement();
    window.addEventListener("scroll", scheduleMeasurement, { passive: true });
    window.addEventListener("resize", scheduleMeasurement);
    return () => {
      window.removeEventListener("scroll", scheduleMeasurement);
      window.removeEventListener("resize", scheduleMeasurement);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [context]);

  return null;
}
```

- [ ] **Step 5: Mount route analytics without removing Vercel Analytics**

In `src/app/App.tsx`, import `RouteAnalytics` and render it directly after `RouteScrollManager`:

```tsx
<BrowserRouter>
  <RouteScrollManager />
  <RouteAnalytics />
  <Routes>{/* existing routes unchanged */}</Routes>
  <Analytics />
</BrowserRouter>
```

- [ ] **Step 6: Run focused tests, lint, and build**

Run:

```bash
node --test tests/google-analytics.test.ts
npm run lint
npm run build
```

Expected: all commands exit 0; the build includes no hook dependency warnings or TypeScript errors.

- [ ] **Step 7: Commit route analytics**

```bash
git add frontend/glucose-ml-web/src/analytics/route-analytics.ts frontend/glucose-ml-web/src/analytics/RouteAnalytics.tsx frontend/glucose-ml-web/src/app/App.tsx frontend/glucose-ml-web/tests/google-analytics.test.ts
git commit -m "feat: track SPA page views and scroll depth"
```

---

### Task 3: Home discovery, filters, comparison selection, and guide events

**Files:**
- Create: `frontend/glucose-ml-web/src/features/home/filter-datasets.ts`
- Modify: `frontend/glucose-ml-web/src/features/home/HomePage.tsx`
- Modify: `frontend/glucose-ml-web/src/features/home/FilterBar.tsx`
- Modify: `frontend/glucose-ml-web/src/features/home/DatasetCard.tsx`
- Modify: `frontend/glucose-ml-web/src/features/home/CompareBar.tsx`
- Test: `frontend/glucose-ml-web/tests/analytics-instrumentation-contract.test.ts`

**Interfaces:**
- Consumes: Task 1's filter, dataset-open, compare-selection, compare-start, guide, and load-error helpers.
- Produces: `filterHomeDatasets(datasets, filterSelections): HomeDataset[]` used for both rendering and next-state analytics counts.
- Produces: `FilterBar.onClearFilters(): void` replacing the per-filter clear loop.

- [ ] **Step 1: Write failing home instrumentation contracts**

Create `tests/analytics-instrumentation-contract.test.ts` that reads the five home source files and asserts the following exact contracts with `assert.match`:

```ts
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
```

- [ ] **Step 2: Run the contract test and confirm it fails**

Run `node --test tests/analytics-instrumentation-contract.test.ts`.

Expected: FAIL on the first missing `trackFilterChange` assertion.

- [ ] **Step 3: Extract the existing home filtering rules**

Move the predicate currently inside `HomePage`'s `filteredDatasets` `useMemo` into `filter-datasets.ts` using this complete implementation:

```ts
import type { HomeDataset } from "../../types/dataset";

export type FilterSelections = Record<string, string[]>;

export function filterHomeDatasets(
  datasets: HomeDataset[],
  filterSelections: FilterSelections
): HomeDataset[] {
  if (Object.values(filterSelections).every((values) => values.length === 0)) {
    return datasets;
  }
  return datasets.filter((dataset) => {
    return Object.entries(filterSelections).every(
      ([filterLabel, selectedValues]) => {
        if (selectedValues.length === 0) return true;

        switch (filterLabel) {
          case "Data Sources": {
            const sourceMap: Record<string, string> = {
              "Continuous Glucose Monitor (CGM)": "G",
              "Insulin Delivery System": "I",
              "Wearable Tracker": "W",
              "Mobile / Manual logs": "M",
              Questionnaire: "Q",
              "Clinical measurements": "C",
            };
            return selectedValues.every((filterValue) =>
              dataset.sources.includes(sourceMap[filterValue])
            );
          }

          case "Population": {
            const typeMap: Record<string, string> = {
              T1D: "T1D",
              T2D: "T2D",
              Prediabetic: "PreD",
              "Non diabetic": "ND",
            };
            return selectedValues.every((filterValue) =>
              dataset.types.includes(typeMap[filterValue])
            );
          }

          case "Study duration": {
            if (dataset.days === "TBD") return false;
            const numDays = Number(dataset.days);
            switch (selectedValues[0]) {
              case "7+ days":
                return numDays >= 7;
              case "14+ days":
                return numDays >= 14;
              case "1 month":
                return numDays >= 30;
              case "2+ months":
                return numDays >= 60;
              default:
                return false;
            }
          }

          case "Sample size": {
            switch (selectedValues[0]) {
              case "20+":
                return dataset.participants >= 20;
              case "50+":
                return dataset.participants >= 50;
              case "100+":
                return dataset.participants >= 100;
              case "500+":
                return dataset.participants >= 500;
              case "1000+":
                return dataset.participants >= 1000;
              default:
                return false;
            }
          }

          case "Access":
            return dataset.access === selectedValues[0];
          default:
            return true;
        }
      }
    );
  });
}
```

Replace the `useMemo` predicate in `HomePage` with:

```ts
const filteredDatasets = useMemo(
  () => filterHomeDatasets(datasets, filterSelections),
  [datasets, filterSelections]
);
```

- [ ] **Step 4: Track accurate filter changes and one clear action**

Replace `HomePage`'s filter-change handler with this next-state implementation and add the clear handler:

```ts
const handleFilterChange = (label: string, selected: string[]) => {
  const previous = filterSelections[label] ?? [];
  const addedValue = selected.find((value) => !previous.includes(value));
  const removedValue = previous.find((value) => !selected.includes(value));
  const changedValue = addedValue ?? removedValue;
  const nextSelections = { ...filterSelections, [label]: selected };

  setFilterSelections(nextSelections);
  if (changedValue) {
    trackFilterChange({
      filterName: label,
      filterValue: changedValue,
      action: addedValue ? "add" : "remove",
      activeFilterCount: Object.values(nextSelections).reduce(
        (count, values) => count + values.length,
        0
      ),
      resultCount: filterHomeDatasets(datasets, nextSelections).length,
    });
  }
};

const handleClearFilters = () => {
  const clearedFilterCount = Object.values(filterSelections).reduce(
    (count, values) => count + values.length,
    0
  );
  setFilterSelections({});
  trackFilterClear(clearedFilterCount, datasets.length);
};
```

Add `onClearFilters: () => void` to `FilterBarProps`, pass the handler from `HomePage`, and reduce `FilterBar.handleClear` to:

```ts
const handleClear = () => onClearFilters();
```

- [ ] **Step 5: Track home comparison, card opens, guide use, and safe load errors**

In `HomePage`:

- after an accepted add/remove selection, emit `trackCompareSelectionChange(checked ? "add" : "remove", nextSelectedCards.length, title)`;
- before clearing comparison selections, emit `trackCompareSelectionChange("clear", 0)`;
- wrap the guide open/close state changes in handlers that call `trackGuide`;
- in the static-data catch path, emit `trackContentLoadError("home", "static_data")` without sending the error string.

In `DatasetCard.handleCardClick`, call `trackDatasetOpen(title, "home")` before `navigate`.

In the enabled `CompareBar` link, add:

```tsx
onClick={() => trackCompareStart(selectedCards)}
```

- [ ] **Step 6: Run the home contracts and existing home tests**

Run:

```bash
node --test tests/analytics-instrumentation-contract.test.ts tests/home-*.test.ts tests/population-selector-contract.test.ts
npm run lint
npm run build
```

Expected: all commands exit 0 and existing home behavior remains unchanged.

- [ ] **Step 7: Commit home analytics**

```bash
git add frontend/glucose-ml-web/src/features/home/filter-datasets.ts frontend/glucose-ml-web/src/features/home/HomePage.tsx frontend/glucose-ml-web/src/features/home/FilterBar.tsx frontend/glucose-ml-web/src/features/home/DatasetCard.tsx frontend/glucose-ml-web/src/features/home/CompareBar.tsx frontend/glucose-ml-web/tests/analytics-instrumentation-contract.test.ts
git commit -m "feat: track dataset discovery and comparison starts"
```

---

### Task 4: Comparison exploration and reliability events

**Files:**
- Modify: `frontend/glucose-ml-web/src/features/compare/ComparePage.tsx`
- Modify: `frontend/glucose-ml-web/src/features/compare/CompareTable.tsx`
- Modify: `frontend/glucose-ml-web/tests/analytics-instrumentation-contract.test.ts`

**Interfaces:**
- Consumes: `trackCompareSelectionChange`, `trackCompareSectionToggle`, `trackDatasetOpen`, `trackGuide`, and `trackContentLoadError` from Task 1.
- Produces: no new shared interfaces.

- [ ] **Step 1: Add failing compare instrumentation contracts**

Append:

```ts
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
```

- [ ] **Step 2: Run the contract test and confirm a compare assertion fails**

Run `node --test tests/analytics-instrumentation-contract.test.ts`.

Expected: FAIL on missing compare tracking.

- [ ] **Step 3: Instrument compare-page state transitions**

In `ComparePage`:

- emit `trackContentLoadError("compare", "static_data")` in the rejected data-load path;
- emit `trackCompareSelectionChange("remove", remaining.length, datasetName)` before navigating;
- add named open/close guide handlers that emit `trackGuide("open", "compare")` and `trackGuide("close", "compare")`;
- do not send `state.error.message` to analytics.

- [ ] **Step 4: Instrument section toggles and detail navigation**

In `CompareTable.toggleSection`, calculate the next state before updating and call:

```ts
const expanded = !expandedSections[section];
trackCompareSectionToggle(section, expanded);
```

Replace the inline detail-navigation callback with a named handler that calls `trackDatasetOpen(dataset.title, "compare")` before navigating to the encoded dataset path.

- [ ] **Step 5: Run compare tests, lint, and build**

Run:

```bash
node --test tests/analytics-instrumentation-contract.test.ts tests/compare-visual-contract.test.ts
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit compare analytics**

```bash
git add frontend/glucose-ml-web/src/features/compare/ComparePage.tsx frontend/glucose-ml-web/src/features/compare/CompareTable.tsx frontend/glucose-ml-web/tests/analytics-instrumentation-contract.test.ts
git commit -m "feat: track comparison exploration"
```

---

### Task 5: Dataset-detail visualization, outbound action, and error events

**Files:**
- Modify: `frontend/glucose-ml-web/src/features/dataset-detail/CGMDataSection.tsx`
- Modify: `frontend/glucose-ml-web/src/features/dataset-detail/DatasetHeader.tsx`
- Modify: `frontend/glucose-ml-web/src/features/dataset-detail/DatasetDetail.tsx`
- Modify: `frontend/glucose-ml-web/tests/analytics-instrumentation-contract.test.ts`

**Interfaces:**
- Consumes: `trackDetailViewChange`, `trackDatasetAction`, and `trackContentLoadError` from Task 1.
- Produces: no new shared interfaces.

- [ ] **Step 1: Add failing detail instrumentation contracts**

Append:

```ts
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
```

- [ ] **Step 2: Run the contract test and confirm a detail assertion fails**

Run `node --test tests/analytics-instrumentation-contract.test.ts`.

Expected: FAIL on missing detail tracking.

- [ ] **Step 3: Track real visualization changes only**

In `CGMDataSection`, replace `onChange={setTab}` with a handler that ignores an already-active tab, sets the next tab, and emits:

```ts
trackDetailViewChange(
  dataset.title,
  nextTab === "hist" ? "histogram" : "time_in_range"
);
```

- [ ] **Step 4: Track all enabled dataset actions without blocking navigation**

In `DatasetHeader`, add `onClick` handlers only to enabled anchors:

```tsx
onClick={() =>
  trackDatasetAction(dataset.title, "request_access", dataset.datasetLink!)
}
```

Use the corresponding action and URL for download, source, and helper scripts. Do not add tracking to disabled buttons, prevent the default action, or pass the full URL as an event parameter.

- [ ] **Step 5: Track safe dataset-detail failure categories**

In `DatasetDetail`, emit `missing_dataset_id` before setting the missing-ID error. In the main catch block classify only the fixed `Dataset not found` prefix as `dataset_not_found`; classify every other non-abort failure as `static_data`. Send the fixed category and screen, never `err.message`:

```ts
trackContentLoadError(
  "dataset_detail",
  err instanceof Error && err.message.startsWith("Dataset not found")
    ? "dataset_not_found"
    : "static_data"
);
```

- [ ] **Step 6: Run detail tests, lint, and build**

Run:

```bash
node --test tests/analytics-instrumentation-contract.test.ts tests/detail-*.test.ts tests/dataset-links.test.ts
npm run lint
npm run build
```

Expected: all commands exit 0 and outbound links still retain their current targets and security attributes.

- [ ] **Step 7: Commit detail analytics**

```bash
git add frontend/glucose-ml-web/src/features/dataset-detail/CGMDataSection.tsx frontend/glucose-ml-web/src/features/dataset-detail/DatasetHeader.tsx frontend/glucose-ml-web/src/features/dataset-detail/DatasetDetail.tsx frontend/glucose-ml-web/tests/analytics-instrumentation-contract.test.ts
git commit -m "feat: track dataset detail engagement"
```

---

### Task 6: GA4 operations guide, final verification, and workflow-doc cleanup

**Files:**
- Modify: `frontend/glucose-ml-web/README.md`
- Delete after implementation is verified: `docs/superpowers/specs/2026-07-20-google-analytics-design.md`
- Delete after implementation is verified: `docs/superpowers/plans/2026-07-20-google-analytics.md`

**Interfaces:**
- Consumes: all event names and parameters implemented in Tasks 1–5.
- Produces: operator instructions for configuration, DebugView, custom definitions, and user-testing Explorations.

- [ ] **Step 1: Document configuration and local validation**

Append a `Google Analytics 4` section to `frontend/glucose-ml-web/README.md` containing:

```md
## Google Analytics 4

Deployed builds send anonymous interaction analytics to GA4 property
`G-7VEBP7G8TE`. Override the property at build time with
`VITE_GA_MEASUREMENT_ID`. Local development does not send events by default;
run `VITE_GA_DEBUG=true npm run dev` to validate events in GA4 DebugView.

The application never sends user IDs, study/cohort identifiers, health values,
free-form text, raw errors, or arbitrary query parameters. Preview deployments
are labeled `preview`, the public site is labeled `production`, and localhost
debug traffic is labeled `local` through the `environment` event parameter.

Because the application sends manual React Router page views, disable GA4's
automatic browser-history page views to prevent duplicates: open Admin → Data
streams → Stream `1525054633` → Enhanced measurement settings → Page views →
Show advanced settings, then clear **Page changes based on browser history
events**. Keep other useful Enhanced Measurement options enabled.
```

- [ ] **Step 2: Document GA4 custom dimensions and Explorations**

List these event-scoped custom dimensions exactly: `environment`, `route_type`, `dataset_name`, `origin`, `filter_name`, `filter_value`, `action`, `dataset_names`, `section`, `state`, `view`, `destination_hostname`, `screen`, and `category`. List `active_filter_count`, `result_count`, `selection_count`, `percent_scrolled`, and `cleared_filter_count` as event-scoped custom metrics.

Document these GA4 Explorations:

- discovery funnel: home `page_view` → `filter_change` → `dataset_open`;
- comparison funnel: `compare_selection_change` → `compare_start` → compare-origin `dataset_open`;
- access funnel: detail `page_view` → `detail_view_change` → `dataset_action`;
- guide use segmented by `screen` and followed by the next product action;
- `scroll_depth` segmented by `route_type` and `dataset_name`;
- `content_load_error` segmented by `screen` and `environment`.

- [ ] **Step 3: Run the complete automated verification suite**

Run:

```bash
cd frontend/glucose-ml-web
node --test $(rg --files tests -g '*.test.ts' -g '!public-release-contract.test.ts')
npm run lint
npm run build
```

Expected: all implementation tests pass, ESLint exits 0, TypeScript completes, and Vite produces `dist/`. The public-release contract is intentionally deferred until the two transient root `docs/` files are removed in Step 7.

- [ ] **Step 4: Run a browser verification pass**

Start the app with local debug analytics enabled:

```bash
VITE_GA_DEBUG=true npm run dev -- --host 127.0.0.1
```

Verify in a browser that `/`, `/compare`, and one `/dataset/:id` route load without console errors; filter a dataset; add two datasets; start a comparison; toggle each comparison section; open a detail page from home and compare; switch both detail visualization tabs; open and close each available guide modal; and inspect requests for `gtag/js` plus GA collect calls. Do not complete outbound navigation during automation; verify the handler through the event call and link target instead.

Expected: existing flows work unchanged, one page view is emitted per route navigation, interaction events use only approved fixed/public values, and no raw query string or error message appears in analytics payloads.

- [ ] **Step 5: Review analytics changes without mixing in existing About-page work**

Run:

```bash
git status --short
git diff --check
git diff -- frontend/glucose-ml-web/src/analytics frontend/glucose-ml-web/src/app/App.tsx frontend/glucose-ml-web/src/features/home frontend/glucose-ml-web/src/features/compare frontend/glucose-ml-web/src/features/dataset-detail frontend/glucose-ml-web/tests/google-analytics.test.ts frontend/glucose-ml-web/tests/analytics-instrumentation-contract.test.ts frontend/glucose-ml-web/README.md
```

Expected: no whitespace errors, analytics changes are scoped to this plan, and the pre-existing About-page files remain unstaged and unmodified by this work.

- [ ] **Step 6: Commit the operations guide**

```bash
git add frontend/glucose-ml-web/README.md
git commit -m "docs: add GA4 user-testing guide"
```

- [ ] **Step 7: Remove transient workflow docs required to satisfy the public-release contract**

```bash
git rm docs/superpowers/specs/2026-07-20-google-analytics-design.md docs/superpowers/plans/2026-07-20-google-analytics.md
git commit -m "chore: remove analytics workflow docs from public tree"
```

- [ ] **Step 8: Re-run the complete suite and final status check**

```bash
cd frontend/glucose-ml-web
node --test tests/*.test.ts
npm run lint
npm run build
git status --short
```

Expected: every test including the public-release contract passes, lint and build exit 0, and `git status --short` lists only the user's pre-existing About-page changes.
