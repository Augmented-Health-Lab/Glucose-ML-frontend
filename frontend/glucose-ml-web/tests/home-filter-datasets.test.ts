import assert from "node:assert/strict";
import test from "node:test";

import { filterDatasets } from "../src/features/home/filter-datasets.ts";
import type { HomeDataset } from "../src/types/dataset.ts";

// Fixture datasets deliberately span every filter category's branches:
// - dsA: CGM + Insulin sources, T1D, 10 days, 25 participants, Open access
// - dsB: Wearable source, T2D, 20 days, 60 participants, Controlled access
// - dsC: CGM + Manual sources, T1D + T2D, days "TBD", 150 participants, Open access
// - dsD: Questionnaire + Clinical sources, Non diabetic, 90 days, 1200 participants, Controlled access
const dsA: HomeDataset = {
  title: "Dataset A",
  participants: 25,
  days: 10,
  access: "Open",
  description: "fixture A",
  types: ["T1D"],
  sources: ["G", "I"],
};

const dsB: HomeDataset = {
  title: "Dataset B",
  participants: 60,
  days: 20,
  access: "Controlled",
  description: "fixture B",
  types: ["T2D"],
  sources: ["W"],
};

const dsC: HomeDataset = {
  title: "Dataset C",
  participants: 150,
  days: "TBD",
  access: "Open",
  description: "fixture C",
  types: ["T1D", "T2D"],
  sources: ["G", "M"],
};

const dsD: HomeDataset = {
  title: "Dataset D",
  participants: 1200,
  days: 90,
  access: "Controlled",
  description: "fixture D",
  types: ["Non diabetic"],
  sources: ["Q", "C"],
};

const datasets: HomeDataset[] = [dsA, dsB, dsC, dsD];

function titles(results: HomeDataset[]): string[] {
  return results.map((d) => d.title).sort();
}

test("empty selection object returns every dataset", () => {
  assert.deepEqual(titles(filterDatasets(datasets, {})), titles(datasets));
});

test("selections whose arrays are all empty return every dataset", () => {
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Data Sources": [], Population: [] })),
    titles(datasets)
  );
});

test("Data Sources filters by source letter membership", () => {
  assert.deepEqual(
    titles(
      filterDatasets(datasets, {
        "Data Sources": ["Continuous Glucose Monitor (CGM)"],
      })
    ),
    titles([dsA, dsC])
  );
});

test("Data Sources multi-select within a category requires every selected source (AND)", () => {
  assert.deepEqual(
    titles(
      filterDatasets(datasets, {
        "Data Sources": [
          "Continuous Glucose Monitor (CGM)",
          "Insulin Delivery System",
        ],
      })
    ),
    titles([dsA])
  );
});

test("Population filters by diabetes type membership", () => {
  assert.deepEqual(
    titles(filterDatasets(datasets, { Population: ["T1D"] })),
    titles([dsA, dsC])
  );
});

test("Population multi-select within a category requires every selected type (AND)", () => {
  assert.deepEqual(
    titles(filterDatasets(datasets, { Population: ["T1D", "T2D"] })),
    titles([dsC])
  );
});

test("Study duration filters by minimum day thresholds and excludes TBD", () => {
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Study duration": ["7+ days"] })),
    titles([dsA, dsB, dsD])
  );
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Study duration": ["14+ days"] })),
    titles([dsB, dsD])
  );
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Study duration": ["1 month"] })),
    titles([dsD])
  );
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Study duration": ["2+ months"] })),
    titles([dsD])
  );
});

test("Sample size filters by minimum participant thresholds", () => {
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Sample size": ["20+"] })),
    titles([dsA, dsB, dsC, dsD])
  );
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Sample size": ["50+"] })),
    titles([dsB, dsC, dsD])
  );
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Sample size": ["100+"] })),
    titles([dsC, dsD])
  );
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Sample size": ["500+"] })),
    titles([dsD])
  );
  assert.deepEqual(
    titles(filterDatasets(datasets, { "Sample size": ["1000+"] })),
    titles([dsD])
  );
});

test("Access filters by exact access value", () => {
  assert.deepEqual(
    titles(filterDatasets(datasets, { Access: ["Open"] })),
    titles([dsA, dsC])
  );
  assert.deepEqual(
    titles(filterDatasets(datasets, { Access: ["Controlled"] })),
    titles([dsB, dsD])
  );
});

test("selections across categories combine with AND", () => {
  assert.deepEqual(
    titles(
      filterDatasets(datasets, {
        Population: ["T1D"],
        "Sample size": ["100+"],
      })
    ),
    titles([dsC])
  );
});

test("does not mutate the datasets array, the filterSelections object, or their nested arrays", () => {
  const datasetsCopy = datasets.map((d) => ({ ...d }));
  Object.freeze(datasetsCopy);
  for (const dataset of datasetsCopy) {
    Object.freeze(dataset.types);
    Object.freeze(dataset.sources);
  }

  const filterSelections = { "Data Sources": ["Continuous Glucose Monitor (CGM)"] };
  Object.freeze(filterSelections["Data Sources"]);
  Object.freeze(filterSelections);

  assert.doesNotThrow(() => filterDatasets(datasetsCopy, filterSelections));
});
