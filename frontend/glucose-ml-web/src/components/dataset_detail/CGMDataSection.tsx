
import { useState } from "react";
import "./CGMDataSection.css";
import type { DatasetDetail } from "../MockData";

import CgmMetricTile from "./CgmMetricTile";
import CgmTabGroup from "./CgmTabGroup";
import GlucoseRangeChart from "./GlucoseRangeChart";
import HistogramChart from "./HistogramChart";

type Props = {
  dataset: DatasetDetail;
};

type TabKey = "hist" | "tir";

export default function CGMDataSection({ dataset }: Props) {
  const [tab, setTab] = useState<TabKey>("tir");

  const totalDaysRange = (dataset.cgmSummary as any).totalDaysRange;
  const totalDaysDisplay = totalDaysRange 
    ? totalDaysRange 
    : dataset.cgmSummary.totalDays > 0 
    ? String(dataset.cgmSummary.totalDays)
    : "";

  const tiles = [
    { value: dataset.cgmSummary.device || "", label: "CGM device" },
    { value: totalDaysDisplay || "", label: "Total days of glucose" },
    { value: dataset.cgmSummary.glucoseSamples > 0 ? String(dataset.cgmSummary.glucoseSamples) : "", label: "Glucose samples" },
    { value: dataset.cgmSummary.avgDaysPerParticipant > 0 ? String(dataset.cgmSummary.avgDaysPerParticipant) : "", label: "Average days per participant" },
  ];

  const yLabel = tab === "tir" ? "Percentage (%)" : "Count";

  const graphTitle = tab === "tir" ? "Time in ranges" : "Histogram";
  
  const graphSubtitle = tab === "hist" 
    ? "Distribution of glucose measurements across clinically defined glucose ranges"
    : "Figure showing the range of glucose values...";

  return (
    <section className="cgm-card">
      <h2 className="cgm-title">CGM data</h2>

      <div className="cgm-metrics">
        {tiles.map((t) => (
          <CgmMetricTile key={t.label} value={t.value} label={t.label} />
        ))}
      </div>

      <div className="cgm-tabs-wrap">
        <CgmTabGroup active={tab} onChange={setTab} />
      </div>

      <div className="cgm-graph">
        <div className="graph-head">
          <div className="graph-title">{graphTitle}</div>
          <div className="graph-sub">{graphSubtitle}</div>
        </div>

        <div className="graph-body">
          {tab === "tir" && <GlucoseRangeChart bars={dataset.timeInRanges} yLabel={yLabel} />}

          {tab === "hist" && dataset.histogramData ? (
            <HistogramChart data={dataset.histogramData} yLabel={yLabel} />
          ) : tab === "hist" ? (
            <div className="placeholder">Histogram data not available</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
