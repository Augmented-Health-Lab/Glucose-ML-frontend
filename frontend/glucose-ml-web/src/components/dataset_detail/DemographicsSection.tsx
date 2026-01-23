
import "./DemographicsSection.css";
import type { DatasetDetail } from "../MockData";

type Props = {
  demographics: DatasetDetail["demographics"];
};

export default function DemographicsSection({ demographics }: Props) {
  return (
    <section className="card">
      <h2 className="card-title">Demographics</h2>

      <div className="kv">
        <div className="kv-row">
          <div className="kv-key">Gender</div>
          <div className="kv-val">{demographics.gender}</div>
        </div>
        <div className="kv-row">
          <div className="kv-key">Ethnicities</div>
          <div className="kv-val">{demographics.ethnicities}</div>
        </div>
        <div className="kv-row">
          <div className="kv-key">Age range</div>
          <div className="kv-val">{demographics.ageRange}</div>
        </div>
      </div>
    </section>
  );
}
