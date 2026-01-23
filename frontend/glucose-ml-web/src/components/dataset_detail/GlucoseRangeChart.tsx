import "./GlucoseRangeChart.css";
import type { StackedBarGroup, GlucoseRangeKey } from "../MockData";

type Props = {
  bars: StackedBarGroup[];
  yLabel?: string;
};

const ORDER: GlucoseRangeKey[] = ["VeryLow", "Low", "Target", "High", "VeryHigh"];

const LABELS: Record<GlucoseRangeKey, string> = {
  VeryLow: "Very low glucose",
  Low: "Low glucose",
  Target: "Target glucose",
  High: "High glucose",
  VeryHigh: "Very high glucose",
};

export default function GlucoseRangeChart({ bars, yLabel = "Count" }: Props) {
  const totals = bars.map((b) => Number(b.total) || 0);
  const maxTotal = Math.max(1, ...totals);

  return (
    <div className="tir-wrap">
      <div className="tir-legend" aria-label="Legend">
        {ORDER.map((k) => (
          <div key={k} className="tir-legend-item">
            <span className={`tir-swatch tir-${k}`} />
            <span className="tir-legend-text">{LABELS[k]}</span>
          </div>
        ))}
      </div>
      <div className="tir-frame">
        <div className="tir-plot-area">
          <div className="tir-y-label">{yLabel}</div>
          <div className="tir-y-axis" />

          <div className="tir-bars">
            {bars.map((b) => {
              const total = Number(b.total) || 0;
              const hPct = (total / maxTotal) * 100;

              return (
                <div
                  key={b.group}
                  className="tir-col"
                  style={{ ["--stack-h" as any]: `${hPct}%` }}
                >
                  <div className="tir-top">{total}</div>
                  <div className="tir-bar">
                    <div className="tir-stack">
                      {ORDER.map((k) => {
                        const seg = b.segments.find((s) => s.key === k);
                        const val = seg?.value ?? 0;

                        return (
                          <div
                            key={`${b.group}-${k}`}
                            className={`tir-seg tir-${k}`}
                            style={{ flex: Math.max(0.0001, val) }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        <div className="tir-x-axis" />
        <div className="tir-xlabels">
          {bars.map((b) => (
            <div key={`${b.group}-xlabel`} className="tir-xlabel">
              {b.group}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
