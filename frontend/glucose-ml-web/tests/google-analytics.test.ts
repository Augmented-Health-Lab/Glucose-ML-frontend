import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getAnalyticsEnvironment,
  initializeGoogleAnalytics,
  sanitizeAnalyticsParameters,
  shouldEnableAnalytics,
} from "../src/analytics/google-analytics.ts";
import {
  getDestinationHostname,
  serializeDatasetNames,
  trackCompareSelectionChange,
  trackCompareStart,
  trackDatasetAction,
  trackDatasetOpen,
  trackDetailViewChange,
  trackFilterChange,
} from "../src/analytics/events.ts";
import {
  getNewScrollMilestones,
  getRouteAnalyticsContext,
  getSafeReferrerOrigin,
} from "../src/analytics/route-analytics.ts";
import { FILTERS } from "../src/data/filters.ts";

const analyticsSource = readFileSync(
  new URL("../src/analytics/google-analytics.ts", import.meta.url),
  "utf8"
);
const eventsSource = readFileSync(
  new URL("../src/analytics/events.ts", import.meta.url),
  "utf8"
);
const routeAnalyticsSource = readFileSync(
  new URL("../src/analytics/route-analytics.ts", import.meta.url),
  "utf8"
);

function captureAnalyticsEvents(run: () => void) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const calls: unknown[][] = [];

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { hostname: "glucose-ml-project.com" },
      gtag: (...args: unknown[]) => calls.push(args),
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      head: { append: () => undefined },
      querySelector: () => ({}),
    },
  });

  try {
    run();
    return calls.filter(([command]) => command === "event");
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, "window", previousWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
    if (previousDocument) {
      Object.defineProperty(globalThis, "document", previousDocument);
    } else {
      Reflect.deleteProperty(globalThis, "document");
    }
  }
}

test("the gtag bootstrap queues Arguments objects in call order", () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const dataLayer: unknown[] = [];

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      dataLayer,
      location: { hostname: "glucose-ml-project.com" },
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      head: { append: () => undefined },
      querySelector: () => ({}),
    },
  });

  try {
    assert.equal(initializeGoogleAnalytics(), true);
    assert.equal(typeof window.gtag, "function");
    window.gtag?.("get", "G-7VEBP7G8TE", "client_id", "callback");

    assert.equal(dataLayer.length, 3);
    assert.deepEqual(
      dataLayer.map((record) => Object.prototype.toString.call(record)),
      ["[object Arguments]", "[object Arguments]", "[object Arguments]"]
    );

    const [jsCall, configCall, getCall] = dataLayer.map((record) =>
      Array.from(record as ArrayLike<unknown>)
    );
    assert.deepEqual(
      [jsCall[0], configCall[0], getCall[0]],
      ["js", "config", "get"]
    );
    assert.equal(jsCall.length, 2);
    assert.equal(jsCall[0], "js");
    assert.ok(jsCall[1] instanceof Date);
    assert.deepEqual(configCall, [
      "config",
      "G-7VEBP7G8TE",
      {
        send_page_view: false,
        anonymize_ip: true,
        debug_mode: false,
      },
    ]);
    assert.deepEqual(getCall, [
      "get",
      "G-7VEBP7G8TE",
      "client_id",
      "callback",
    ]);
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, "window", previousWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
    if (previousDocument) {
      Object.defineProperty(globalThis, "document", previousDocument);
    } else {
      Reflect.deleteProperty(globalThis, "document");
    }
  }
});

test("analytics environment classifies only exact local and deployment hosts", () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const cases = [
    ["localhost", "local"],
    ["127.0.0.1", "local"],
    ["[::1]", "local"],
    ["0.0.0.0", "local"],
    ["glucose-ml-project.com", "production"],
    ["www.glucose-ml-project.com", "production"],
    ["glucose-ml-git-feature-example.vercel.app", "preview"],
    ["localhost.example.com", "preview"],
    ["notlocalhost", "preview"],
  ] as const;

  try {
    for (const [hostname, expectedEnvironment] of cases) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: { location: { hostname } },
      });

      const environment = getAnalyticsEnvironment();
      assert.equal(environment, expectedEnvironment, hostname);
      if (expectedEnvironment === "local") {
        assert.equal(
          shouldEnableAnalytics({
            isDev: false,
            environment,
            isDebug: false,
          }),
          false,
          `${hostname} production preview without debug`
        );
        assert.equal(
          shouldEnableAnalytics({
            isDev: false,
            environment,
            isDebug: true,
          }),
          true,
          `${hostname} production preview with debug`
        );
      }
    }
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, "window", previousWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
});

test("analytics enablement covers dev, local preview, deployments, and debug", () => {
  assert.equal(
    shouldEnableAnalytics({
      isDev: true,
      environment: "local",
      isDebug: false,
    }),
    false
  );
  assert.equal(
    shouldEnableAnalytics({
      isDev: false,
      environment: "local",
      isDebug: false,
    }),
    false
  );
  assert.equal(
    shouldEnableAnalytics({
      isDev: false,
      environment: "preview",
      isDebug: false,
    }),
    true
  );
  assert.equal(
    shouldEnableAnalytics({
      isDev: false,
      environment: "production",
      isDebug: false,
    }),
    true
  );
  assert.equal(
    shouldEnableAnalytics({
      isDev: true,
      environment: "local",
      isDebug: true,
    }),
    true
  );
});

