
import "./PopulationSection.css";
import { RoundIcon } from "../DatasetCard";
import type { PopulationGroup } from "../MockData";

type Props = {
  total: number;
  groups: PopulationGroup[];
};



export default function PopulationSection({ total, groups }: Props) {
  return (
    <section className="card">
      <h2 className="card-title">Participants</h2>

      <div className="kv">
        <div className="kv-row">
          <div className="kv-key">Total</div>
          <div className="kv-val">{total} persons</div>
        </div>

        <div className="kv-row kv-row--top">
          <div className="kv-key">Population</div>

          <div className="pop-groups">
            {groups.map((g) => (
              <div key={g.type} className="pop-group-item">
                <span className="pop-count">{g.count} persons</span>
                <RoundIcon type={g.label ?? g.type} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
