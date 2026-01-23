
import { useState } from "react";
import "./CGMDataSection.css";
import type { DatasetDetail } from "../MockData";

import CgmMetricTile from "./CgmMetricTile";
import CgmTabGroup from "./CgmTabGroup";
import GlucoseRangeChart from "./GlucoseRangeChart";

type Props = {
  dataset: DatasetDetail;
};

type TabKey = "agp" | "hist" | "tir";

export default function CGMDataSection({ dataset }: Props) {
  const [tab, setTab] = useState<TabKey>("tir");

  const tiles = [
    { value: dataset.cgmSummary.device, label: "CGM device" },
    { value: String(dataset.cgmSummary.totalDays), label: "Total days of glucose" },
    { value: String(dataset.cgmSummary.glucoseSamples), label: "Glucose samples" },
    { value: String(dataset.cgmSummary.avgDaysPerParticipant), label: "Average days per participant" },
  ];

  const yLabel = tab === "tir" ? "Count" : tab === "hist" ? "Count" : "Percent (%)";

  const graphTitle = tab === "tir" ? "Time in ranges" : tab === "hist" ? "Histogram" : "Ambulatory glucose profile";

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
          <div className="graph-sub">Figure showing the range of glucose values...</div>
        </div>

        <div className="graph-body">
          {tab === "tir" && <GlucoseRangeChart bars={dataset.timeInRanges} yLabel={yLabel} />}

          {tab === "hist" && <div className="placeholder">Histogram goes here</div>}

          {tab === "agp" && <div className="placeholder">Ambulatory glucose profile goes here</div>}
        </div>
      </div>
    </section>
  );
}