test("filter analytics accepts every fixed filter option", () => {
  const events = captureAnalyticsEvents(() => {
    for (const filter of FILTERS) {
      for (const option of filter.options) {
        trackFilterChange({
          filterName: filter.label,
          filterValue: option,
          action: "add",
          activeFilterCount: 1,
          resultCount: 1,
        });
      }
    }
  });

  assert.equal(
    events.length,
    FILTERS.reduce((count, filter) => count + filter.options.length, 0)
  );
});

test("filter analytics rejects free-form and mismatched filter values", () => {
  const events = captureAnalyticsEvents(() => {
    trackFilterChange({
      filterName: "Blood glucose",
      filterValue: "patient@example.com HbA1c 9.2",
      action: "add",
      activeFilterCount: 1,
      resultCount: 1,
    });
    trackFilterChange({
      filterName: "Population",
      filterValue: "insulin dosage 42 units",
      action: "add",
      activeFilterCount: 1,
      resultCount: 1,
    });
    trackFilterChange({
      filterName: "Population",
      filterValue: "Open",
      action: "add",
      activeFilterCount: 1,
      resultCount: 1,
    });
  });

  assert.deepEqual(events, []);
});

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

test("dataset combinations discard unapproved names", () => {
  assert.equal(
    serializeDatasetNames(["AZT1D", "private glucose 412", "AI-READI"]),
    "AI-READI|AZT1D"
  );
});

test("comparison events discard unapproved dataset names", () => {
  const events = captureAnalyticsEvents(() => {
    trackCompareStart(["AZT1D", "patient@example.com", "AI-READI"]);
    trackCompareSelectionChange("remove", 2, "patient@example.com");
  });

  assert.deepEqual(events, [
    [
      "event",
      "compare_start",
      {
        selection_count: 2,
        dataset_names: "AI-READI|AZT1D",
        environment: "production",
      },
    ],
    [
      "event",
      "compare_selection_change",
      {
        action: "remove",
        selection_count: 2,
        environment: "production",
      },
    ],
  ]);
});

test("the fixed CGMacros alias passes every dataset event boundary", () => {
  const events = captureAnalyticsEvents(() => {
    trackCompareStart(["CGMacros"]);
    trackCompareSelectionChange("remove", 0, "CGMacros");
    trackDatasetOpen("CGMacros", "compare");
    trackDetailViewChange("CGMacros", "time_in_range");
    trackDatasetAction(
      "CGMacros",
      "helper_scripts",
      "https://github.com/example/repo"
    );
  });

  assert.deepEqual(events, [
    [
      "event",
      "compare_start",
      {
        selection_count: 1,
        dataset_names: "CGMacros",
        environment: "production",
      },
    ],
    [
      "event",
      "compare_selection_change",
      {
        action: "remove",
        selection_count: 0,
        dataset_name: "CGMacros",
        environment: "production",
      },
    ],
    [
      "event",
      "dataset_open",
      {
        dataset_name: "CGMacros",
        origin: "compare",
        environment: "production",
      },
    ],
    [
      "event",
      "detail_view_change",
      {
        dataset_name: "CGMacros",
        view: "time_in_range",
        environment: "production",
      },
    ],
    [
      "event",
      "dataset_action",
      {
        dataset_name: "CGMacros",
        action: "helper_scripts",
        destination_hostname: "github.com",
        environment: "production",
      },
    ],
  ]);
});

test("dataset domain events no-op for unapproved names", () => {
  const events = captureAnalyticsEvents(() => {
    trackDatasetOpen("patient@example.com", "home");
    trackDetailViewChange("private glucose 412", "histogram");
    trackDatasetAction(
      "private glucose 412",
      "source",
      "https://example.com/private"
    );
    trackDatasetOpen("AI-READI", "home");
    trackDetailViewChange("AI-READI", "histogram");
    trackDatasetAction(
      "AI-READI",
      "source",
      "https://example.com/private"
    );
  });

  assert.deepEqual(events, [
    [
      "event",
      "dataset_open",
      {
        dataset_name: "AI-READI",
        origin: "home",
        environment: "production",
      },
    ],
    [
      "event",
      "detail_view_change",
      {
        dataset_name: "AI-READI",
        view: "histogram",
        environment: "production",
      },
    ],
    [
      "event",
      "dataset_action",
      {
        dataset_name: "AI-READI",
        action: "source",
        destination_hostname: "example.com",
        environment: "production",
      },
    ],
  ]);
});

test("route and domain analytics consume one public dataset allowlist", () => {
  assert.match(eventsSource, /from "\.\/public-datasets\.ts"/);
  assert.match(routeAnalyticsSource, /from "\.\/public-datasets\.ts"/);
  assert.doesNotMatch(routeAnalyticsSource, /const PUBLIC_DATASET_NAMES = new Set/);
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
  assert.deepEqual(getRouteAnalyticsContext("/dataset/CGMacros"), {
    pagePath: "/dataset/CGMacros",
    pageTitle: "CGMacros dataset",
    routeType: "dataset_detail",
    datasetName: "CGMacros",
  });
  assert.deepEqual(getRouteAnalyticsContext("/dataset/CGMacros_Dexcom"), {
    pagePath: "/dataset/CGMacros%20Dexcom",
    pageTitle: "CGMacros Dexcom dataset",
    routeType: "dataset_detail",
    datasetName: "CGMacros Dexcom",
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
