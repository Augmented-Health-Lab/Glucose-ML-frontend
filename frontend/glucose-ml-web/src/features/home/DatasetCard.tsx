import "./dataset-card.css";
import type { CSSProperties, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import GlucoseDistributionBar, {
  type GlucoseDistributionCounts,
} from "./GlucoseDistributionBar";
import {
  formatAccessLabel,
  getAccessIcon,
  normalizeDatasetAccess,
} from "../../utils/access";
import { getDatasetSourceLabels } from "../../utils/source-labels";
import { trackDatasetOpen } from "../../analytics/events";

export interface DatasetCardProps {
  title: string;
  participants: number;
  days: number | string;
  access: string;
  description?: string;
  year?: string;
  types: string[];
  sources: string[];
  distribution?: GlucoseDistributionCounts | null;
  selected?: boolean;
  selectionDisabled?: boolean;
  onSelect?: (checked: boolean) => void;
}

const type_color_map = {
  T2D: "var(--light-orange)",
  PreD: "var(--light-yellow)",
  ND: "var(--light-green)",
  T1D: "var(--light-red)",
};

type IconType = keyof typeof type_color_map;

const TYPE_LABELS: Record<IconType, string> = {
  T2D: "Type 2",
  PreD: "Prediabetes",
  ND: "No Diabetes",
  T1D: "Type 1",
};

function getColor(type: string): string {
  if (type in type_color_map) {
    return type_color_map[type as IconType];
  }
  return "var(--light-blue)";
}

export const RoundIcon = ({ type }: { type: string }) => {
  const color = getColor(type);
  return (
    <span className="round-icon" style={{ backgroundColor: color }}>
      {TYPE_LABELS[type as IconType] ?? type}
    </span>
  );
};

type MetadataIconSize = "default" | "people";

const MetadataIcon = ({
  controlled = false,
  src,
  size = "default",
}: {
  controlled?: boolean;
  src: string;
  size?: MetadataIconSize;
}) => (
  <span
    aria-hidden="true"
    className={`dataset-card__meta-icon dataset-card__meta-icon--${size}${
      controlled ? " dataset-card__meta-icon--controlled" : ""
    }`}
    style={
      {
        "--dataset-card-meta-icon-url": `url("${src}")`,
      } as CSSProperties
    }
  />
);

const DatasetCard = ({
  title,
  participants,
  days,
  access,
  year,
  types,
  sources,
  distribution = null,
  selected = false,
  selectionDisabled = false,
  onSelect,
}: DatasetCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    trackDatasetOpen(title, "home");
    navigate(`/dataset/${title}`);
  };

  const handleCheckboxClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const sourceLabels = getDatasetSourceLabels(sources);
  const accessLabel = formatAccessLabel(access, "card");
  const accessIcon = getAccessIcon(access);
  const isControlledAccess =
    (normalizeDatasetAccess(access) ?? "Controlled") === "Controlled";
  const participantLabel = `${participants.toLocaleString("en-US")} participants`;

  return (
    <div
      className={`dataset-card ${selected ? "dataset-card-selected" : ""}`}
      onClick={handleCardClick}
    >
      <div className="top-section">
        <div className="dataset-card__heading-row">
          <h2>{title}</h2>
          <input
            className="dataset-card__checkbox"
            type="checkbox"
            aria-label={`Select ${title} for comparison`}
            checked={selected}
            disabled={selectionDisabled}
            onClick={handleCheckboxClick}
            onChange={(event) => onSelect?.(event.target.checked)}
          />
        </div>

        <div className="dataset-card__metadata" aria-label="Dataset metadata">
          <div className="dataset-card__metadata-row">
            <span className="dataset-card__meta-item">
              <MetadataIcon src="/figma-assets/icon-people.svg" size="people" />
              {participantLabel}
            </span>
            <span className="dataset-card__meta-item">
              <MetadataIcon src="/figma-assets/icon-clock.png" />
              {days} days
            </span>
          </div>
          <div className="dataset-card__metadata-row">
            <span className="dataset-card__meta-item">
              <MetadataIcon controlled={isControlledAccess} src={accessIcon} />
              {accessLabel}
            </span>
            {year && (
              <span className="dataset-card__meta-item">
                <MetadataIcon src="/figma-assets/icon-calendar.svg" />
                Year {year}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="dataset-card__sections">
        <div className="dataset-card__section">
          <p className="dataset-card__section-label">DIABETES GROUPS</p>
          <div className="dataset-card__badge-row">
            {types.map((type) => (
              <RoundIcon key={type} type={type} />
            ))}
          </div>
        </div>

        <div className="dataset-card__section">
          <p className="dataset-card__section-label">DATA SOURCES</p>
          <div className="dataset-card__source-row">
            {sourceLabels.map((source) => (
              <span className="dataset-card__source-pill" key={source}>
                {source}
              </span>
            ))}
          </div>
        </div>

        <div className="dataset-card__section dataset-card__section--distribution">
          <p className="dataset-card__section-label">GLUCOSE DISTRIBUTION</p>
          <GlucoseDistributionBar distribution={distribution} />
        </div>
      </div>
    </div>
  );
};

export default DatasetCard;
