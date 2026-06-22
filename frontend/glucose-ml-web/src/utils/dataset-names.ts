import type { TableDataset } from "../types/dataset";

export const NAME_ALIASES: Record<string, string> = {
  CGMacros: "CGMacros Dexcom",
  CGMacros_Dexcom: "CGMacros Dexcom",
  CGMacros_Libre: "CGMacros Libre",
  Park2025: "Park 2025",
  "T1DM-UOM": "T1D-UOM",
};

export function normalizeDatasetName(name: string): string {
  const aliased = NAME_ALIASES[name] ?? name;
  return aliased.replace(/[\s_-]+/g, "").toLowerCase();
}

export function findTableDataset(rows: TableDataset[], title: string): TableDataset | undefined {
  const aliasedTitle = NAME_ALIASES[title] ?? title;
  const exactMatch = rows.find((row) => row.name === aliasedTitle);
  if (exactMatch) return exactMatch;

  const normalizedTitle = normalizeDatasetName(aliasedTitle);
  return rows.find((row) => normalizeDatasetName(row.name) === normalizedTitle);
}
