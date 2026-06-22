import { useLayoutEffect, useMemo, useRef, useState } from "react";
import "./glucose-distribution-bar.css";
import {
  getDistributionBoundaryTicks,
  layoutDistributionBoundaryTicks,
  type GlucoseDistributionCounts,
  type LaidOutDistributionBoundaryTick,
} from "../../utils/glucose-scale";

export type { GlucoseDistributionCounts };

interface GlucoseDistributionBarProps {
  distribution?: GlucoseDistributionCounts | null;
}

const RANGE_SEGMENTS = [
  { key: "very_low", label: "Very low, below 55 mg/dL" },
  { key: "low", label: "Low, 55 to 69 mg/dL" },
  { key: "target", label: "Target, 70 to 180 mg/dL" },
  { key: "high", label: "High, 181 to 250 mg/dL" },
  { key: "very_high", label: "Very high, above 250 mg/dL" },
] as const;

const GlucoseDistributionBar = ({
  distribution,
}: GlucoseDistributionBarProps) => {
  const ticksRef = useRef<HTMLDivElement>(null);
  const measurementRefs = useRef(new Map<string, HTMLSpanElement>());
  const [visibleTicks, setVisibleTicks] = useState<
    LaidOutDistributionBoundaryTick[]
  >([]);
  const boundaryTicks = useMemo(
    () =>
      distribution ? getDistributionBoundaryTicks(distribution) : [],
    [distribution]
  );

  useLayoutEffect(() => {
    const ticksElement = ticksRef.current;
    if (!ticksElement || boundaryTicks.length === 0) {
      return;
    }

    const updateTicks = () => {
      const chartWidth = ticksElement.getBoundingClientRect().width;
      setVisibleTicks(
        layoutDistributionBoundaryTicks(
          boundaryTicks,
          chartWidth,
          (label) =>
            measurementRefs.current
              .get(label)
              ?.getBoundingClientRect().width ?? 0
        )
      );
    };

    updateTicks();
    const resizeObserver = new ResizeObserver(updateTicks);
    resizeObserver.observe(ticksElement);

    return () => resizeObserver.disconnect();
  }, [boundaryTicks]);

  if (!distribution || distribution.total <= 0) {
    return (
      <div
        aria-label="Glucose distribution unavailable"
        className="dist-bar-wrapper"
        role="img"
      >
        <div className="dist-bar dist-bar-empty" />
      </div>
    );
  }

  const ariaLabel = `Glucose distribution. ${RANGE_SEGMENTS.map(
    ({ key, label }) => {
      const count = distribution[key];
      const percentage = ((count / distribution.total) * 100).toFixed(1);
      return `${label}: ${count.toLocaleString("en-US")} samples, ${percentage}%`;
    }
  ).join("; ")}.`;
  const measurementLabels = boundaryTicks.flatMap(({ label }) => [
    label,
    `${label} mg/dL`,
  ]);

  return (
    <div aria-label={ariaLabel} className="dist-bar-wrapper" role="img">
      <div className="dist-bar" aria-hidden="true">
        {RANGE_SEGMENTS.map(({ key }) => (
          <div
            key={key}
            className={`dist-seg dist-seg-${key.replace("_", "-")}`}
            style={{ flexGrow: distribution[key] }}
          />
        ))}
      </div>
      <div className="dist-ticks" ref={ticksRef} aria-hidden="true">
        <div className="dist-tick-measurements">
          {measurementLabels.map((label) => (
            <span
              className="dist-tick-measure"
              key={label}
              ref={(element) => {
                if (element) {
                  measurementRefs.current.set(label, element);
                } else {
                  measurementRefs.current.delete(label);
                }
              }}
            >
              {label}
            </span>
          ))}
        </div>
        {visibleTicks.map((tick) => (
          <div
            key={tick.value}
            className="dist-tick"
            style={{ left: `${tick.leftPct}%` }}
          >
            <span className="dist-tick-mark" />
            <span
              className="dist-tick-label"
              style={{ left: `calc(50% + ${tick.labelOffsetPx}px)` }}
            >
              {tick.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlucoseDistributionBar;
