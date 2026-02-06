
import "./DemographicsSection.css";
import type { DatasetDetail } from "../MockData";

type Props = {
  demographics: DatasetDetail["demographics"];
};

export default function DemographicsSection({ demographics }: Props) {
  // Format empty values - show empty string instead of "-" or other placeholders
  const formatValue = (value: string) => {
    if (!value || value.trim() === "" || value === "-" || value === "NR" || value === "Nah") {
      return "";
    }
    return value;
  };

  return (
    <section className="card">
      <h2 className="card-title">Demographics</h2>

      <div className="kv">
        <div className="kv-row">
          <div className="kv-key">Gender</div>
          <div className="kv-val">{formatValue(demographics.gender) || <span className="empty-value">—</span>}</div>
        </div>
        <div className="kv-row">
          <div className="kv-key">Ethnicities</div>
          <div className="kv-val">{formatValue(demographics.ethnicities) || <span className="empty-value">—</span>}</div>
        </div>
        <div className="kv-row">
          <div className="kv-key">Age range</div>
          <div className="kv-val">
            {formatValue(demographics.ageRange) 
              ? `${formatValue(demographics.ageRange)} years`
              : <span className="empty-value">—</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
