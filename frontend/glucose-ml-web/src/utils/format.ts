import type { TableDataset } from "../types/dataset";

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "" || value === "--") return "-";
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric.toLocaleString() : "-";
}

export function formatGender(row: Pick<TableDataset, "female" | "male" | "Unknown"> | null | undefined): string {
  if (!row) return "-";

  const parts = [
    isPositiveNumber(row.female) ? `${Math.round(row.female)} female` : "",
    isPositiveNumber(row.male) ? `${Math.round(row.male)} male` : "",
    isPositiveNumber(row.Unknown) ? `${Math.round(row.Unknown)} unknown` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "-";
}

function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
