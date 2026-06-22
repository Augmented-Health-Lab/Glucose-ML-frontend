import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type PopulationGroup = {
  type: string;
  count: number | null;
};

type TableDetailRow = {
  name: string;
  total: number;
  populationGroups?: PopulationGroup[];
};

type DatasetCardInfo = {
  title: string;
  populationGroups?: PopulationGroup[];
};

type HomeDataset = {
  title: string;
};

const homepageRows = JSON.parse(
  readFileSync(
    new URL("../public/static_data/homepage_data.json", import.meta.url),
    "utf8"
  )
) as HomeDataset[];

const datasetCardRows = JSON.parse(
  readFileSync(
    new URL("../public/static_data/dataset_card_info.json", import.meta.url),
    "utf8"
  )
) as DatasetCardInfo[];

const tableDetailRows = JSON.parse(
  readFileSync(
    new URL("../public/static_data/table1_detail_data.json", import.meta.url),
    "utf8"
  )
) as TableDetailRow[];

const timeInRangesByType = JSON.parse(
  readFileSync(
    new URL("../public/static_data/time_in_ranges_by_type.json", import.meta.url),
    "utf8"
  )
) as Record<string, Record<string, unknown>>;

function normalizeDatasetName(name: string): string {
  return name.replace(/[\s_-]+/g, "").toLowerCase();
}

test("homepage datasets have matching detail card rows", () => {
  const cardTitles = new Set(
    datasetCardRows.map((row) => normalizeDatasetName(row.title))
  );

  const missingCardRows = homepageRows
    .map((row) => row.title)
    .filter((title) => !cardTitles.has(normalizeDatasetName(title)));

  assert.deepEqual(missingCardRows, []);
});

test("T1DEXI participant population matches the T1D-only source cohort", () => {
  const t1dexi = tableDetailRows.find((row) => row.name === "T1DEXI");
  const t1dexiCard = datasetCardRows.find((row) => row.title === "T1DEXI");

  assert.ok(t1dexi);
  assert.ok(t1dexiCard);
  assert.equal(t1dexi.total, 497);
  assert.deepEqual(t1dexi.populationGroups, [{ type: "T1D", count: 497 }]);
  assert.deepEqual(t1dexiCard.populationGroups, [{ type: "T1D", count: 497 }]);
});

test("T1DEXI time-in-range groups are present in participant population groups", () => {
  const t1dexi = tableDetailRows.find((row) => row.name === "T1DEXI");

  assert.ok(t1dexi?.populationGroups);

  const participantGroups = new Set(
    t1dexi.populationGroups.map((group) => group.type)
  );
  const timeInRangeGroups = Object.keys(timeInRangesByType.T1DEXI ?? {});

  assert.deepEqual(
    timeInRangeGroups.filter((group) => !participantGroups.has(group)),
    []
  );
});

test("PhysioCGM participant population matches the T1D source cohort", () => {
  const physioCgm = tableDetailRows.find((row) => row.name === "PhysioCGM");
  const physioCgmCard = datasetCardRows.find((row) => row.title === "PhysioCGM");

  assert.ok(physioCgm);
  assert.ok(physioCgmCard);
  assert.equal(physioCgm.total, 10);
  assert.deepEqual(physioCgm.populationGroups, [{ type: "T1D", count: 10 }]);
  assert.deepEqual(physioCgmCard.populationGroups, [{ type: "T1D", count: 10 }]);
});
