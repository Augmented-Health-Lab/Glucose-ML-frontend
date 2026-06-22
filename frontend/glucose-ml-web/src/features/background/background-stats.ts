import type { HomeDataset, TableDataset } from "../../types/dataset";

export type BackgroundStats = {
  datasets: string | null;
  participants: string | null;
  days: string | null;
  glucoseSamples: string | null;
};

const parseNumber = (value: number | string | null | undefined): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const normalized = Number(value.replaceAll(",", "").trim());
  return Number.isFinite(normalized) ? normalized : 0;
};

const formatCount = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};

const formatCompactCount = (value: number): string => {
  if (value < 1_000_000) return formatCount(value);

  const millions = value / 1_000_000;
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(millions)}M`;
};

export const calculateBackgroundStats = (
  homeRows: HomeDataset[] | null,
  tableRows: TableDataset[] | null
): BackgroundStats => {
  const participants = tableRows
    ? tableRows.reduce((total, row) => total + row.total, 0)
    : null;
  const days = tableRows
    ? tableRows.reduce(
        (total, row) => total + parseNumber(row["Total days of glucose"]),
        0
      )
    : null;
  const glucoseSamples = tableRows
    ? tableRows.reduce((total, row) => total + row["Glucose samples"], 0)
    : null;

  return {
    datasets: homeRows ? formatCount(homeRows.length) : null,
    participants: participants === null ? null : formatCount(participants),
    days: days === null ? null : formatCount(days),
    glucoseSamples:
      glucoseSamples === null ? null : formatCompactCount(glucoseSamples),
  };
};
