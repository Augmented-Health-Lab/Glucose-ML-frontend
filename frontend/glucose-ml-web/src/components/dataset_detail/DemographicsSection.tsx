import "./DemographicsSection.css";
import type { DatasetDetail } from "../MockData";

type Props = {
  demographics: DatasetDetail["demographics"];
};

export default function DemographicsSection({ demographics }: Props) {
  const formatValue = (value: string) => {
    if (!value || value.trim() === "" || value === "-" || value === "NR" || value === "Nah") {
      return "";
    }
    return value;
  };

  const formatEthnicities = (value: string) => {
    const cleaned = formatValue(value);
    if (!cleaned) return "";

    const items = cleaned
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (items.length <= 2) return cleaned;

    const lines: string[] = [];
    for (let i = 0; i < items.length; i += 2) {
      lines.push(items.slice(i, i + 2).join(", "));
    }
    return lines.join("\n");
  };

  const gender = formatValue(demographics.gender);
  const ethnicities = formatEthnicities(demographics.ethnicities);
  const ageRange = formatValue(demographics.ageRange);

  return (
    <section className="card">
      <h2 className="card-title">Demographics</h2>

      <div className="kv">
        <div className="kv-row">
          <div className="kv-key">Gender</div>
          <div className="kv-val">{gender || <span className="empty-value">—</span>}</div>
        </div>

        <div className="kv-row">
          <div className="kv-key">Race/Ethnicity</div>
          <div className="kv-val kv-val--multiline">
            {ethnicities || <span className="empty-value">—</span>}
          </div>
        </div>

        <div className="kv-row">
          <div className="kv-key">Age range</div>
          <div className="kv-val">
            {ageRange ? `${ageRange} years` : <span className="empty-value">—</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
