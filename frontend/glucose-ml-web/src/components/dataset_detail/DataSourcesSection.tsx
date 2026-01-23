
import "./DataSourcesSection.css";
import type { DataSource } from "../MockData";

type Props = {
  sources: DataSource[];
};

export default function DataSourcesSection({ sources }: Props) {
  return (
    <section className="card">
      <h2 className="card-title">Data sources</h2>

      <div className="sources">
        {sources.map((s) => (
          <div key={s.name} className="source-row">
            <div className="source-left">
              <span className="source-icon">{s.icon}</span>
              <span className="source-name">{s.name}</span>
            </div>
            <div className="source-detail">{s.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
