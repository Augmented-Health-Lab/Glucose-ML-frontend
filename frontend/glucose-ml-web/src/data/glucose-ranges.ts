import type { GlucoseRangeKey, RangeKey } from "../types/dataset";

export type GlucoseRangeDefinition = {
  detailKey: GlucoseRangeKey;
  title: string;
  range: string;
  label: string;
};

export const GLUCOSE_RANGE_ORDER: RangeKey[] = [
  "very_low",
  "low",
  "target",
  "high",
  "very_high",
];

export const GLUCOSE_RANGE_DEFINITIONS: Record<
  RangeKey,
  GlucoseRangeDefinition
> = {
  very_low: {
    detailKey: "VeryLow",
    title: "Very low glucose",
    range: "<55 mg/dL",
    label: "Very low glucose (<55 mg/dL)",
  },
  low: {
    detailKey: "Low",
    title: "Low glucose",
    range: "55-69 mg/dL",
    label: "Low glucose (55-69 mg/dL)",
  },
  target: {
    detailKey: "Target",
    title: "Target glucose",
    range: "70-180 mg/dL",
    label: "Target glucose (70-180 mg/dL)",
  },
  high: {
    detailKey: "High",
    title: "High glucose",
    range: "181-250 mg/dL",
    label: "High glucose (181-250 mg/dL)",
  },
  very_high: {
    detailKey: "VeryHigh",
    title: "Very high glucose",
    range: ">250 mg/dL",
    label: "Very high glucose (>250 mg/dL)",
  },
};

export const GLUCOSE_DETAIL_RANGE_ORDER = GLUCOSE_RANGE_ORDER.map(
  (key) => GLUCOSE_RANGE_DEFINITIONS[key].detailKey
);

export const GLUCOSE_DETAIL_RANGE_DEFINITIONS = Object.fromEntries(
  GLUCOSE_RANGE_ORDER.map((key) => {
    const definition = GLUCOSE_RANGE_DEFINITIONS[key];
    return [definition.detailKey, definition];
  })
) as Record<GlucoseRangeKey, GlucoseRangeDefinition>;
