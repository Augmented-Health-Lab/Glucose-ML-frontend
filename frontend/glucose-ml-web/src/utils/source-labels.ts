const SOURCE_LABELS: Record<string, string> = {
  G: "CGM",
  I: "Insulin System",
  W: "Wearable Tracker",
  A: "Wearable Tracker",
  M: "Manual Logs",
  Q: "Questionnaire",
  C: "Clinical Measurements",
};

export function getDatasetSourceLabels(sources: string[]) {
  return Array.from(
    new Set(
      sources.map((source) => SOURCE_LABELS[source] ?? source).filter(Boolean)
    )
  );
}
