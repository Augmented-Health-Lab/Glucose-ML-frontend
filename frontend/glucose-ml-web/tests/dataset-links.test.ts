import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type TableDetailRow = {
  name: string;
  "year release"?: string;
  "Link to dataset"?: string;
  "Link to Git"?: string;
};

const tableDetailRows = JSON.parse(
  readFileSync(
    new URL("../public/static_data/table1_detail_data.json", import.meta.url),
    "utf8"
  )
) as TableDetailRow[];

const datasetHeaderTsx = readFileSync(
  new URL("../src/features/dataset-detail/DatasetHeader.tsx", import.meta.url),
  "utf8"
);

function rowFor(name: string): TableDetailRow {
  const row = tableDetailRows.find((item) => item.name === name);
  assert.ok(row, `Expected table1 detail row for ${name}`);
  return row;
}

test("open dataset download links come from Link to Git while original source stays separate", () => {
  const d1namo = rowFor("D1NAMO");

  assert.equal(d1namo["Link to dataset"], "https://zenodo.org/records/5651217");
  assert.equal(
    d1namo["Link to Git"],
    "https://github.com/Augmented-Health-Lab/Glucose-ML-Project/tree/main/3_Glucose-ML-collection/D1NAMO"
  );
  assert.notEqual(d1namo["Link to Git"], d1namo["Link to dataset"]);
});

test("datasets without a Git link do not get a fake download URL", () => {
  const ohio = rowFor("OhioT1DM");

  assert.equal(
    ohio["Link to dataset"],
    "https://webpages.charlotte.edu/rbunescu/data/ohiot1dm/OhioT1DM-dataset.html"
  );
  assert.equal(ohio["Link to Git"], undefined);
});

test("OhioT1DM release year is sourced as 2018", () => {
  const ohio = rowFor("OhioT1DM");

  assert.equal(ohio["year release"], "2018");
});

test("BIGIDEAs original source links to PhysioNet version 1.1.3", () => {
  const bigIdeas = rowFor("BIGIDEAs");

  assert.equal(
    bigIdeas["Link to dataset"],
    "https://physionet.org/content/big-ideas-glycemic-wearable/1.1.3/"
  );
});

test("BIGIDEAs release year is sourced as 2022", () => {
  const bigIdeas = rowFor("BIGIDEAs");

  assert.equal(bigIdeas["year release"], "2022");
});

test("AI-READI request access links to Fairhub dataset 3", () => {
  const aiReadi = rowFor("AI-READI");

  assert.equal(aiReadi["Link to dataset"], "https://fairhub.io/datasets/3");
});

test("detail header uses Git links for downloads and dataset links for source or access", () => {
  assert.match(datasetHeaderTsx, /href=\{dataset\.downloadLink\}/);
  assert.match(datasetHeaderTsx, /href=\{dataset\.datasetLink\}/);
  assert.match(datasetHeaderTsx, /glm-button__download-icon/);
  assert.match(
    datasetHeaderTsx,
    /<button type="button" className="glm-button glm-button-primary" disabled>\s*<span[^>]+className="glm-button__icon glm-button__download-icon"[^>]*\/>\s*Download dataset\s*<\/button>/
  );
  assert.doesNotMatch(datasetHeaderTsx, /Dataset not available/);
});
