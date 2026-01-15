import "./GlucoseRangeChart.css";

type Props = {
  glucoseRanges: { range: string; percentage: number }[];
  showByGroup: boolean;
  setShowByGroup: (v: boolean) => void;
};

const GlucoseRangeChart = ({ glucoseRanges, showByGroup, setShowByGroup }: Props) => {
  return (
    <div className="chart-section mt-5">
      <h3 className="chart-title mb-1">Time in glucose ranges</h3>
      <p className="chart-description mb-3">A short description of the plot...</p>

      <div className="chart-toggle-row d-flex gap-3 mb-4">
        <button
          className={`toggle-btn ${!showByGroup ? "active" : ""}`}
          onClick={() => setShowByGroup(false)}
        >
          All
        </button>
        <button
          className={`toggle-btn ${showByGroup ? "active" : ""}`}
          onClick={() => setShowByGroup(true)}
        >
          By HbA1c group
        </button>
      </div>

      <div className="glucose-chart">
        <div className="y-axis-label">Percent %</div>

        {glucoseRanges.map((item, index) => (
          <div key={index} className="bar-container">
            <span className="bar-top-label">{item.percentage}%</span>
            <div className="bar" style={{ height: `${item.percentage * 3}px` }} />
            <span className="bar-range-label">{item.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlucoseRangeChart;
