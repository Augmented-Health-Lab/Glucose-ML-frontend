import assert from "node:assert/strict";
import test from "node:test";

import {
  ROUTE_TYPES,
  ERROR_CATEGORIES,
  getRouteType,
  normalizePagePath,
  getDatasetNameFromPath,
  getEnvironment,
  boundedCount,
  serializeDatasetCombination,
  getDestinationHost,
  categorizeLoadError,
} from "../src/analytics/params.ts";

// ---------------------------------------------------------------------------
// getRouteType
// ---------------------------------------------------------------------------

test("getRouteType maps every known route to its route type", () => {
  assert.equal(getRouteType("/"), "home");
  assert.equal(getRouteType("/background"), "background");
  assert.equal(getRouteType("/about"), "about");
  assert.equal(getRouteType("/dataset/CGMacros"), "dataset_detail");
  assert.equal(getRouteType("/compare"), "compare");
  assert.equal(getRouteType("/anything-else"), "other");
});

test("getRouteType tolerates a trailing slash on fixed routes", () => {
  assert.equal(getRouteType("/about/"), "about");
  assert.equal(getRouteType("/compare/"), "compare");
  assert.equal(getRouteType("/background/"), "background");
});

test("getRouteType does not classify a dataset path with no id as dataset_detail", () => {
  assert.equal(getRouteType("/dataset/"), "other");
  assert.notEqual(getRouteType("/dataset"), "dataset_detail");
});

test("ROUTE_TYPES is the exhaustive domain for RouteType", () => {
  assert.deepEqual(ROUTE_TYPES, [
    "home",
    "background",
    "about",
    "dataset_detail",
    "compare",
    "other",
  ]);
});

// ---------------------------------------------------------------------------
// normalizePagePath
// ---------------------------------------------------------------------------

test("normalizePagePath strips query string and hash", () => {
  assert.equal(normalizePagePath("/compare?datasets=A,B#top"), "/compare");
});

test("normalizePagePath decodes the dataset name in a dataset-detail path", () => {
  assert.equal(
    normalizePagePath("/dataset/CGMacros%20Dexcom"),
    "/dataset/CGMacros Dexcom"
  );
});

test("normalizePagePath normalizes a trailing slash to the canonical path", () => {
  assert.equal(normalizePagePath("/"), "/");
  assert.equal(normalizePagePath("/about/"), "/about");
});

// ---------------------------------------------------------------------------
// getDatasetNameFromPath
// ---------------------------------------------------------------------------

test("getDatasetNameFromPath decodes the dataset id", () => {
  assert.equal(
    getDatasetNameFromPath("/dataset/CGMacros%20Dexcom"),
    "CGMacros Dexcom"
  );
});

test("getDatasetNameFromPath returns undefined for every non-dataset route", () => {
  assert.equal(getDatasetNameFromPath("/"), undefined);
  assert.equal(getDatasetNameFromPath("/about"), undefined);
  assert.equal(getDatasetNameFromPath("/background"), undefined);
  assert.equal(getDatasetNameFromPath("/compare"), undefined);
  assert.equal(getDatasetNameFromPath("/anything-else"), undefined);
  assert.equal(getDatasetNameFromPath("/dataset/"), undefined);
});

test("getDatasetNameFromPath returns undefined instead of throwing on a malformed percent-escape", () => {
  assert.doesNotThrow(() => getDatasetNameFromPath("/dataset/%E0%A4%A"));
  assert.equal(getDatasetNameFromPath("/dataset/%E0%A4%A"), undefined);
});

// ---------------------------------------------------------------------------
// getEnvironment
// ---------------------------------------------------------------------------

test("getEnvironment classifies production hosts", () => {
  assert.equal(getEnvironment("www.glucose-ml-project.com"), "production");
  assert.equal(getEnvironment("glucose-ml-project.com"), "production");
});

test("getEnvironment classifies any *.vercel.app host as preview", () => {
  assert.equal(getEnvironment("glucose-ml-web-git-main.vercel.app"), "preview");
  assert.equal(getEnvironment("some-branch-123.vercel.app"), "preview");
});

test("getEnvironment classifies local hosts as development", () => {
  assert.equal(getEnvironment("localhost"), "development");
  assert.equal(getEnvironment("127.0.0.1"), "development");
});

test("getEnvironment classifies an unknown host as preview", () => {
  assert.equal(getEnvironment("example.com"), "preview");
});

// ---------------------------------------------------------------------------
// boundedCount
// ---------------------------------------------------------------------------

test("boundedCount clamps to the 0..999 range", () => {
  assert.equal(boundedCount(1500), 999);
  assert.equal(boundedCount(999), 999);
  assert.equal(boundedCount(1000), 999);
  assert.equal(boundedCount(0), 0);
});

test("boundedCount floors non-integers", () => {
  assert.equal(boundedCount(5.7), 5);
  assert.equal(boundedCount(0.9), 0);
});

test("boundedCount returns 0 for NaN, negative, or non-finite input", () => {
  assert.equal(boundedCount(Number.NaN), 0);
  assert.equal(boundedCount(-5), 0);
  assert.equal(boundedCount(Number.POSITIVE_INFINITY), 0);
  assert.equal(boundedCount(Number.NEGATIVE_INFINITY), 0);
});

// ---------------------------------------------------------------------------
// serializeDatasetCombination
// ---------------------------------------------------------------------------

