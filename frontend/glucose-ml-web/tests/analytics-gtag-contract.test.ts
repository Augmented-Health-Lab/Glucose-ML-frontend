import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Source-text tests — these do not need `window`/`document` and run first
// against the raw file contents.
// ---------------------------------------------------------------------------

const SOURCE_PATH = fileURLToPath(
  new URL("../src/analytics/gtag.ts", import.meta.url)
);
const SOURCE_TEXT = readFileSync(SOURCE_PATH, "utf8");

test("source: passes send_page_view: false to gtag config", () => {
  assert.match(SOURCE_TEXT, /send_page_view:\s*false/);
});

test("source: contains the fallback measurement id G-7VEBP7G8TE", () => {
  assert.ok(SOURCE_TEXT.includes("G-7VEBP7G8TE"));
});

test("source: references VITE_GA_MEASUREMENT_ID", () => {
  assert.ok(SOURCE_TEXT.includes("VITE_GA_MEASUREMENT_ID"));
});

test("source: references VITE_GA_DEBUG", () => {
  assert.ok(SOURCE_TEXT.includes("VITE_GA_DEBUG"));
});

test("source: every import.meta.env read is inside a function body, not at module top level", () => {
  const offendingLines = SOURCE_TEXT.split("\n").filter((line) => {
    if (!line.includes("import.meta.env")) return false;
    // A top-level read starts at column 0 (no leading whitespace).
    return !/^\s/.test(line);
  });
  assert.deepEqual(offendingLines, []);
});

// ---------------------------------------------------------------------------
// Behavioral tests — install fakes on `globalThis` before dynamically
// importing the module, per the module's own testability contract.
// ---------------------------------------------------------------------------

interface FakeScriptElement {
  tagName: string;
  async?: boolean;
  src?: string;
}

interface FakeWindow {
  location: { hostname: string };
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
}

interface FakeDocument {
  createElement: (tagName: string) => FakeScriptElement;
  head: { appendChild: (element: FakeScriptElement) => void };
}

type FakeGlobal = typeof globalThis & {
  window?: FakeWindow;
  document?: FakeDocument;
};

const fakeGlobal = globalThis as FakeGlobal;

interface InstalledFakes {
  window: FakeWindow;
  gtagCalls: unknown[][];
  scriptElements: FakeScriptElement[];
  appendedElements: FakeScriptElement[];
}

function installFakes(hostname = "www.glucose-ml-project.com"): InstalledFakes {
  const gtagCalls: unknown[][] = [];
  const scriptElements: FakeScriptElement[] = [];
  const appendedElements: FakeScriptElement[] = [];

  const fakeWindow: FakeWindow = {
    location: { hostname },
    dataLayer: [],
    gtag: (...args: unknown[]) => {
      gtagCalls.push(args);
    },
  };

  const fakeDocument: FakeDocument = {
    createElement: (tagName: string) => {
      const element: FakeScriptElement = { tagName };
      scriptElements.push(element);
      return element;
    },
    head: {
      appendChild: (element: FakeScriptElement) => {
        appendedElements.push(element);
      },
    },
  };

  fakeGlobal.window = fakeWindow;
  fakeGlobal.document = fakeDocument;

  return { window: fakeWindow, gtagCalls, scriptElements, appendedElements };
}

function uninstallFakes(): void {
  delete fakeGlobal.window;
  delete fakeGlobal.document;
}

// Install minimal fakes before the dynamic import so the module (whose
// window/document access is all lazy, inside function bodies) can be
// imported the same way it would run in a browser.
installFakes();
const gtagModule = await import("../src/analytics/gtag.ts");
uninstallFakes();

const { initAnalytics, sendEvent, isAnalyticsEnabled, resetAnalyticsForTests } =
  gtagModule;

test.after(() => {
  uninstallFakes();
});

// ---------------------------------------------------------------------------
// isAnalyticsEnabled
// ---------------------------------------------------------------------------

test("isAnalyticsEnabled is false under the real (unset) test environment", () => {
  resetAnalyticsForTests();
  assert.equal(isAnalyticsEnabled(), false);
});

test("isAnalyticsEnabled is true when the env override sets PROD", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  assert.equal(isAnalyticsEnabled(), true);
  resetAnalyticsForTests();
});

test("isAnalyticsEnabled is true when the env override sets VITE_GA_DEBUG to 'true'", () => {
  resetAnalyticsForTests({ env: { VITE_GA_DEBUG: "true" } });
  assert.equal(isAnalyticsEnabled(), true);
  resetAnalyticsForTests();
});

test("isAnalyticsEnabled is false when neither PROD nor VITE_GA_DEBUG is set", () => {
  resetAnalyticsForTests({ env: { VITE_GA_DEBUG: "false" } });
  assert.equal(isAnalyticsEnabled(), false);
  resetAnalyticsForTests();
});

test("isAnalyticsEnabled is false when the measurement id is blank", () => {
  resetAnalyticsForTests({
    env: { PROD: true, VITE_GA_MEASUREMENT_ID: "" },
  });
  assert.equal(isAnalyticsEnabled(), false);
  resetAnalyticsForTests();
});

test("isAnalyticsEnabled is false when the measurement id is whitespace-only", () => {
  resetAnalyticsForTests({
    env: { PROD: true, VITE_GA_MEASUREMENT_ID: "   " },
  });
  assert.equal(isAnalyticsEnabled(), false);
  resetAnalyticsForTests();
});

test("isAnalyticsEnabled is true when the measurement id is simply unset (uses the fallback)", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  assert.equal(isAnalyticsEnabled(), true);
  resetAnalyticsForTests();
});

