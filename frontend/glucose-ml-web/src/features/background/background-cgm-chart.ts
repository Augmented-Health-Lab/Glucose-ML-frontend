export type BackgroundCgmGroupKey = "t1d" | "t2d" | "pred" | "nd";

export type BackgroundCgmPoint = {
  hour: number;
  glucose: number;
};

export type BackgroundCgmSeries = {
  key: BackgroundCgmGroupKey;
  dataset: string;
  subject: string;
  date: string;
  points: BackgroundCgmPoint[];
};

export type BackgroundCgmChartData = {
  series: BackgroundCgmSeries[];
};

type BackgroundCgmSeriesStyle = {
  label: string;
  legendLabel: string;
  color: string;
  dashArray: string;
  lineMark: string;
};

export const CHART_WIDTH = 1200;
export const CHART_HEIGHT = 720;

export const CHART_PLOT = {
  left: 82,
  right: 1110,
  top: 88,
  bottom: 646,
} as const;

export const DEFAULT_VISIBLE_GROUP_KEYS: BackgroundCgmGroupKey[] = [
  "t1d",
  "t2d",
  "pred",
  "nd",
];

export const CHART_SERIES_STYLES: Record<
  BackgroundCgmGroupKey,
  BackgroundCgmSeriesStyle
> = {
  t1d: {
    label: "Type 1",
    legendLabel: "T1D (AZT1D: Subject 11)",
    color: "#e61919",
    dashArray: "2 6",
    lineMark: ". . . .",
  },
  t2d: {
    label: "Type 2",
    legendLabel: "T2D (CGMacros: 012)",
    color: "#f58516",
    dashArray: "14 6 2 6 2 6",
    lineMark: "- .",
  },
  pred: {
    label: "Prediabetes",
    legendLabel: "PreD (CGMacros: 044)",
    color: "#ebd91a",
    dashArray: "12 8",
    lineMark: "- .",
  },
  nd: {
    label: "No Diabetes",
    legendLabel: "ND (CGMacros: 034)",
    color: "#1de04e",
    dashArray: "14 6 2 6",
    lineMark: "- .",
  },
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const formatCoordinate = (value: number) => String(Number(value.toFixed(2)));

export const toggleVisibleGroup = (
  visibleGroupKeys: BackgroundCgmGroupKey[],
  groupKey: BackgroundCgmGroupKey
): BackgroundCgmGroupKey[] => {
  if (visibleGroupKeys.includes(groupKey)) {
    return visibleGroupKeys.filter((key) => key !== groupKey);
  }

  return [...visibleGroupKeys, groupKey];
};

export const scaleHour = (hour: number) => {
  const plotWidth = CHART_PLOT.right - CHART_PLOT.left;
  return CHART_PLOT.left + (clamp(hour, 0, 24) / 24) * plotWidth;
};

export const scaleGlucose = (glucose: number) => {
  const plotHeight = CHART_PLOT.bottom - CHART_PLOT.top;
  return CHART_PLOT.bottom - (clamp(glucose, 0, 360) / 360) * plotHeight;
};

export const createLinePath = (points: BackgroundCgmPoint[]) =>
  points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${formatCoordinate(scaleHour(point.hour))} ${formatCoordinate(
        scaleGlucose(point.glucose)
      )}`;
    })
    .join(" ");
