import "./DatasetCard.css";
import { useNavigate } from "react-router-dom";

export interface DatasetCardProps {
  title: string;
  participants: number;
  days: number;
  access: string;
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
  participants,
  days,
  access,
  description,
  types,
  sources,
  selected = false,
  onSelect: _onSelect,
}: DatasetCardProps) => {
  const visualBarFile = `${title.replace(/ /g, "_")}-visual-bar.png`;

  //add to make clickable
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/dataset/${title}`);
  };

  return (
    <div
      className={`dataset-card ${selected ? "dataset-card-selected" : ""}`}
      onClick={handleCardClick}
    >
      <div className="top-section mb-6px">
        <div className="d-flex align-items-start">
          <h2 className="h2">{title}</h2>
        </div>

        <p className="metadata mb-12px">
          {participants} participants · {days} days · {access} access
        </p>
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

        <div className="ms-auto visual-bar">
          <img
            src={`/homepage_visual_bar/${visualBarFile}`}
            alt={`${title} visual bar`}
          />
        </div>
      </div>
    </div>
  );
};

export default DatasetCard;
