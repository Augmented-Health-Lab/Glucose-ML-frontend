import "./CGMDataSection.css";
import GlucoseRangeChart from "./GlucoseRangeChart";

type Props = {
  cgmData: {
    device: string;
    totalDays: number;
    totalSamples: number;
    avgDaysPerParticipant: number;
  };
  glucoseRanges: { range: string; percentage: number }[];
  showByGroup: boolean;
  setShowByGroup: (v: boolean) => void;
};

const CGMDataSection = ({ cgmData, glucoseRanges, showByGroup, setShowByGroup }: Props) => {
  return (
    <div className="detail-card">
      {/* Header row: "CGM data" (left) + Legend (right) */}
      <div className="cgm-header-row">
        <h2 className="h2">CGM data</h2>

        <button type="button" className="btn btn-sm btn-link metadata legend-btn">
          <span className="legend-icon">i</span>
          <span>Legend &amp; info</span>
        </button>
      </div>

      {/* Figma-style 4-column summary row */}
      <div className="cgm-data-grid">
        <div className="data-item">
          <div className="metadata">Type</div>
          <div className="body">{cgmData.device}</div>
        </div>

        <div className="data-item">
          <div className="metadata">Total days of glucose</div>
          <div className="body">{cgmData.totalDays}</div>
        </div>

        <div className="data-item">
          <div className="metadata">Total glucose samples</div>
          <div className="body">{cgmData.totalSamples}</div>
        </div>

        <div className="data-item">
          <div className="metadata">Average days per participant</div>
          <div className="body">{cgmData.avgDaysPerParticipant}</div>
        </div>
      </div>

      <GlucoseRangeChart
        glucoseRanges={glucoseRanges}
        showByGroup={showByGroup}
        setShowByGroup={setShowByGroup}
      />
    </div>
  );
};

export default CGMDataSection;
