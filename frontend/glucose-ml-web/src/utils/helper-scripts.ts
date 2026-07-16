const HELPER_SCRIPTS_BASE_URL =
  "https://github.com/Augmented-Health-Lab/Glucose-ML-Project/tree/main/2_Harmonize-cgm-datasets";

const DATASET_HELPER_FOLDERS: Record<string, string> = {
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

export function getHelperScriptsUrl(datasetTitle: string): string {
  const folder = DATASET_HELPER_FOLDERS[datasetTitle];
  return folder
    ? `${HELPER_SCRIPTS_BASE_URL}/${folder}`
    : HELPER_SCRIPTS_BASE_URL;
}
