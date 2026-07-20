/**
 * Cross-cutting instrumentation contract test.
 *
 * The per-screen contract tests (`home-instrumentation-contract.test.ts`,
 * `compare-instrumentation-contract.test.ts`,
 * `dataset-detail-instrumentation-contract.test.ts`,
 * `background-instrumentation-contract.test.ts`) each pin the detailed
 * call-site behavior for their own screen. This test's job is the invariants
 * that only a repo-wide sweep can check:
 *
 *   - no file under `src/features/` or `src/components/` ever reaches GA4
 *     through anything other than the `src/analytics` public barrel (no raw
 *     `window.gtag`/`dataLayer` access, no direct `sendEvent` import);
 *   - every screen that Tasks 5-7 instrumented actually imports its
 *     analytics helpers from the barrel and calls the expected helper name
 *     somewhere in its source;
 *   - two specific structural regressions the plan calls out by name stay
 *     fixed: `DatasetHeader.tsx`'s outbound-link handlers never gained a
 *     `preventDefault`, and `FilterBar.tsx`'s clear button never regressed
 *     back to looping `onFilterChange` per category.
 *
 * It deliberately does not re-assert ordering, exact parameter shapes, or
 * other call-site detail already covered by the per-screen tests above.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readSource(relativePath: string): string {
  return readFileSync(path.join(appRoot, relativePath), "utf8");
}

function listSourceFiles(relativeDir: string): string[] {
  const dir = path.join(appRoot, relativeDir);
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

// ---------------------------------------------------------------------------
// Repo-wide sweep: no feature/component file reaches GA4 except through the
// `src/analytics` barrel.
// ---------------------------------------------------------------------------

test("no file under src/features/ or src/components/ references window.gtag, dataLayer, or imports sendEvent", () => {
  const files = [...listSourceFiles("src/features"), ...listSourceFiles("src/components")];
  assert.ok(files.length > 0, "expected to find feature/component source files");

  const violations: string[] = [];
  for (const filename of files) {
    const source = readFileSync(filename, "utf8");
    const relative = path.relative(appRoot, filename);

    if (/window\.gtag/.test(source)) {
      violations.push(`${relative}: references window.gtag`);
    }
    if (/\bdataLayer\b/.test(source)) {
      violations.push(`${relative}: references dataLayer`);
    }
    if (/\bsendEvent\b/.test(source)) {
      violations.push(`${relative}: imports/uses sendEvent`);
    }
    // Any import that reaches into the analytics module's internals
    // (gtag.ts, events.ts, params.ts) rather than the public barrel
    // (`analytics` or `analytics/index`) is also a violation.
    for (const match of source.matchAll(/from\s+["']([^"']*analytics[^"']*)["']/g)) {
      const specifier = match[1];
      if (/analytics\/(gtag|events|params|scroll-depth|AnalyticsRouteTracker)(\.tsx?)?$/.test(specifier)) {
        violations.push(`${relative}: imports analytics internals directly (${specifier})`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

// ---------------------------------------------------------------------------
// Instrumented files: barrel import + expected helper present.
// ---------------------------------------------------------------------------

const INSTRUMENTED_FILES: Array<{ file: string; helpers: string[] }> = [
  {
    file: "src/features/home/HomePage.tsx",
    helpers: [
      "trackFilterChange",
      "trackFilterClear",
      "trackCompareSelectionChange",
      "trackGuideOpen",
      "trackGuideClose",
      "trackContentLoadError",
    ],
  },
  { file: "src/features/home/DatasetCard.tsx", helpers: ["trackDatasetOpen"] },
  { file: "src/features/home/CompareBar.tsx", helpers: ["trackCompareStart"] },
  {
    file: "src/features/compare/CompareTable.tsx",
    helpers: ["trackDatasetOpen", "trackCompareSectionToggle"],
  },
  {
    file: "src/features/compare/ComparePage.tsx",
    helpers: ["trackCompareSelectionChange", "trackGuideOpen", "trackGuideClose", "trackContentLoadError"],
  },
  { file: "src/features/dataset-detail/CGMDataSection.tsx", helpers: ["trackDetailViewChange"] },
  { file: "src/features/dataset-detail/DatasetHeader.tsx", helpers: ["trackDatasetAction"] },
  { file: "src/features/dataset-detail/DatasetDetail.tsx", helpers: ["trackContentLoadError"] },
  { file: "src/features/background/BackgroundPage.tsx", helpers: ["trackContentLoadError"] },
];

for (const { file, helpers } of INSTRUMENTED_FILES) {
  test(`${file} imports its analytics helpers from the barrel and calls ${helpers.join(", ")}`, () => {
    const source = readSource(file);

    assert.match(
      source,
      /from\s+["'](?:\.\.\/)+analytics["']/,
      `${file} must import from the analytics barrel`
    );
    assert.doesNotMatch(source, /window\.gtag/, `${file} must never touch window.gtag`);
    assert.doesNotMatch(source, /\bdataLayer\b/, `${file} must never touch dataLayer`);

    for (const helper of helpers) {
      // Must appear both in the import list and as a call.
      assert.match(
        source,
        new RegExp(`\\b${helper}\\b`),
        `${file} must reference ${helper}`
      );
      assert.match(
        source,
        new RegExp(`${helper}\\(`),
        `${file} must call ${helper}(...)`
      );
    }
  });
}

// ---------------------------------------------------------------------------
// DatasetHeader: outbound-link handlers never call preventDefault.
// ---------------------------------------------------------------------------

test("DatasetHeader.tsx's outbound-link handlers contain no preventDefault", () => {
  const source = readSource("src/features/dataset-detail/DatasetHeader.tsx");
  assert.doesNotMatch(source, /preventDefault/);
});

// ---------------------------------------------------------------------------
// FilterBar: dedicated onClearFilters prop, no per-category onFilterChange loop.
// ---------------------------------------------------------------------------

test("FilterBar.tsx exposes onClearFilters and its clear button no longer loops onFilterChange", () => {
  const source = readSource("src/features/home/FilterBar.tsx");

  assert.match(source, /onClearFilters:\s*\(\)\s*=>\s*void/, "FilterBar must declare an onClearFilters prop");
  assert.match(source, /onClick=\{onClearFilters\}/, "the clear button must invoke onClearFilters directly");

  // No loop over filter labels re-invoking onFilterChange per category.
  assert.doesNotMatch(source, /forEach\(\s*\(label\)\s*=>\s*onFilterChange/);
  assert.doesNotMatch(source, /FILTERS\.forEach/);
  assert.doesNotMatch(source, /\.map\([^)]*=>\s*onFilterChange/);
});