test("serializeDatasetCombination sorts case-insensitively regardless of input order", () => {
  assert.equal(
    serializeDatasetCombination(["Park 2025", "CGMacros"]),
    "CGMacros|Park 2025"
  );
  assert.equal(
    serializeDatasetCombination(["CGMacros", "Park 2025"]),
    "CGMacros|Park 2025"
  );
});

test("serializeDatasetCombination de-duplicates names", () => {
  assert.equal(
    serializeDatasetCombination(["CGMacros", "CGMacros", "Park 2025"]),
    "CGMacros|Park 2025"
  );
});

test("serializeDatasetCombination de-duplicates case-insensitively and preserves first-seen casing", () => {
  // ["CGMacros", "cgmacros"] should deduplicate to one entry, preserving "CGMacros"
  assert.equal(
    serializeDatasetCombination(["CGMacros", "cgmacros"]),
    "CGMacros"
  );
  // Reverse order: ["cgmacros", "CGMacros"] should deduplicate to one entry, preserving "cgmacros"
  assert.equal(
    serializeDatasetCombination(["cgmacros", "CGMacros"]),
    "cgmacros"
  );
  // Mixed case with other datasets
  assert.equal(
    serializeDatasetCombination(["Park 2025", "CGMacros", "cgmacros", "park 2025"]),
    "CGMacros|Park 2025"
  );
});

test("serializeDatasetCombination truncates the result to 100 characters", () => {
  const names = Array.from({ length: 20 }, (_, i) => `Dataset Name Number ${i}`);
  const result = serializeDatasetCombination(names);
  assert.ok(result.length <= 100);
});

// ---------------------------------------------------------------------------
// getDestinationHost
// ---------------------------------------------------------------------------

test("getDestinationHost returns the hostname only, never a path", () => {
  const result = getDestinationHost("https://github.com/x/y");
  assert.equal(result, "github.com");
  assert.ok(!result?.includes("/"));
});

test("getDestinationHost returns undefined for a relative path", () => {
  assert.equal(getDestinationHost("/x/y"), undefined);
});

test("getDestinationHost returns undefined for an empty string", () => {
  assert.equal(getDestinationHost(""), undefined);
});

test("getDestinationHost returns undefined for an unparseable URL", () => {
  assert.equal(getDestinationHost("not a url"), undefined);
});

// ---------------------------------------------------------------------------
// categorizeLoadError
// ---------------------------------------------------------------------------

test("categorizeLoadError classifies network errors", () => {
  assert.equal(categorizeLoadError(new Error("Network request failed")), "network");
  assert.equal(categorizeLoadError(new Error("fetch failed for resource")), "network");
  assert.equal(categorizeLoadError(new Error("load failed")), "network");
});

test("categorizeLoadError classifies not-found errors", () => {
  assert.equal(categorizeLoadError(new Error("Request failed with status 404")), "not_found");
  assert.equal(categorizeLoadError(new Error("Dataset not found")), "not_found");
});

test("categorizeLoadError classifies parse errors", () => {
  assert.equal(categorizeLoadError(new Error("Unexpected token < in JSON at position 0")), "parse");
  assert.equal(categorizeLoadError(new Error("Failed to parse response")), "parse");
});

test("categorizeLoadError classifies missing-data errors", () => {
  assert.equal(categorizeLoadError(new Error("missing data for series 12345")), "missing_data");
});

test("categorizeLoadError classifies anything else, including non-Error values, as unknown", () => {
  assert.equal(categorizeLoadError(new Error("something unexpected happened")), "unknown");
  assert.equal(categorizeLoadError("a plain string"), "unknown");
  assert.equal(categorizeLoadError(null), "unknown");
  assert.equal(categorizeLoadError(undefined), "unknown");
  assert.equal(categorizeLoadError({ message: "not a real Error" }), "unknown");
});

test("categorizeLoadError returns unknown when error.message getter throws", () => {
  const errorWithThrowingGetter = Object.create(Error.prototype);
  Object.defineProperty(errorWithThrowingGetter, "message", {
    get() {
      throw new Error("getter threw");
    },
  });
  assert.equal(categorizeLoadError(errorWithThrowingGetter), "unknown");
});

test("categorizeLoadError always returns one of the five fixed categories", () => {
  assert.deepEqual(ERROR_CATEGORIES, [
    "network",
    "not_found",
    "parse",
    "missing_data",
    "unknown",
  ]);

  const messages = [
    "Network request failed",
    "404 not found",
    "Unexpected token in JSON",
    "missing data",
    "totally different failure",
  ];

  for (const message of messages) {
    const category = categorizeLoadError(new Error(message));
    assert.ok(
      (ERROR_CATEGORIES as readonly string[]).includes(category),
      `expected ${category} to be one of the fixed categories`
    );
  }
});

test("categorizeLoadError never lets a substring of the original message escape into the category", () => {
  const sensitiveMessage =
    "SyntaxError: Unexpected token < in JSON at position 0 while loading record for patient leoding101@gmail.com (MRN 88213412)";
  const category = categorizeLoadError(new Error(sensitiveMessage));

  assert.equal(category, "parse");
  assert.ok(!category.includes("leoding101@gmail.com"));
  assert.ok(!category.includes("88213412"));
  assert.ok(!category.includes("SyntaxError"));
});
