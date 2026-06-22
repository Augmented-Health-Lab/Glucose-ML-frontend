type FormatCgmMetricOptions = {
  round?: boolean;
};

export function formatCgmMetric(
  value: number,
  { round = false }: FormatCgmMetricOptions = {}
): string {
  if (value <= 0) return "";

  const displayValue = round ? Math.round(value) : value;
  return displayValue.toLocaleString("en-US");
}
