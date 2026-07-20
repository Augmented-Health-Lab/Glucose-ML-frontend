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

/**
 * The fixed set of dataset display names the app actually knows about,
 * mirrored from the `title` field of `public/static_data/homepage_data.json`
 * (the same list `HomePage`/`ComparePage` fetch and render cards/rows from).
 * This is a static, hand-maintained list rather than a live import of that
 * JSON on purpose: it lets `isKnownDatasetName` be called from contexts —
 * notably `AnalyticsRouteTracker`, which must stay synchronous and cannot
 * await a fetch just to validate a value before sending it to analytics —
 * without inventing an async dependency there.
 *
 * Used only as a membership check at analytics call sites: a value read
 * from the URL (a query-string dataset list or a `/dataset/<id>` path
 * segment) must match one of these before it is ever sent to GA4 as
 * `dataset_name`/`dataset_combination`. It must never gate what renders in
 * the UI — see the call sites in ComparePage/HomePage/CompareBar/
 * CompareTable/AnalyticsRouteTracker, all of which validate only the
 * analytics payload, never the rendered chip/card/navigation.
 */
export const KNOWN_DATASET_NAMES: readonly string[] = [
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
];

/**
 * Whether `name` refers to a real, known public dataset, after resolving
 * `NAME_ALIASES` and normalizing casing/whitespace exactly like
 * `findTableDataset` does above. Aliases (e.g. `"CGMacros"`, `"Park2025"`)
 * count as known: `normalizeDatasetName` resolves the alias on both sides of
 * the comparison, so `"CGMacros"` matches `"CGMacros Dexcom"` here the same
 * way it already does throughout `compare-data.ts`.
 */
export function isKnownDatasetName(name: string): boolean {
  const normalized = normalizeDatasetName(name);
  return KNOWN_DATASET_NAMES.some((known) => normalizeDatasetName(known) === normalized);
}
