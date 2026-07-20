import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { CompareDataset } from "../../types/dataset";
import RangeBars from "./RangeBars";
import { FIGMA_COMPARE_ICONS } from "./figma-compare-icons";
import { trackCompareSectionToggle, trackDatasetOpen } from "../../analytics";

type Row = {
  label: string;
  values: (dataset: CompareDataset) => ReactNode;
};

const POP_CLASS: Record<string, string> = {
  T1D: "glm-pop-t1d",
  T2D: "glm-pop-t2d",
  PreD: "glm-pop-pred",
  ND: "glm-pop-nd",
};

const POP_LABEL: Record<string, string> = {
  T1D: "Type 1",
  T2D: "Type 2",
  PreD: "Prediabetes",
  ND: "No Diabetes",
};

const populationRows: Row[] = [
  { label: "Participants", values: (dataset) => dataset.participants },
  { label: "Age range", values: (dataset) => dataset.ageRange },
  {
    label: "Diabetes type",
    values: (dataset) => (
      <span className="compare-table__badges">
        {dataset.diabetesTypes.map((type) => (
          <span
            key={type}
            className={`compare-table__badge ${
              POP_CLASS[type] || "glm-pop-nd"
            }`}
          >
            {POP_LABEL[type] ?? type}
          </span>
        ))}
      </span>
    ),
  },
  { label: "Gender", values: (dataset) => dataset.gender },
];

const sourceRows: { label: string; key: keyof CompareDataset["sources"] }[] = [
  { label: "CGM", key: "cgm" },
  { label: "Insulin", key: "insulin" },
  { label: "Manual Logs", key: "manual" },
  { label: "Wearable Tracker", key: "wearable" },
];

const cgmRows: Row[] = [
  { label: "CGM Device", values: (dataset) => dataset.cgmDevice },
  {
    label: "Total glucose samples",
    values: (dataset) => dataset.glucoseSamples,
  },
  { label: "# Days with CGM data", values: (dataset) => dataset.daysWithCgm },
  {
    label: "Average days per participant",
    values: (dataset) => dataset.averageDays,
  },
  { label: "% Low glucose (<70mg/dL)", values: (dataset) => dataset.lowPercent },
  {
    label: "% Target glucose (70-180mg/dL)",
    values: (dataset) => dataset.targetPercent,
  },
  { label: "% High glucose (>180mg/dL)", values: (dataset) => dataset.highPercent },
];

type SectionKey = "population" | "sources" | "cgm";

const CompareTable = ({ datasets }: { datasets: CompareDataset[] }) => {
  const columnCount = Math.min(Math.max(datasets.length, 1), 3);
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<
    Record<SectionKey, boolean>
  >({
    population: true,
    sources: true,
    cgm: true,
  });

  const toggleSection = (section: SectionKey) => {
    trackCompareSectionToggle({
      section,
      sectionState: expandedSections[section] ? "collapsed" : "expanded",
    });
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const renderSection = (section: SectionKey, title: string) => (
    <button
      type="button"
      className="compare-table__section-row"
      aria-expanded={expandedSections[section]}
      onClick={() => toggleSection(section)}
    >
      <strong>{title}</strong>
      <span className="compare-table__section-icon-wrap" aria-hidden="true">
        <img
          className="compare-table__section-icon"
          src={FIGMA_COMPARE_ICONS.chevronDown}
          alt=""
        />
      </span>
    </button>
  );

  return (
    <section
      className={`compare-table compare-table--${columnCount}`}
      aria-label="Dataset comparison"
    >
      <div className="compare-table__header">
        <span />
        {datasets.map((dataset) => (
          <div className="compare-table__heading" key={dataset.title}>
            <strong>{dataset.title}</strong>
            <button
              type="button"
              className="compare-table__details-button"
              onClick={() => {
                trackDatasetOpen({ datasetName: dataset.title, origin: "compare" });
                navigate(`/dataset/${encodeURIComponent(dataset.title)}`);
              }}
            >
              View dataset details &gt;
            </button>
          </div>
        ))}
      </div>
      {renderSection("population", "Population")}
      {expandedSections.population &&
        populationRows.map((row) => (
          <div className="compare-table__row" key={row.label}>
            <span>{row.label}</span>
            {datasets.map((dataset) => (
              <span key={dataset.title}>{row.values(dataset)}</span>
            ))}
          </div>
        ))}
      {renderSection("sources", "Data Sources")}
      {expandedSections.sources &&
        sourceRows.map((row) => (
          <div className="compare-table__row" key={row.key}>
            <span>{row.label}</span>
            {datasets.map((dataset) => {
              const hasSource = dataset.sources[row.key];
              return (
                <span key={dataset.title} className="compare-table__icon-cell">
                  <img
                    className={`compare-table__source-icon ${
                      hasSource
                        ? "compare-table__source-icon--yes"
                        : "compare-table__source-icon--no"
                    }`}
                    src={
                      hasSource
                        ? FIGMA_COMPARE_ICONS.check
                        : FIGMA_COMPARE_ICONS.no
                    }
                    alt={hasSource ? "Yes" : "No"}
                  />
                </span>
              );
            })}
          </div>
        ))}
      {renderSection("cgm", "CGM Data Overview")}
      {expandedSections.cgm &&
        cgmRows.map((row) => (
          <div className="compare-table__row" key={row.label}>
            <span>{row.label}</span>
            {datasets.map((dataset) => (
              <span key={dataset.title}>{row.values(dataset)}</span>
            ))}
          </div>
        ))}
      {expandedSections.cgm && (
        <div className="compare-table__range-row">
          <span>% Glucose in ranges</span>
          <RangeBars datasets={datasets} />
        </div>
      )}
    </section>
  );
};

export default CompareTable;
