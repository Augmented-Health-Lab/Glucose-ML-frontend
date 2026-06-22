import "./data-sources-section.css";
import type { DataSource } from "../../types/dataset";

type Props = {
  sources: DataSource[];
};

const NOT_REPORTED = "Not reported";
const missingSourceValues = new Set(["", "-", "nr", "nah", "n/a", "nan"]);
const sourceOrder = ["Insulin", "CGM", "Manual logs", "Wearable tracker"];
const sourceLabels: Record<string, string> = {
  "Manual Logs": "Manual logs",
  "Wearable Tracker": "Wearable tracker",
};

export default function DataSourcesSection({ sources }: Props) {
  if (!sources || sources.length === 0) {
    return (
      <section className="detail-card">
        <h2 className="detail-card__title">Data sources</h2>
        <div className="sources">
          <div className="source-row">
            <div className="source-left">
              <span className="source-name">No data sources available</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const orderedSources = sources
    .map((source) => ({
      ...source,
      name: sourceLabels[source.name] ?? source.name,
    }))
    .sort((a, b) => {
      const aIndex = sourceOrder.indexOf(a.name);
      const bIndex = sourceOrder.indexOf(b.name);
      const aOrder = aIndex === -1 ? sourceOrder.length : aIndex;
      const bOrder = bIndex === -1 ? sourceOrder.length : bIndex;

      return aOrder - bOrder;
    });

  return (
    <section className="detail-card">
      <h2 className="detail-card__title">Data sources</h2>

      <div className="sources">
        {orderedSources.map((s) => {
          const rawDetail = String(s.detail ?? "").trim();
          const detailText = missingSourceValues.has(rawDetail.toLowerCase())
            ? ""
            : rawDetail
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean)
                .join(", ");

          return (
            <div key={s.name} className="source-row">
              <div className="source-left">
                <span className="source-name">{s.name}</span>
              </div>

              <div className="source-detail" title={detailText}>
                {detailText || NOT_REPORTED}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
