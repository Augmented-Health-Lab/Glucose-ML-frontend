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

const PUBLIC_DATASET_ALIASES = new Map([
  ["CGMacros", "CGMacros"],
  ["CGMacros_Dexcom", "CGMacros Dexcom"],
  ["CGMacros_Libre", "CGMacros Libre"],
  ["Park2025", "Park 2025"],
  ["T1DM-UOM", "T1D-UOM"],
]);

export function getPublicDatasetName(
  datasetName: string | undefined
): string | undefined {
  if (!datasetName) return undefined;
  if (PUBLIC_DATASET_NAMES.has(datasetName)) return datasetName;
  return PUBLIC_DATASET_ALIASES.get(datasetName);
}

export function filterPublicDatasetNames(datasetNames: string[]): string[] {
  return datasetNames.flatMap((datasetName) => {
    const publicDatasetName = getPublicDatasetName(datasetName);
    return publicDatasetName ? [publicDatasetName] : [];
  });
}
