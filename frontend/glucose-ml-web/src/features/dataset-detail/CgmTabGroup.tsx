
import "./cgm-tab-group.css";

type TabKey = "hist" | "tir";

type Props = {
  active: TabKey;
  onChange: (t: TabKey) => void;
};

export default function CgmTabGroup({ active, onChange }: Props) {
  return (
    <div className="cgm-tab-group">
      <div className="cgm-tab-group__inner">
        <button
          type="button"
          className={`cgm-tab-group__button ${
            active === "hist" ? "cgm-tab-group__button--active" : ""
          }`}
          onClick={() => onChange("hist")}
        >
          Histogram
        </button>
        <button
          type="button"
          className={`cgm-tab-group__button ${
            active === "tir" ? "cgm-tab-group__button--active" : ""
          }`}
          onClick={() => onChange("tir")}
        >
          Time in ranges
        </button>
      </div>
    </div>
  );
}
