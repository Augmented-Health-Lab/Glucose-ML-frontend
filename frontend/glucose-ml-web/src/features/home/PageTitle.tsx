import "./page-title.css";
import type { HomeDataset } from "../../types/dataset";
import { HOME_SUMMARY_STATS } from "../../data/home-summary-stats";

type PageTitleProps = {
  datasets: HomeDataset[];
};

function sumNumeric<T>(
  rows: T[],
  getValue: (row: T) => number | string | null | undefined
) {
  return rows.reduce((total, row) => {
    const value = Number(String(getValue(row) ?? "").replace(/,/g, ""));
    return Number.isFinite(value) ? total + value : total;
  }, 0);
}

const PageTitle = ({ datasets }: PageTitleProps) => {
  const aggregateMetrics = {
    datasetCount: datasets.length,
    participants: sumNumeric(datasets, (dataset) => dataset.participants),
    participantDays: datasets.reduce((total, dataset) => {
      const days = Number(String(dataset.days).replace(/,/g, ""));
      return Number.isFinite(days)
        ? total + days * Number(dataset.participants || 0)
        : total;
    }, 0),
  };

  return (
    <section
      className="page-title"
      aria-label="Glucose-ML dataset summary"
      data-loaded={aggregateMetrics.datasetCount > 0}
      data-dataset-count={aggregateMetrics.datasetCount}
      data-participants={aggregateMetrics.participants}
      data-participant-days={aggregateMetrics.participantDays}
    >
      <div className="page-title__copy">
        <h1>Accelerating data-driven research for diabetes</h1>
        <p>
          Explore, discover, and access public continuous glucose monitoring
          datasets to develop next-generation solutions for diabetes prevention
          and care.
        </p>
      </div>
      <div className="page-title__metrics" aria-label="Dataset metrics">
        {HOME_SUMMARY_STATS.map((stat) => (
          <div className="page-title__metric" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PageTitle;
