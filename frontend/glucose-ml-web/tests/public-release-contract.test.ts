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

const approvedParticipantChart = "background_cgm_chart.json";
const aggregateStaticData = allowedStaticData.filter(
  (filename) => filename !== approvedParticipantChart
);

const approvedParticipantSeries = [
  { key: "t1d", dataset: "AZT1D", subject: "Subject 11", date: "2024-01-10" },
  { key: "t2d", dataset: "CGMacros", subject: "012", date: "2023-03-02" },
  { key: "pred", dataset: "CGMacros", subject: "044", date: "2022-10-19" },
  { key: "nd", dataset: "CGMacros", subject: "034", date: "2022-03-03" },
] as const;

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
  ]) {
    assert.equal(existsSync(path.join(repositoryRoot, name)), false, name);
  }
});

test("root docs contain only Superpowers plans and specs", () => {
  const docsRoot = path.join(repositoryRoot, "docs");
  const unexpected = readdirSync(docsRoot, {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(docsRoot, path.join(entry.parentPath, entry.name))
    )
    .filter(
      (filename) =>
        !/^superpowers\/(?:plans|specs)\/[a-z0-9-]+\.md$/.test(filename)
    );

  assert.deepEqual(unexpected, []);
});

test("public static data uses an explicit aggregate-data manifest", () => {
  assert.deepEqual(readdirSync(staticDataRoot).sort(), allowedStaticData.sort());
});

test("public static data excludes participant-record field names", () => {
  const findings = aggregateStaticData.flatMap((filename) => {
    const value = JSON.parse(
      readFileSync(path.join(staticDataRoot, filename), "utf8")
    );
    return findProhibitedKeys(value).map((location) => `${filename}:${location}`);
  });

  assert.deepEqual(findings, []);
});

test("background chart contains only the explicitly approved participant-day exception", () => {
  const chart = JSON.parse(
    readFileSync(path.join(staticDataRoot, approvedParticipantChart), "utf8")
  ) as {
    series: Array<{
      key: string;
      dataset: string;
      subject: string;
      date: string;
      points: Array<{ hour: number; glucose: number }>;
    }>;
  };

  assert.deepEqual(
    chart.series.map(({ key, dataset, subject, date }) => ({
      key,
      dataset,
      subject,
      date,
    })),
    approvedParticipantSeries
  );

  for (const series of chart.series) {
    assert.deepEqual(
      Object.keys(series).sort(),
      ["dataset", "date", "key", "points", "subject"]
    );
    for (const [index, point] of series.points.entries()) {
      assert.deepEqual(Object.keys(point).sort(), ["glucose", "hour"]);
      assert.equal(typeof point.hour, "number");
      assert.equal(typeof point.glucose, "number");
      assert.ok(Number.isFinite(point.hour));
      assert.ok(Number.isFinite(point.glucose));
      assert.ok(point.hour >= 0 && point.hour < 24);
      if (index > 0) {
        assert.ok(point.hour >= series.points[index - 1].hour);
      }
    }
  }

  const serialized = JSON.stringify(chart);
  assert.doesNotMatch(
    serialized,
    /"(?:person_id|subject_id|timestamp|glucose_value_mg_dl)"\s*:/i
  );
});

test("public source permits approved subject labels only in the chart module", () => {
  const sourceFiles = readdirSync(path.join(appRoot, "src"), {
    recursive: true,
    withFileTypes: true,
  }).filter((entry) => entry.isFile() && /\.(?:css|ts|tsx)$/.test(entry.name));

  const chartModule = path.normalize(
    path.join(appRoot, "src/features/background/background-cgm-chart.ts")
  );
  const findings = sourceFiles.flatMap((entry) => {
    const filename = path.join(entry.parentPath, entry.name);
    const source = readFileSync(filename, "utf8");
    const containsLocalPath = /\/Users\/|\/home\/[^\s"'/]+\//.test(source);
    const containsSubjectLabel = /Subject\s+\d+|CGMacros:\s*\d+/.test(
      source
    );
    const hasUnexpectedSubjectLabel =
      containsSubjectLabel && path.normalize(filename) !== chartModule;
    return containsLocalPath || hasUnexpectedSubjectLabel
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
