import { useState, useRef } from "react";
import {
  GLUCOSE_RANGE_DEFINITIONS,
  GLUCOSE_RANGE_ORDER,
} from "../../data/glucose-ranges.ts";
import type { RangeKey } from "../../types/dataset";
import "./histogram-chart.css";

type HistogramDataPoint = {
  bin_start: number;
  bin_end: number;
  x: number;
  y: number;
  label: string;
};

type Props = {
  data: HistogramDataPoint[];
  yLabel?: string;
};

// Color mapping based on label
function getColorForLabel(label: string): string {
  if (label.includes("Very low glucose")) {
    return "var(--glm-range-very-low)";
  } else if (label.includes("Low glucose")) {
    return "var(--glm-range-low)";
  } else if (label.includes("Target glucose")) {
    return "var(--glm-range-target)";
  } else if (label.includes("High glucose")) {
    return "var(--glm-range-high)";
  } else if (label.includes("Very high glucose")) {
    return "var(--glm-range-very-high)";
  }
  return "#cccccc";
}

// Format legend text based on label - returns title and range separately
function findRangeKey(label: string): RangeKey | undefined {
  return GLUCOSE_RANGE_ORDER.find((key) =>
    label.includes(GLUCOSE_RANGE_DEFINITIONS[key].title)
  );
}

function formatLegendText(label: string): { title: string; range: string } {
  const key = findRangeKey(label);
  if (key) {
    return GLUCOSE_RANGE_DEFINITIONS[key];
  }
  return { title: label, range: "" }; // Fallback to original label
}

export default function HistogramChart({ data, yLabel = "Count" }: Props) {
  const [hoveredBar, setHoveredBar] = useState<{ x: number; y: number; value: number; count: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const plotAreaRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return <div className="histogram-empty">No histogram data available</div>;
  }

  const maxY = Math.max(...data.map((d) => d.y));
  // Get unique labels for legend and sort them in the correct order
  const uniqueLabels = Array.from(new Set(data.map((d) => d.label))).sort((a, b) => {
    const indexA = GLUCOSE_RANGE_ORDER.indexOf(findRangeKey(a) ?? "very_high");
    const indexB = GLUCOSE_RANGE_ORDER.indexOf(findRangeKey(b) ?? "very_high");
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const handleBarMouseEnter = (e: React.MouseEvent<HTMLDivElement>, point: HistogramDataPoint) => {
    if (plotAreaRef.current) {
      const rect = plotAreaRef.current.getBoundingClientRect();
      const barRect = e.currentTarget.getBoundingClientRect();
      const barElement = e.currentTarget.querySelector('.histogram-bar') as HTMLElement;

      // Calculate position relative to histogram-frame
      const centerX = barRect.left - rect.left + barRect.width / 2;

      // Calculate the top of the bar (bar is aligned to bottom, so top = bottom - height)
      let topY = barRect.top - rect.top;
      if (barElement) {
        const barHeight = barElement.offsetHeight;
        topY = barRect.bottom - rect.top - barHeight;
      }

      setTooltipPosition({
        x: centerX,
        y: topY - 150, // 150px above the bar top to avoid blocking
      });
    }
    setHoveredBar({
      x: point.x,
      y: point.y,
      value: point.x,
      count: point.y,
    });
  };

  const handleBarMouseLeave = () => {
    setHoveredBar(null);
  };

  // No need to calculate bar width - bars will be 100% of their wrapper

  return (
    <div className="histogram-wrap">
      <div className="histogram-legend" aria-label="Legend">
        {uniqueLabels.map((label) => {
          const { title, range } = formatLegendText(label);
          return (
            <div key={label} className="histogram-legend-item">
              <span
                className="histogram-swatch"
                style={{ backgroundColor: getColorForLabel(label) }}
              />
              <div className="histogram-legend-text-wrapper">
                <div className="histogram-legend-title">{title}</div>
                <div className="histogram-legend-range">{range}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="histogram-frame" ref={plotAreaRef}>
        <div className="histogram-plot-area">
          <div className="histogram-y-label">{yLabel}</div>
          <div className="histogram-y-axis" />

          <div className="histogram-bars-container">
            {data.map((point, index) => {
              const heightPercent = (point.y / maxY) * 100;
              const color = getColorForLabel(point.label);

              return (
                <div
                  key={index}
                  className="histogram-bar-wrapper"
                  onMouseEnter={(e) => handleBarMouseEnter(e, point)}
                  onMouseLeave={handleBarMouseLeave}
                >
                  <div
                    className="histogram-bar"
                    style={{
                      width: "100%",
                      height: `${heightPercent}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="histogram-x-axis" />
        <div className="histogram-xlabels">
          {[40, 80, 120, 160, 200, 240, 280, 320, 360, 400].map((value) => (
            <div key={value} className="histogram-xlabel">
              {value}
            </div>
          ))}
        </div>
        <div className="histogram-x-unit">Glucose values (mg/dL)</div>
        {hoveredBar && (
          <div
            className="histogram-tooltip"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            <div className="histogram-tooltip-value">{hoveredBar.value}</div>
            <div className="histogram-tooltip-count">count : {hoveredBar.count}</div>
          </div>
        )}
      </div>
    </div>
  );
}
