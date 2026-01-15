import type { ReactElement } from "react";
import "./PopulationSection.css";

type Props = {
  population: {
    total: number;
    hba1cGroups: { type: string; count: number }[];
    gender: string;
    ethnicities: string;
    ageRange: string;
  };
  RoundIcon: ({ type }: { type: string }) => ReactElement;
};

const PopulationSection = ({ population, RoundIcon }: Props) => {
  return (
    <div className="detail-card mb-4">
      <h2 className="h2 mb-3">Population</h2>

      <div className="detail-row">
        <span className="body">Total</span>
        <span className="body">{population.total} participants</span>
      </div>

      {/* HbA1c group (label left, groups right) */}
      <div className="hba1c-section">
        <div className="hba1c-row">
          <p className="metadata hba1c-label">HbA1c group</p>

          <div className="hba1c-groups">
            {population.hba1cGroups.map((group) => (
              <div key={group.type} className="hba1c-group-item">
                <RoundIcon type={group.type} />
                <span className="body">{group.count} participants</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-row">
        <span className="body">Gender</span>
        <span className="body">{population.gender}</span>
      </div>

      <div className="detail-row">
        <span className="body">Ethnicities</span>
        <span className="body">{population.ethnicities}</span>
      </div>

      <div className="detail-row">
        <span className="body">Age range</span>
        <span className="body">{population.ageRange}</span>
      </div>
    </div>
  );
};

export default PopulationSection;
