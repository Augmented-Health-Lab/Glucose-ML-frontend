import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = path.resolve(appRoot, "../..");
const staticDataRoot = path.join(appRoot, "public/static_data");

const allowedStaticData = [
  "all-projects-histogram_data_fixed.json",
  "background_cgm_chart.json",
  "data_source_map.json",
  "dataset_card_glucose_distribution.json",
  "dataset_card_info.json",
  "dataset_details.json",
  "homepage_data.json",
  "publication_references.json",
  "table1_detail_data.json",
  "time_in_ranges_by_type.json",
];

const prohibitedRecordKeys = new Set([
  "person_id",
  "subject",
  "subject_id",
  "timestamp",
  "glucose_value_mg_dl",
]);

const findProhibitedKeys = (value: unknown, location = "$"): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findProhibitedKeys(item, `${location}[${index}]`)
    );
  }

  if (!value || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const childLocation = `${location}.${key}`;
    return [
      ...(prohibitedRecordKeys.has(key) ? [childLocation] : []),
      ...findProhibitedKeys(child, childLocation),
    ];
  });
};

test("public repository excludes private and research-source directories", () => {
  for (const name of [
    "Glucose-ML-collection",
    "Auto-scripts",
    "harmonize-CGM-datasets",
    "backend",
    "Figures",
    "Tables",
    "AGENTS.md",
    "CLAUDE.md",
    "PLAN.md",
    ".claude",
    "docs",
  ]) {
    assert.equal(existsSync(path.join(repositoryRoot, name)), false, name);
  }
});

test("public static data uses an explicit aggregate-data manifest", () => {
  assert.deepEqual(readdirSync(staticDataRoot).sort(), allowedStaticData.sort());
});

test("public static data excludes participant-record field names", () => {
  const findings = allowedStaticData.flatMap((filename) => {
    const value = JSON.parse(
      readFileSync(path.join(staticDataRoot, filename), "utf8")
    );
    return findProhibitedKeys(value).map((location) => `${filename}:${location}`);
  });

  assert.deepEqual(findings, []);
});

test("public source excludes copied subject labels and local paths", () => {
  const sourceFiles = readdirSync(path.join(appRoot, "src"), {
    recursive: true,
    withFileTypes: true,
  }).filter((entry) => entry.isFile() && /\.(?:css|ts|tsx)$/.test(entry.name));

  const findings = sourceFiles.flatMap((entry) => {
    const filename = path.join(entry.parentPath, entry.name);
    const source = readFileSync(filename, "utf8");
    return /Subject\s+\d+|CGMacros:\s*\d+|\/Users\/|\/home\/[^\s"'/]+\//.test(
      source
    )
      ? [path.relative(appRoot, filename)]
      : [];
  });

  assert.deepEqual(findings, []);
});

test("all literal public asset references resolve", () => {
  const sourceFiles = readdirSync(path.join(appRoot, "src"), {
    recursive: true,
    withFileTypes: true,
  }).filter((entry) => entry.isFile() && /\.(?:css|ts|tsx)$/.test(entry.name));

  const missing: string[] = [];
  for (const entry of sourceFiles) {
    const filename = path.join(entry.parentPath, entry.name);
    const source = readFileSync(filename, "utf8");
    for (const match of source.matchAll(
      /["'(](\/?(?:figma-assets|static_data)\/[A-Za-z0-9_.\-/]+)/g
    )) {
      const assetPath = match[1].replace(/^\//, "");
      if (!existsSync(path.join(appRoot, "public", assetPath))) {
        missing.push(`${path.relative(appRoot, filename)} -> ${assetPath}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});
