import { IoChevronBack } from "react-icons/io5";
import "./DatasetHeader.css";

type Props = {
  dataset: {
    title: string;
    duration: string;
    dateRange: string;
    fullDescription: string;
  };
  onBack: () => void;
  onLegendInfo?: () => void;
};

export default function DatasetHeader({ dataset, onBack, onLegendInfo }: Props) {
  return (
    <header className="detail-header">
      <div className="detail-header-inner">
        <div className="detail-header-top">
          <button type="button" className="breadcrumb-link" onClick={onBack}>
            <IoChevronBack size={18} />
            Back
          </button>

          {onLegendInfo && (
            <button
              type="button"
              className="legend-info-btn"
              onClick={onLegendInfo}
            >
              <span className="legend-info-icon">i</span>
              Legend &amp; info
            </button>
          )}
        </div>

        <div className="detail-header-content">
          <h1 className="detail-title">{dataset.title}</h1>

          <p className="detail-duration">
            {dataset.duration}
            {dataset.dateRange ? ` • ${dataset.dateRange}` : ""}
          </p>

          <p className="detail-desc">{dataset.fullDescription}</p>

          <div className="detail-header-actions">
            <button type="button" className="control-btn control-btn-primary">
              Download dataset
            </button>
            <button type="button" className="control-btn control-btn-primary">
              Link to dataset source
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
