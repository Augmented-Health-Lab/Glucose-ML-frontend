import { useId, useMemo } from "react";
import {
  CHART_HEIGHT,
  CHART_PLOT,
  CHART_SERIES_STYLES,
  CHART_WIDTH,
  createLinePath,
  scaleGlucose,
  scaleHour,
  type BackgroundCgmChartData,
  type BackgroundCgmGroupKey,
} from "./background-cgm-chart";

type Props = {
  data: BackgroundCgmChartData;
  visibleGroupKeys: BackgroundCgmGroupKey[];
};

const yTicks = Array.from({ length: 10 }, (_, index) => index * 40);
const xTicks = [
  { hour: 0, label: "12:00AM" },
  { hour: 6, label: "06:00AM" },
  { hour: 12, label: "12:00PM" },
  { hour: 18, label: "6:00PM" },
  { hour: 24, label: "12:00AM" },
];
const legendX: Record<BackgroundCgmGroupKey, number> = {
  t1d: 105,
  t2d: 385,
  pred: 665,
  nd: 930,
};

export default function BackgroundCgmChart({
  data,
  visibleGroupKeys,
}: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const clipPathId = useId();
  const seriesPaths = useMemo(
    () =>
      new Map(
        data.series.map((series) => [
          series.key,
          createLinePath(series.points),
        ])
      ),
    [data.series]
  );

  return (
    <svg
      className="background-timeseries__svg"
      viewBox="0 0 1200 720"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={titleId}>Illustrative 24-Hour CGM Patterns</title>
      <desc id={descriptionId}>
        Synthetic glucose patterns illustrating Type 1, Type 2, prediabetes,
        and no-diabetes groups across 24 hours. These points do not represent
        study participants. Gray reference lines mark the target range from 70
        to 180 milligrams per deciliter.
      </desc>

      <rect width={CHART_WIDTH} height={CHART_HEIGHT} rx="20" fill="#ffffff" />

      <text
        x={CHART_WIDTH / 2}
        y="38"
        fill="#111111"
        fontSize="25"
        fontWeight="500"
        textAnchor="middle"
      >
        Illustrative 24-Hour CGM Patterns
      </text>

      {(Object.keys(CHART_SERIES_STYLES) as BackgroundCgmGroupKey[]).map(
        (key) => {
          const style = CHART_SERIES_STYLES[key];
          const x = legendX[key];

          return (
            <g key={key}>
              <line
                x1={x}
                x2={x + 42}
                y1="65"
                y2="65"
                stroke={style.color}
                strokeWidth="3"
                strokeDasharray={style.dashArray}
              />
              <text x={x + 52} y="70" fill="#222222" fontSize="15">
                {style.legendLabel}
              </text>
            </g>
          );
        }
      )}

      <defs>
        <clipPath id={clipPathId}>
          <rect
            x={CHART_PLOT.left}
            y={CHART_PLOT.top}
            width={CHART_PLOT.right - CHART_PLOT.left}
            height={CHART_PLOT.bottom - CHART_PLOT.top}
          />
        </clipPath>
      </defs>

      {[70, 180].map((threshold) => {
        const y = scaleGlucose(threshold);

        return (
          <g key={threshold}>
            <line
              x1={CHART_PLOT.left}
              x2={CHART_PLOT.right}
              y1={y}
              y2={y}
              stroke="#828181"
              strokeWidth="1.6"
            />
            <text
              x={CHART_PLOT.right + 12}
              y={y + 5}
              fill="#737373"
              fontSize="17"
              fontWeight="700"
            >
              {threshold}
            </text>
          </g>
        );
      })}

      <line
        x1={CHART_PLOT.left}
        x2={CHART_PLOT.left}
        y1={CHART_PLOT.top}
        y2={CHART_PLOT.bottom}
        stroke="#111111"
        strokeWidth="1.6"
      />
      <line
        x1={CHART_PLOT.left}
        x2={CHART_PLOT.right}
        y1={CHART_PLOT.bottom}
        y2={CHART_PLOT.bottom}
        stroke="#111111"
        strokeWidth="1.6"
      />

      {yTicks.map((tick) => {
        const y = scaleGlucose(tick);

        return (
          <g key={tick}>
            <line
              x1={CHART_PLOT.left - 6}
              x2={CHART_PLOT.left}
              y1={y}
              y2={y}
              stroke="#111111"
              strokeWidth="1.4"
            />
            <text
              x={CHART_PLOT.left - 14}
              y={y + 5}
              fill="#111111"
              fontSize="16"
              textAnchor="end"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {xTicks.map((tick) => {
        const x = scaleHour(tick.hour);

        return (
          <g key={tick.hour}>
            <line
              x1={x}
              x2={x}
              y1={CHART_PLOT.bottom}
              y2={CHART_PLOT.bottom + 7}
              stroke="#111111"
              strokeWidth="1.4"
            />
            <text
              x={x}
              y={CHART_PLOT.bottom + 29}
              fill="#111111"
              fontSize="16"
              textAnchor="middle"
            >
              {tick.label}
            </text>
          </g>
        );
      })}

      <g clipPath={`url(#${clipPathId})`}>
        {data.series.map((series) => {
          if (!visibleGroupKeys.includes(series.key)) return null;
          const style = CHART_SERIES_STYLES[series.key];

          return (
            <path
              key={series.key}
              d={seriesPaths.get(series.key)}
              fill="none"
              stroke={style.color}
              strokeWidth="2.2"
              strokeDasharray={style.dashArray}
              strokeLinecap="butt"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>

      <text
        x={(CHART_PLOT.left + CHART_PLOT.right) / 2}
        y="704"
        fill="#111111"
        fontSize="20"
        textAnchor="middle"
      >
        Time of Day
      </text>
      <text
        x="25"
        y={(CHART_PLOT.top + CHART_PLOT.bottom) / 2}
        fill="#111111"
        fontSize="20"
        textAnchor="middle"
        transform={`rotate(-90 25 ${
          (CHART_PLOT.top + CHART_PLOT.bottom) / 2
        })`}
      >
        Glucose (mg/dL)
      </text>
    </svg>
  );
}
