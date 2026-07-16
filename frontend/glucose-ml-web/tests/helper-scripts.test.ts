import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

type DatasetCard = { title: string };

const moduleUrl = new URL("../src/utils/helper-scripts.ts", import.meta.url);
const expectedFolders: Record<string, string> = {
  "Hall 2018": "Hall_2018",
  D1NAMO: "D1NAMO",
  "Colas 2019": "Colas_2019",
  OhioT1DM: "OhioT1DM",
  T1DEXI: "T1DEXI",
  T1DEXIP: "T1DEXIP",
  BIGIDEAs: "BIGIDEAs",
  DiaTrend: "DiaTrend",
  ShanghaiT1DM: "ShanghaiT1DM",
  ShanghaiT2DM: "ShanghaiT2DM",
  T1DiabetesGranada: "T1DiabetesGranada",
  "AI-READI": "AI-READI",
  UCHTT1DM: "UCHTT1DM",
  "HUPA-UCM": "HUPA-UCM",
  "CGMacros Dexcom": "CGMacros_Dexcom",
  "CGMacros Libre": "CGMacros_Libre",
  "T1D-UOM": "T1D-UOM",
  "Bris-T1D Open": "Bris-T1D_Open",
  AZT1D: "AZT1D",
  Park2025: "Park_2025",
  PhysioCGM: "PhysioCGM",
};

test("every current dataset card resolves to its helper scripts folder", async () => {
  assert.ok(existsSync(fileURLToPath(moduleUrl)), "Expected helper scripts utility");
  const { getHelperScriptsUrl } = await import(moduleUrl.href);
  const cards = JSON.parse(
    readFileSync(
      new URL("../public/static_data/dataset_card_info.json", import.meta.url),
      "utf8"
    )
  ) as DatasetCard[];

  assert.deepEqual(
    cards.map(({ title }) => title).toSorted(),
    Object.keys(expectedFolders).toSorted()
  );

  for (const [datasetTitle, folder] of Object.entries(expectedFolders)) {
    assert.equal(
      getHelperScriptsUrl(datasetTitle),
      `https://github.com/Augmented-Health-Lab/Glucose-ML-Project/tree/main/2_Harmonize-cgm-datasets/${folder}`
    );
  }
});

test("unknown datasets fall back to the shared helper scripts folder", async () => {
  assert.ok(existsSync(fileURLToPath(moduleUrl)), "Expected helper scripts utility");
  const { getHelperScriptsUrl } = await import(moduleUrl.href);

  assert.equal(
    getHelperScriptsUrl("Future Dataset"),
    "https://github.com/Augmented-Health-Lab/Glucose-ML-Project/tree/main/2_Harmonize-cgm-datasets"
  );
});
