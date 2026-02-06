// src/components/dataset_detail/GlucoseRangeChart.tsx
import { useState, useRef } from "react";
import "./GlucoseRangeChart.css";
import type { StackedBarGroup, GlucoseRangeKey } from "../MockData";

type Props = {
  bars: StackedBarGroup[];
  yLabel?: string;
};

const ORDER: GlucoseRangeKey[] = ["VeryLow", "Low", "Target", "High", "VeryHigh"];

const LEGEND: Record<GlucoseRangeKey, { title: string; range: string }> = {
  VeryLow: { title: "Very low glucose", range: "<54mg/dL" },
  Low: { title: "Low glucose", range: "54-69mg/dL" },
  Target: { title: "Target glucose", range: "70-180mg/dL" },
  High: { title: "High glucose", range: "181-250mg/dL" },
  VeryHigh: { title: "Very high glucose", range: ">250mg/dL" },
};

function clamp0(n: unknown) {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) && x > 0 ? x : 0;
}

export default function GlucoseRangeChart({ bars, yLabel = "Percentage (%)"}: Props) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const plotAreaRef = useRef<HTMLDivElement>(null);
  const PLOT_H = 240;

  return (
    <div className="tir-wrap">
      <div className="tir-legend" aria-label="Legend">
        {ORDER.map((k) => (
          <div key={k} className="tir-legend-item">
            <span className={`tir-swatch tir-${k}`} />
            <div className="tir-legend-text-wrapper">
              <div className="tir-legend-title">{LEGEND[k].title}</div>
              <div className="tir-legend-range">{LEGEND[k].range}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tir-frame">
        <div className="tir-plot-area" ref={plotAreaRef}>
          <div className="tir-y-label">{yLabel}</div>
          <div className="tir-y-axis" />

          <div className="tir-bars" style={{ height: PLOT_H }}>
            {bars.map((b) => {
              const isHovered = hoveredBar === b.group;
              
              return (
                <div 
                  key={b.group} 
                  className="tir-col"
                  onMouseEnter={(e) => {
                    setHoveredBar(b.group);
                    if (plotAreaRef.current) {
                      const rect = plotAreaRef.current.getBoundingClientRect();
                      const barRect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({
                        x: barRect.left + barRect.width / 2 - rect.left,
                        y: barRect.top - rect.top - 150,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (plotAreaRef.current) {
                      const rect = plotAreaRef.current.getBoundingClientRect();
                      const barRect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({
                        x: barRect.left + barRect.width / 2 - rect.left,
                        y: barRect.top - rect.top - 150,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredBar(null);
                    setTooltipPosition(null);
                  }}
                >
                  <div className={`tir-bar ${isHovered ? "tir-bar-hovered" : ""}`}>
                    <div
                      className={`tir-stack ${isHovered ? "tir-stack-hovered" : ""}`}
                      style={{
                        height: `${PLOT_H}px`, 
                        display: "flex",
                        flexDirection: "column-reverse",
                      }}
                    >
                      {ORDER.map((k) => {
                        const seg = b.segments.find((s) => s.key === k);
                        const percentage = clamp0(seg?.value ?? 0);

                        return (
                          <div
                            key={`${b.group}-${k}`}
                            className={`tir-seg tir-${k} ${isHovered ? "tir-seg-hovered" : ""}`}
                            style={{ flex: Math.max(0.0001, percentage) }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hoveredBar && tooltipPosition && (() => {
            const hoveredBarData = bars.find(b => b.group === hoveredBar);
            if (!hoveredBarData) return null;
            
            return (
              <div
                className="tir-tooltip"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y}px`,
                }}
              >
                <div className="tir-tooltip-title">{hoveredBarData.group}</div>
                <div className="tir-tooltip-content">
                  {[...ORDER].reverse().map((k) => {
                    const seg = hoveredBarData.segments.find((s) => s.key === k);
                    const percentage = clamp0(seg?.value ?? 0);
                    if (percentage === 0) return null;
                    
                    return (
                      <div key={k} className="tir-tooltip-item">
                        <div className="tir-tooltip-swatch-wrapper">
                          <span className={`tir-tooltip-swatch tir-${k}`} />
                          <span className="tir-tooltip-label">{LEGEND[k].title}</span>
                        </div>
                        <span className="tir-tooltip-value">{percentage.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
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
