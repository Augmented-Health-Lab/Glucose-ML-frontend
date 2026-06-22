import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const populationTsx = readFileSync(
  new URL("../src/features/dataset-detail/PopulationSection.tsx", import.meta.url),
  "utf8"
);
const demographicsTsx = readFileSync(
  new URL("../src/features/dataset-detail/DemographicsSection.tsx", import.meta.url),
  "utf8"
);
const ethnicityFormatTs = readFileSync(
  new URL(
    "../src/features/dataset-detail/ethnicity-format.ts",
    import.meta.url
  ),
  "utf8"
);
const dataSourcesTsx = readFileSync(
  new URL("../src/features/dataset-detail/DataSourcesSection.tsx", import.meta.url),
  "utf8"
);
const datasetDetailTsx = readFileSync(
  new URL("../src/features/dataset-detail/DatasetDetail.tsx", import.meta.url),
  "utf8"
);

test("participant groups render as ordered detail rows without population badges", () => {
  assert.match(
    populationTsx,
    /const populationGroupOrder = \["T1D", "T2D", "PreD", "ND"\]/
  );
  assert.match(populationTsx, /T1D: "Type 1 diabetes"/);
  assert.match(populationTsx, /T2D: "Type 2 diabetes"/);
  assert.match(populationTsx, /PreD: "Prediabetes"/);
  assert.match(populationTsx, /ND: "No diabetes"/);
  assert.doesNotMatch(populationTsx, /RoundIcon/);
  assert.match(populationTsx, />Population</);
  assert.match(populationTsx, /className="detail-card__info"/);
  assert.match(populationTsx, /\$\{count\.toLocaleString\("en-US"\)\} participants/);
});

test("demographics follow the Figma order and report missing values explicitly", () => {
  const genderIndex = demographicsTsx.indexOf(">Gender<");
  const ageRangeIndex = demographicsTsx.indexOf(">Age range<");
  const ethnicitiesIndex = demographicsTsx.indexOf(">Ethnicities<");

  assert.ok(genderIndex >= 0);
  assert.ok(ageRangeIndex > genderIndex);
  assert.ok(ethnicitiesIndex > ageRangeIndex);
  assert.match(demographicsTsx, /NOT_REPORTED/);
  assert.match(demographicsTsx, /formatEthnicityLines/);
  assert.match(ethnicityFormatTs, /export const NOT_REPORTED = "Not reported"/);
  assert.match(ethnicityFormatTs, /\.replace\(/);
  assert.match(demographicsTsx, /className="detail-card__value-line"/);
  assert.doesNotMatch(demographicsTsx, /<span className="empty-value">-<\/span>/);
});

test("data sources use Figma label casing and show Not reported for missing details", () => {
  assert.match(
    dataSourcesTsx,
    /const sourceOrder = \["Insulin", "CGM", "Manual logs", "Wearable tracker"\]/
  );
  assert.match(dataSourcesTsx, /const NOT_REPORTED = "Not reported"/);
  assert.match(
    dataSourcesTsx,
    /const missingSourceValues = new Set\(\["", "-", "nr", "nah", "n\/a", "nan"\]\)/
  );
  assert.match(dataSourcesTsx, /\{detailText \|\| NOT_REPORTED\}/);
});

test("the CGM data source displays the dataset device instead of the generic glucose description", () => {
  assert.match(
    datasetDetailTsx,
    /mapSourceLetter\(\s*letter,\s*letter\.toUpperCase\(\) === "G" \? cgmDevice : String\(detail\)\s*\)/
  );
});
