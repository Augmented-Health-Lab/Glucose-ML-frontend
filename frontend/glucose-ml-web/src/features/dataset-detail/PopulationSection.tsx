
import "./population-section.css";
import type { DatasetPopulationGroup } from "../../types/dataset";

type Props = {
  total: number;
  groups: DatasetPopulationGroup[];
};

const NOT_REPORTED = "Not reported";
const populationGroupOrder = ["T1D", "T2D", "PreD", "ND"];
const populationGroupLabels = {
  T1D: "Type 1 diabetes",
  T2D: "Type 2 diabetes",
  PreD: "Prediabetes",
  ND: "No diabetes",
} satisfies Record<DatasetPopulationGroup["type"], string>;

function formatParticipantCount(count: number) {
  return Number.isFinite(count) && count > 0
    ? `${count.toLocaleString("en-US")} participants`
    : NOT_REPORTED;
}

export default function PopulationSection({ total, groups }: Props) {
  const orderedGroups = [...groups].sort(
    (a, b) =>
      populationGroupOrder.indexOf(a.type) -
      populationGroupOrder.indexOf(b.type)
  );

  return (
    <section className="detail-card">
      <div className="detail-card__heading">
        <h2 className="detail-card__title">Population</h2>
        <span className="detail-card__info" aria-label="Population information">
          i
        </span>
      </div>

      <div className="detail-card__rows">
        <div className="detail-card__row">
          <div>Total</div>
          <div className="detail-card__value">
            {formatParticipantCount(total)}
          </div>
        </div>

        <div className="detail-card__divider" aria-hidden="true" />

        {orderedGroups.map((group) => (
          <div key={group.type} className="detail-card__row">
            <div>{populationGroupLabels[group.type]}</div>
            <div className="detail-card__value">
              {formatParticipantCount(group.count)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
