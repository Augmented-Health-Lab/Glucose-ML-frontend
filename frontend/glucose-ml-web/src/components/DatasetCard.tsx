import VisualBar from "./VisualBar";
import "./DatasetCard.css";
import { useNavigate } from "react-router-dom";

export interface DatasetCardProps {
  title: string;
  metadata: string;
  description: string;
  types: string[];
  sources: string[];
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

const type_color_map = {
  T2D: "var(--light-orange)",
  PreD: "var(--light-yellow)",
  ND: "var(--light-green)",
  T1D: "var(--light-red)",
};

type IconType = keyof typeof type_color_map;

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
      {type}
    </span>
  );
};

const DatasetCard = ({
  title,
  metadata,
  description,
  types,
  sources,
  selected = false,
  onSelect,
}: DatasetCardProps) => {
  //add to make clickable
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/dataset/${title}`);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`dataset-card ${selected ? "dataset-card-selected" : ""}`}
      onClick={handleCardClick}
    >
      <div className="top-section mb-6px">
        <div className="d-flex align-items-start">
          <h2 className="h2">{title}</h2>

          {/* checkbox */}
          <input
            type="checkbox"
            className="form-check-input ms-auto"
            checked={selected}
            onClick={handleCheckboxClick}
            onChange={(e) => onSelect?.(e.target.checked)}
          />
        </div>

        <p className="metadata mb-12px">{metadata}</p>
        <p className="body mb-24px">{description}</p>
      </div>

      <div className="icon-section mt-auto d-flex">
        <div>
          <div className="d-flex body gap-2 mb-24px flex-wrap">
            {types.length === 0 ? (
              <span className="body">No diabetes type specified</span>
            ) : (
              types.map((type) => <RoundIcon key={type} type={type} />)
            )}
          </div>
          <div className="d-flex body gap-2 flex-wrap">
            {sources.length === 0 ? (
              <span className="body">No data source specified</span>
            ) : (
              sources.map((s) => <RoundIcon key={s} type={s} />)
            )}
          </div>
        </div>

        <div className="ms-auto">
          <VisualBar name={title} />
        </div>
      </div>
    </div>
  );
};

export default DatasetCard;
