export const NOT_REPORTED = "Not reported";

const missingValues = new Set(["", "-", "nr", "nah", "n/a", "nan"]);

export function formatDetailValue(value: string) {
  const normalizedValue = String(value ?? "").trim();
  return missingValues.has(normalizedValue.toLowerCase())
    ? NOT_REPORTED
    : normalizedValue;
}

export function formatEthnicityLines(value: string) {
  const formattedValue = formatDetailValue(value).replace(
    /(\d+(?:\.\d+)?)%/g,
    (_, percentage: string) => `${Math.round(Number(percentage))}%`
  );
  if (formattedValue === NOT_REPORTED) return [formattedValue];

  return formattedValue
    .split(/[,;]\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}
