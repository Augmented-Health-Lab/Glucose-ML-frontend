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
 * JSON on purpose: it lets `canonicalDatasetName` be called from contexts —
 * notably `AnalyticsRouteTracker`, which must stay synchronous and cannot
 * await a fetch just to validate a value before sending it to analytics —
 * without inventing an async dependency there.
 *
 * Used only at analytics call sites, via `canonicalDatasetName`: a value
 * read from the URL (a query-string dataset list or a `/dataset/<id>` path
 * segment) must resolve to one of these before it is ever sent to GA4 as
 * `dataset_name`/`dataset_combination` — and the canonical entry itself,
 * never the original URL-derived text, is what gets sent. It must never
 * gate what renders in the UI — see the call sites in ComparePage/HomePage/
 * CompareBar/CompareTable/AnalyticsRouteTracker, all of which validate only
 * the analytics payload, never the rendered chip/card/navigation.
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
 * Resolves `name` to the canonical spelling from `KNOWN_DATASET_NAMES` it
 * refers to, after resolving `NAME_ALIASES` and normalizing
 * casing/whitespace/separators exactly like `findTableDataset` does above —
 * or `undefined` if `name` does not match any known dataset. Aliases (e.g.
 * `"CGMacros"`, `"Park2025"`) resolve to their canonical form: `"CGMacros"`
 * maps to `"CGMacros Dexcom"` here the same way it already does throughout
 * `compare-data.ts`.
 *
 * This is the analytics privacy gate's only entry point: call sites must
 * send *this* return value to GA4 (never the original `name` they passed
 * in), and must skip emitting entirely when it is `undefined`. Because
 * `normalizeDatasetName` strips whitespace/`_`/`-` runs before comparing,
 * a string can match while looking nothing like the canonical spelling
 * (extra separators, tabs, newlines) — returning the looked-up canonical
 * value rather than the original `name` is what keeps that fuzziness from
 * ever reaching GA4 as attacker- or typo-controlled text, and also keeps a
 * single dataset from fragmenting into multiple spellings in GA4 reports.
 */
export function canonicalDatasetName(name: string): string | undefined {
  const normalized = normalizeDatasetName(name);
  return KNOWN_DATASET_NAMES.find((known) => normalizeDatasetName(known) === normalized);
}
