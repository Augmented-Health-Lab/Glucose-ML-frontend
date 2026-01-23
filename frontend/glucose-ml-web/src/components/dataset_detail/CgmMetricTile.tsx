
import "./CgmMetricTile.css";

type Props = {
  value: string;
  label: string;
};

export default function CgmMetricTile({ value, label }: Props) {
  return (
    <div className="cgm-metric-tile">
      <div className="cgm-metric-value">{value}</div>
      <div className="cgm-metric-label">{label}</div>
    </div>
  );
}
