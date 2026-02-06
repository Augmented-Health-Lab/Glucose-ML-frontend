import "./DataSourcesSection.css";
import type { DataSource } from "../MockData";

type Props = {
  sources: DataSource[];
};

export default function DataSourcesSection({ sources }: Props) {
  if (!sources || sources.length === 0) {
    return (
      <section className="card">
        <h2 className="card-title">Data sources</h2>
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

  return (
    <section className="card">
      <h2 className="card-title">Data sources</h2>

      <div className="sources">
        {sources.map((s) => {
          // Normalize commas + spacing, then re-join so it wraps like a sentence
          const detailText = s.detail
            ? s.detail
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean)
                .join(", ")
            : "";

          return (
            <div key={s.name} className="source-row">
              <div className="source-left">
                <span className="source-icon">{s.icon}</span>
                <span className="source-name">{s.name}</span>
              </div>

              <div className="source-detail" title={detailText}>
                {detailText}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
