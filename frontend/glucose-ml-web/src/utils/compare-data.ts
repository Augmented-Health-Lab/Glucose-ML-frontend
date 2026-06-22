import type {
  CompareDataset,
  DatasetDetailJson,
  DetailDatasetJson,
  HomeDataset,
  RangeKey,
  TableDataset,
  TirByDataset,
  TirByType,
} from "../types/dataset";
import { findTableDataset, normalizeDatasetName } from "./dataset-names";
import { formatGender, formatNumber } from "./format";

export const DEFAULT_COMPARE_DATASETS = ["CGMacros", "T1DEXI", "AI-READI"] as const;
export const MAX_COMPARE_DATASETS = 3;

type SourceKey = keyof CompareDataset["sources"];

const SOURCE_LETTER_TO_KEY: Partial<Record<string, SourceKey>> = {
  G: "cgm",
  I: "insulin",
  W: "wearable",
  A: "wearable",
  M: "manual",
};

export function parseCompareDatasets(search: string): string[] {
  const raw = new URLSearchParams(search).get("datasets");
  if (raw === null) return [...DEFAULT_COMPARE_DATASETS];

  const parsed = parseSelectedDatasets(search);

  return parsed.length > 0 ? parsed.slice(0, MAX_COMPARE_DATASETS) : [...DEFAULT_COMPARE_DATASETS];
}

export function parseSelectedDatasets(search: string): string[] {
  const raw = new URLSearchParams(search).get("datasets");
  if (raw === null) return [];

  return raw
    .split(",")
    .map((datasetName) => datasetName.trim())
    .filter((datasetName) => datasetName.length > 0)
    .slice(0, MAX_COMPARE_DATASETS);
}

export function makeCompareUrl(datasetNames: string[]): string {
  const selected = datasetNames.slice(0, MAX_COMPARE_DATASETS);
  const params = new URLSearchParams({ datasets: selected.join(",") });
  return `/compare?${params.toString()}`;
}

export function makeHomeUrl(datasetNames: string[]): string {
  const selected = datasetNames.slice(0, MAX_COMPARE_DATASETS);
  if (selected.length === 0) return "/";

  const params = new URLSearchParams({ datasets: selected.join(",") });
  return `/?${params.toString()}`;
}

export function firstTirGroup(tirByType: TirByType | null | undefined): Partial<Record<RangeKey, number>> {
  return tirByType ? Object.values(tirByType)[0] ?? {} : {};
}

export function buildCompareDataset(
  title: string,
  homeRows: HomeDataset[],
  tableRows: TableDataset[],
  detailMap: DatasetDetailJson,
  tirMap: TirByDataset
): CompareDataset {
  const home = findHomeDataset(homeRows, title);
  const table = findTableDataset(tableRows, title);
  const detail = findDetailDataset(detailMap, title) ?? (table ? findDetailDataset(detailMap, table.name) : undefined);
  const displayTitle = title === "CGMacros" ? title : home?.title ?? table?.name ?? detail?.title ?? title;
  const tirByType = findTirByType(tirMap, title, table?.name, home?.title, detail?.title);
  const tir = averageTirGroup(tirByType);

  return {
    title: displayTitle,
    participants: formatNumber(table?.total ?? detail?.participants.total ?? home?.participants),
    ageRange: table?.["age range"] || formatAgeRange(detail) || "-",
    diabetesTypes: formatDiabetesTypes(table, home, detail),
    gender: formatGender(table) !== "-" ? formatGender(table) : formatDetailGender(detail),
    sources: buildSources(home, table),
    cgmDevice: table?.["CGM Device"] || detail?.cgmData.cgmDevice || "-",
    glucoseSamples: formatNumber(table?.["Glucose samples"] ?? detail?.cgmData.glucoseSamples),
    daysWithCgm: formatNumber(table?.["Total days of glucose"] ?? detail?.cgmData.totalDaysOfGlucose),
    averageDays: formatNumber(table?.["average days per participant"] ?? detail?.cgmData.averageDaysPerParticipant),
    lowPercent: formatRangeTotal(tir, ["very_low", "low"]),
    targetPercent: formatRangeTotal(tir, ["target"]),
    highPercent: formatRangeTotal(tir, ["high", "very_high"]),
    tir,
  };
}

