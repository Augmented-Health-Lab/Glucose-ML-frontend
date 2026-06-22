import {
  GLUCOSE_RANGE_DEFINITIONS,
  GLUCOSE_RANGE_ORDER,
} from "../../data/glucose-ranges.ts";
import type { CompareDataset, RangeKey } from "../../types/dataset";

const RANGE_CLASS: Record<RangeKey, string> = {
  very_low: "compare-range__segment--very-low",
  low: "compare-range__segment--low",
  target: "compare-range__segment--target",
  high: "compare-range__segment--high",
  very_high: "compare-range__segment--very-high",
};

function formatRangeValue(value: number | undefined): string {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${numeric.toFixed(1)}%`;
}

function makeTooltipId(title: string): string {
  return `compare-range-tooltip-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

const RangeBars = ({ datasets }: { datasets: CompareDataset[] }) => {
  return (
    <div className="compare-range">
      <div className="compare-range__legend">
        {GLUCOSE_RANGE_ORDER.map((key) => (
          <span key={key}>
            <i className={`compare-range__swatch ${RANGE_CLASS[key]}`} />
            {GLUCOSE_RANGE_DEFINITIONS[key].title}{" "}
            <small>{GLUCOSE_RANGE_DEFINITIONS[key].range}</small>
          </span>
        ))}
      </div>
      <div className="compare-range__bars">
        {datasets.map((dataset) => {
          const tooltipId = makeTooltipId(dataset.title);

          return (
            <div
              className="compare-range__bar-wrap"
              key={dataset.title}
            >
              <div
                className="compare-range__bar"
                aria-label={`${dataset.title} glucose ranges`}
                aria-describedby={tooltipId}
                tabIndex={0}
              >
                {GLUCOSE_RANGE_ORDER.map((key) => (
                  <span
                    key={key}
                    className={`compare-range__segment ${RANGE_CLASS[key]}`}
                    style={{
                      height: `${Math.max(Number(dataset.tir[key] || 0), 1)}%`,
                    }}
                  />
                ))}
              </div>
              <div
                className="compare-range__tooltip"
                id={tooltipId}
                role="tooltip"
              >
                <div className="compare-range__tooltip-title">
                  {dataset.title}
                </div>
                <div className="compare-range__tooltip-content">
                  {GLUCOSE_RANGE_ORDER.map((key) => (
                    <div key={key} className="compare-range__tooltip-item">
                      <div className="compare-range__tooltip-label-wrap">
                        <span
                          className={`compare-range__tooltip-swatch ${RANGE_CLASS[key]}`}
                        />
                        <span className="compare-range__tooltip-label">
                          {GLUCOSE_RANGE_DEFINITIONS[key].title}
                        </span>
                      </div>
                      <span className="compare-range__tooltip-value">
                        {formatRangeValue(dataset.tir[key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RangeBars;
