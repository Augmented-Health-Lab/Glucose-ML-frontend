
import "./cgm-metric-tile.css";

type Props = {
  value: string;
  label: string;
};

export default function CgmMetricTile({ value, label }: Props) {
  return (
    <div className="cgm-metric-tile">
      <div className="cgm-metric-tile__value">{value || "-"}</div>
      <div className="cgm-metric-tile__label">{label}</div>
    </div>
  );
}
