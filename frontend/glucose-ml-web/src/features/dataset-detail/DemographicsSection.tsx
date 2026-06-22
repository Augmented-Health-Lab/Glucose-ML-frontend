
import "./demographics-section.css";
import type { DatasetDetail } from "../../types/dataset";
import {
  formatDetailValue,
  formatEthnicityLines,
  NOT_REPORTED,
} from "./ethnicity-format";

type Props = {
  demographics: DatasetDetail["demographics"];
};

export default function DemographicsSection({ demographics }: Props) {
  const gender = formatDetailValue(demographics.gender);
  const ageRange = formatDetailValue(demographics.ageRange);
  const ethnicities = formatEthnicityLines(demographics.ethnicities);

  return (
    <section className="detail-card">
      <h2 className="detail-card__title">Demographics</h2>

      <div className="detail-card__rows">
        <div className="detail-card__row">
          <div>Gender</div>
          <div className="detail-card__value">{gender}</div>
        </div>
        <div className="detail-card__row">
          <div>Age range</div>
          <div className="detail-card__value">
            {ageRange === NOT_REPORTED ? ageRange : `${ageRange} years`}
          </div>
        </div>
        <div className="detail-card__row">
          <div>Ethnicities</div>
          <div className="detail-card__value">
            {ethnicities.map((ethnicity) => (
              <span className="detail-card__value-line" key={ethnicity}>
                {ethnicity}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
