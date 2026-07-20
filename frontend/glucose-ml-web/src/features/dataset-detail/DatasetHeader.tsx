import "./dataset-header.css";
import {
  formatAccessLabel,
  getAccessIcon,
  normalizeDatasetAccess,
} from "../../utils/access";
import { getHelperScriptsUrl } from "../../utils/helper-scripts";
import { trackDatasetAction } from "../../analytics/events";

type Props = {
  dataset: {
    title: string;
    duration: string;
    dateRange: string;
    fullDescription: string;
    access?: string;
    actions: {
      downloadLabel: string;
      paperLabel: string;
    };
    datasetLink?: string;
    downloadLink?: string;
  };
  onBack: () => void;
  onLegendInfo?: () => void;
};

export default function DatasetHeader({ dataset, onBack }: Props) {
  const year = dataset.duration.replace("Year released:", "").trim() || "-";
  const accessLabel = formatAccessLabel(dataset.access, "detail");
  const accessIcon = getAccessIcon(dataset.access);
  const accessType = normalizeDatasetAccess(dataset.access) ?? "Controlled";
  const isControlledAccess = accessType === "Controlled";
  const helperScriptsUrl = getHelperScriptsUrl(dataset.title);

  return (
    <header className="detail-header">
      <button className="detail-header__back" type="button" onClick={onBack}>
        <img src="/figma-assets/icon-chevron-detail.png" alt="" />
        Back
      </button>
      <div className="detail-header__main">
        <h1 className="glm-title">{dataset.title}</h1>
        <div className="detail-header__metadata">
          <span>
            <img src="/figma-assets/icon-calendar.svg" alt="" />
            Year {year}
          </span>
          <span>
            <img
              className={
                accessType === "Controlled"
                  ? "detail-header__access-icon detail-header__access-icon--controlled"
                  : "detail-header__access-icon"
              }
              src={accessIcon}
              alt=""
            />
            {accessLabel}
          </span>
          <span>
            <img src="/figma-assets/icon-united-states.png" alt="" />
            United States
          </span>
        </div>
        <p className="detail-header__description">
          {dataset.fullDescription || "-"}
        </p>
        <div className="detail-header__actions">
          {isControlledAccess ? (
            dataset.datasetLink ? (
              <a
                className="glm-button glm-button-primary"
                href={dataset.datasetLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackDatasetAction(dataset.title, "request_access", dataset.datasetLink!)
                }
              >
                <span
                  className="glm-button__icon detail-header__request-icon"
                  aria-hidden="true"
                />
                Request access
              </a>
            ) : (
              <button type="button" className="glm-button glm-button-primary" disabled>
                <span
                  className="glm-button__icon detail-header__request-icon"
                  aria-hidden="true"
                />
                Request access
              </button>
            )
          ) : (
            <>
              {dataset.downloadLink ? (
                <a
                  className="glm-button glm-button-primary"
                  href={dataset.downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackDatasetAction(dataset.title, "download", dataset.downloadLink!)
                  }
                >
                  <span
                    className="glm-button__icon glm-button__download-icon"
                    aria-hidden="true"
                  />
                  Download dataset
                </a>
              ) : (
                <button type="button" className="glm-button glm-button-primary" disabled>
                  <span
                    className="glm-button__icon glm-button__download-icon"
                    aria-hidden="true"
                  />
                  Download dataset
                </button>
              )}
              {dataset.datasetLink ? (
                <a
                  className="glm-button glm-button-secondary detail-header__source-button"
                  href={dataset.datasetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackDatasetAction(dataset.title, "source", dataset.datasetLink!)
                  }
                >
                  <img src="/figma-assets/icon-search.svg" alt="" />
                  Dataset source
                </a>
              ) : (
                <button
                  type="button"
                  className="glm-button glm-button-secondary detail-header__source-button"
                  disabled
                >
                  <img src="/figma-assets/icon-search.svg" alt="" />
                  Dataset source
                </button>
              )}
            </>
          )}
          <a
            className="detail-header__helper-link"
            href={helperScriptsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackDatasetAction(dataset.title, "helper_scripts", helperScriptsUrl)
            }
          >
            Helper scripts
          </a>
        </div>
      </div>
    </header>
  );
}
