const PUBLIC_DATASET_NAMES = new Set([
  "Hall 2018",
  "D1NAMO",
  "Colas 2019",
  "OhioT1DM",
  "T1DEXI",
  "T1DEXIP",
  "BIGIDEAs",
  "DiaTrend",
  "ShanghaiT1DM",
  "ShanghaiT2DM",
  "T1DiabetesGranada",
  "AI-READI",
  "UCHTT1DM",
  "HUPA-UCM",
  "CGMacros Dexcom",
  "CGMacros Libre",
  "T1D-UOM",
  "Bris-T1D Open",
  "AZT1D",
  "Park 2025",
  "PhysioCGM",
]);

export function getPublicDatasetName(
  datasetName: string | undefined
): string | undefined {
  return datasetName && PUBLIC_DATASET_NAMES.has(datasetName)
    ? datasetName
    : undefined;
}

export function filterPublicDatasetNames(datasetNames: string[]): string[] {
  return datasetNames.filter((datasetName) =>
    PUBLIC_DATASET_NAMES.has(datasetName)
  );
}
