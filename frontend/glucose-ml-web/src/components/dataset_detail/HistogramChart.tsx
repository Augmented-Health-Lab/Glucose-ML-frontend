import { useState, useRef } from "react";
import "./HistogramChart.css";

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
    return "#F276AD"; // Bright pink
  } else if (label.includes("Low glucose")) {
    return "#EFA1C8"; // Light pink
  } else if (label.includes("Target glucose")) {
    return "#91EFDE"; // Teal/aqua
  } else if (label.includes("High glucose")) {
    return "#CAB0EE"; // Light purple
  } else if (label.includes("Very high glucose")) {
    return "#B489F0"; // Dark purple
  }
  return "#CCCCCC"; // Default gray
}

// Format legend text based on label - returns title and range separately
function formatLegendText(label: string): { title: string; range: string } {
  if (label.includes("Very low glucose")) {
    return { title: "Very low glucose", range: "<54mg/dL" };
  } else if (label.includes("Low glucose")) {
    return { title: "Low glucose", range: "54-69mg/dL" };
  } else if (label.includes("Target glucose")) {
    return { title: "Target glucose", range: "70-180mg/dL" };
  } else if (label.includes("High glucose") && !label.includes("Very high")) {
    return { title: "High glucose", range: "181-250mg/dL" };
  } else if (label.includes("Very high glucose")) {
    return { title: "Very high glucose", range: ">250mg/dL" };
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
    const order = [
      "Very low glucose",
      "Low glucose",
      "Target glucose",
      "High glucose",
      "Very high glucose"
    ];
    const indexA = order.findIndex(o => a.includes(o));
    const indexB = order.findIndex(o => b.includes(o));
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
