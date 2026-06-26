
import { useState } from "react";
import "./cgm-data-section.css";
import type { DatasetDetail } from "../../types/dataset";

import CgmMetricTile from "./CgmMetricTile";
import CgmTabGroup from "./CgmTabGroup";
import GlucoseRangeChart from "./GlucoseRangeChart";
import HistogramChart from "./HistogramChart";
import { formatCgmMetric } from "./cgm-metric-format";

type Props = {
  dataset: DatasetDetail;
};

type TabKey = "hist" | "tir";

export default function CGMDataSection({ dataset }: Props) {
  const [tab, setTab] = useState<TabKey>("hist");

  const totalDaysRange = dataset.cgmSummary.totalDaysRange;
  const totalDaysDisplay =
    totalDaysRange || formatCgmMetric(dataset.cgmSummary.totalDays);

  const tiles = [
    { value: dataset.cgmSummary.device || "", label: "CGM device" },
    { value: totalDaysDisplay || "", label: "Total days of glucose" },
    {
      value: formatCgmMetric(dataset.cgmSummary.glucoseSamples),
      label: "Glucose samples",
    },
    {
      value: formatCgmMetric(dataset.cgmSummary.avgDaysPerParticipant, {
        round: true,
      }),
      label: "Average days per participant",
    },
  ];

  const yLabel = tab === "tir" ? "Percentage (%)" : "Count";

  const graphTitle =
    tab === "tir"
      ? "Time in ranges"
      : "Histogram";

  const graphSubtitle =
    tab === "hist"
      ? "Distribution of glucose measurements across clinically defined glucose ranges"
      : "Stacked bar plot showing the percent of CGM samples in clinically-relevant glucose ranges stratified by diabetes population.";

  return (
    <section className="cgm-data-section">
      <h2 className="cgm-data-section__title">
        Overview of continuous glucose monitoring (CGM) data
      </h2>

      <div className="cgm-data-section__metrics">
        {tiles.map((t) => (
          <CgmMetricTile key={t.label} value={t.value} label={t.label} />
        ))}
      </div>

      <div className="cgm-data-section__tabs">
        <CgmTabGroup active={tab} onChange={setTab} />
      </div>

      <div className="cgm-data-section__chart">
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
