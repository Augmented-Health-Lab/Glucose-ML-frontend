
import "./CgmTabGroup.css";

type TabKey = "hist" | "tir";

type Props = {
  active: TabKey;
  onChange: (t: TabKey) => void;
};

export default function CgmTabGroup({ active, onChange }: Props) {
  return (
    <div className="cgm-tab-group">
      <button
        type="button"
        className={`cgm-tab ${active === "hist" ? "is-active" : ""}`}
        onClick={() => onChange("hist")}
      >
        Histogram
      </button>
      <button
        type="button"
        className={`cgm-tab ${active === "tir" ? "is-active" : ""}`}
        onClick={() => onChange("tir")}
      >
        Time in ranges
      </button>
    </div>
  );
}