function findHomeDataset(rows: HomeDataset[], title: string): HomeDataset | undefined {
  const normalizedTitle = normalizeDatasetName(title);
  return rows.find((row) => normalizeDatasetName(row.title) === normalizedTitle);
}

function findDetailDataset(detailMap: DatasetDetailJson, title: string): DetailDatasetJson | undefined {
  const normalizedTitle = normalizeDatasetName(title);
  const matchedEntry = Object.entries(detailMap).find(
    ([key, value]) => normalizeDatasetName(key) === normalizedTitle || normalizeDatasetName(value.title) === normalizedTitle
  );
  return matchedEntry?.[1];
}

function findTirByType(
  tirMap: TirByDataset,
  ...candidates: Array<string | undefined>
): TirByType | undefined {
  const candidateNames = candidates.filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidateNames) {
    const direct = tirMap[candidate];
    if (direct) return direct;
  }

  const normalizedCandidates = new Set(candidateNames.map(normalizeDatasetName));
  const matchedEntry = Object.entries(tirMap).find(([key]) => normalizedCandidates.has(normalizeDatasetName(key)));
  return matchedEntry?.[1];
}

function buildSources(home: HomeDataset | undefined, table: TableDataset | undefined): CompareDataset["sources"] {
  const emptySources: CompareDataset["sources"] = {
    cgm: false,
    insulin: false,
    wearable: false,
    manual: false,
  };

  const letters = [...(home?.sources ?? []), ...Object.keys(table?.data_source ?? {})].map((source) => source.toUpperCase());

  return letters.reduce<CompareDataset["sources"]>((sources, letter) => {
    const key = SOURCE_LETTER_TO_KEY[letter];
    return key ? { ...sources, [key]: true } : sources;
  }, emptySources);
}

function formatAgeRange(detail: DetailDatasetJson | undefined): string {
  const min = detail?.demographics.ageRangeYears.min;
  const max = detail?.demographics.ageRangeYears.max;
  return min !== null && min !== undefined && max !== null && max !== undefined ? `${min} - ${max}` : "";
}

function formatDiabetesTypes(
  table: TableDataset | undefined,
  home: HomeDataset | undefined,
  detail: DetailDatasetJson | undefined
): string[] {
  const tableTypes = table?.populationGroups?.filter((group) => numberOrZero(group.count) > 0).map((group) => group.type);
  if (tableTypes?.length) return tableTypes;

  if (home?.types.length) return home.types;

  const detailTypes = detail?.participants.populationGroups
    .filter((group) => numberOrZero(group.count) > 0)
    .map((group) => group.type);
  return detailTypes?.length ? detailTypes : [];
}

function formatDetailGender(detail: DetailDatasetJson | undefined): string {
  if (!detail) return "-";

  const { female, male, unknown } = detail.demographics.gender;
  const parts = [
    female > 0 ? `${female} female` : "",
    male > 0 ? `${male} male` : "",
    unknown > 0 ? `${unknown} unknown` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "-";
}

function averageTirGroup(tirByType: TirByType | undefined): Partial<Record<RangeKey, number>> {
  const groups = Object.values(tirByType ?? {});
  if (!groups.length) return {};

  const keys: RangeKey[] = ["very_low", "low", "target", "high", "very_high"];

  return Object.fromEntries(
    keys.flatMap((key) => {
      const values = groups.map((group) => group[key]).filter(isFiniteNumber);
      return values.length ? [[key, values.reduce((sum, value) => sum + value, 0) / values.length]] : [];
    })
  ) as Partial<Record<RangeKey, number>>;
}

function formatRangeTotal(tir: Partial<Record<RangeKey, number>>, keys: RangeKey[]): string {
  const values = keys.map((key) => tir[key]).filter(isFiniteNumber);
  if (!values.length) return "-";

  return String(Math.round(values.reduce((sum, value) => sum + value, 0)));
}

function isFiniteNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function numberOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
