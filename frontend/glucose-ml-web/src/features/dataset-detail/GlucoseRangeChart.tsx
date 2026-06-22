import { useState } from "react";
import {
  GLUCOSE_DETAIL_RANGE_DEFINITIONS,
  GLUCOSE_DETAIL_RANGE_ORDER,
} from "../../data/glucose-ranges.ts";
import type { StackedBarGroup } from "../../types/dataset";
import "./glucose-range-chart.css";

type Props = {
  bars: StackedBarGroup[];
  yLabel?: string;
};

const populationLabels: Record<string, string> = {
  T1D: "Type 1 diabetes",
  T2D: "Type 2 diabetes",
  PreD: "Pre-diabetes",
  ND: "No diabetes",
};

function formatPopulationLabel(group: string) {
  return populationLabels[group] ?? group;
}

function clamp0(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

export default function GlucoseRangeChart({ bars, yLabel = "Percentage (%)" }: Props) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  return (
    <div className="tir-wrap">
      <div className="tir-legend" aria-label="Legend">
        {GLUCOSE_DETAIL_RANGE_ORDER.map((key) => (
          <div key={key} className="tir-legend-item">
            <span className={`tir-swatch tir-${key}`} />
            <div className="tir-legend-text-wrapper">
              <div className="tir-legend-title">
                {GLUCOSE_DETAIL_RANGE_DEFINITIONS[key].title}
              </div>
              <div className="tir-legend-range">
                {GLUCOSE_DETAIL_RANGE_DEFINITIONS[key].range}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="tir-frame">
        <div className="tir-plot-area">
          <div className="tir-y-axis" aria-hidden="true" />
          <div className="tir-bars">
            {bars.map((bar) => {
              const isHovered = hoveredBar === bar.group;
              const populationLabel = formatPopulationLabel(bar.group);
              const total =
                bar.segments.reduce((sum, segment) => sum + clamp0(segment.value), 0) || 100;

              return (
                <div
                  key={bar.group}
                  className="tir-row"
                  onMouseEnter={() => setHoveredBar(bar.group)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div className="tir-row-label">{populationLabel}</div>
                  <div className={`tir-stack ${isHovered ? "tir-stack-hovered" : ""}`}>
                    {GLUCOSE_DETAIL_RANGE_ORDER.map((key) => {
                      const segment = bar.segments.find((item) => item.key === key);
                      const percentage = clamp0(segment?.value ?? 0);

                      return (
                        <div
                          key={`${bar.group}-${key}`}
                          className={`tir-seg tir-${key}`}
                          style={{ flexGrow: Math.max(0.0001, percentage / total) }}
                        />
                      );
                    })}
                  </div>

                  {isHovered && (
                    <div className="tir-tooltip">
                      <div className="tir-tooltip-title">{populationLabel}</div>
                      <div className="tir-tooltip-content">
                        {GLUCOSE_DETAIL_RANGE_ORDER.map((key) => {
                          const segment = bar.segments.find((item) => item.key === key);
                          const percentage = clamp0(segment?.value ?? 0);
                          if (percentage === 0) return null;

                          return (
                            <div key={key} className="tir-tooltip-item">
                              <div className="tir-tooltip-swatch-wrapper">
                                <span className={`tir-tooltip-swatch tir-${key}`} />
                                <span className="tir-tooltip-label">
                                  {GLUCOSE_DETAIL_RANGE_DEFINITIONS[key].title}
                                </span>
                              </div>
                              <span className="tir-tooltip-value">{percentage.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="tir-x-axis" />
        <div className="tir-x-label">{yLabel}</div>
      </div>
    </div>
  );
}