// ---------------------------------------------------------------------------
// initAnalytics
// ---------------------------------------------------------------------------

test("initAnalytics is idempotent: two calls inject exactly one script and issue exactly one config call", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  const fakes = installFakes();
  try {
    initAnalytics();
    initAnalytics();

    assert.equal(fakes.scriptElements.length, 1);
    assert.equal(fakes.appendedElements.length, 1);

    const configCalls = fakes.gtagCalls.filter((call) => call[0] === "config");
    assert.equal(configCalls.length, 1);
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("initAnalytics config call includes send_page_view: false and omits debug_mode by default", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  const fakes = installFakes();
  try {
    initAnalytics();

    const configCall = fakes.gtagCalls.find((call) => call[0] === "config");
    assert.ok(configCall);
    const params = configCall[2] as Record<string, unknown>;
    assert.equal(params.send_page_view, false);
    assert.equal("debug_mode" in params, false);
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("initAnalytics config call includes debug_mode: true only when VITE_GA_DEBUG is 'true'", () => {
  resetAnalyticsForTests({ env: { PROD: true, VITE_GA_DEBUG: "true" } });
  const fakes = installFakes();
  try {
    initAnalytics();

    const configCall = fakes.gtagCalls.find((call) => call[0] === "config");
    assert.ok(configCall);
    const params = configCall[2] as Record<string, unknown>;
    assert.equal(params.debug_mode, true);
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("initAnalytics uses the fallback measurement id in the injected script src by default", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  const fakes = installFakes();
  try {
    initAnalytics();
    assert.equal(fakes.scriptElements.length, 1);
    assert.ok(fakes.scriptElements[0]?.src?.includes("G-7VEBP7G8TE"));
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("initAnalytics uses a trimmed custom VITE_GA_MEASUREMENT_ID in the injected script src", () => {
  resetAnalyticsForTests({
    env: { PROD: true, VITE_GA_MEASUREMENT_ID: "  G-CUSTOM123  " },
  });
  const fakes = installFakes();
  try {
    initAnalytics();
    assert.ok(fakes.scriptElements[0]?.src?.includes("G-CUSTOM123"));
    assert.equal(fakes.scriptElements[0]?.src?.includes(" "), false);
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("initAnalytics does nothing when analytics is disabled", () => {
  resetAnalyticsForTests();
  const fakes = installFakes();
  try {
    initAnalytics();
    assert.equal(fakes.scriptElements.length, 0);
    assert.equal(fakes.gtagCalls.length, 0);
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("resetAnalyticsForTests clears the idempotency flags so a fresh initAnalytics call injects again", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  const firstFakes = installFakes();
  initAnalytics();
  assert.equal(firstFakes.scriptElements.length, 1);
  uninstallFakes();

  resetAnalyticsForTests({ env: { PROD: true } });
  const secondFakes = installFakes();
  try {
    initAnalytics();
    assert.equal(secondFakes.scriptElements.length, 1);
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

// ---------------------------------------------------------------------------
// sendEvent
// ---------------------------------------------------------------------------

test("sendEvent records one gtag event call with environment merged in", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  const fakes = installFakes("www.glucose-ml-project.com");
  try {
    sendEvent("page_view", { page_path: "/" });

    const eventCalls = fakes.gtagCalls.filter((call) => call[0] === "event");
    assert.equal(eventCalls.length, 1);
    assert.equal(eventCalls[0]?.[1], "page_view");
    const params = eventCalls[0]?.[2] as Record<string, unknown>;
    assert.equal(params.page_path, "/");
    assert.equal(params.environment, "production");
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("sendEvent strips undefined, null, and empty-string parameters", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  const fakes = installFakes();
  try {
    sendEvent("filter_change", {
      filter_category: "population",
      filter_value: undefined,
      dataset_name: null,
      note: "",
      active_filter_count: 0,
    });

    const eventCalls = fakes.gtagCalls.filter((call) => call[0] === "event");
    assert.equal(eventCalls.length, 1);
    const params = eventCalls[0]?.[2] as Record<string, unknown>;
    assert.equal("filter_value" in params, false);
    assert.equal("dataset_name" in params, false);
    assert.equal("note" in params, false);
    // 0 is a meaningful value, not one of the stripped sentinels.
    assert.equal(params.active_filter_count, 0);
    assert.equal(params.filter_category, "population");
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("sendEvent no-ops without throwing when disabled", () => {
  resetAnalyticsForTests();
  const fakes = installFakes();
  try {
    assert.doesNotThrow(() => sendEvent("page_view", { page_path: "/" }));
    assert.equal(fakes.gtagCalls.length, 0);
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("sendEvent no-ops without throwing when window is undefined", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  uninstallFakes();
  assert.doesNotThrow(() => sendEvent("page_view", { page_path: "/" }));
  resetAnalyticsForTests();
});

test("sendEvent no-ops without throwing when window.gtag is missing", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  const fakes = installFakes();
  try {
    // @ts-expect-error - deliberately deleting gtag to simulate a blocked/unset state
    delete fakes.window.gtag;
    assert.doesNotThrow(() => sendEvent("page_view", { page_path: "/" }));
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});

test("sendEvent no-ops without throwing when gtag itself throws", () => {
  resetAnalyticsForTests({ env: { PROD: true } });
  const fakes = installFakes();
  fakes.window.gtag = () => {
    throw new Error("blocked by an extension");
  };
  try {
    assert.doesNotThrow(() => sendEvent("page_view", { page_path: "/" }));
  } finally {
    uninstallFakes();
    resetAnalyticsForTests();
  }
});
