import {
  GLUCOSE_RANGE_DEFINITIONS,
  GLUCOSE_RANGE_ORDER,
} from "../../data/glucose-ranges.ts";

const rangeClassNames = {
  very_low: "legend-swatch-vlow",
  low: "legend-swatch-low",
  target: "legend-swatch-mod",
  high: "legend-swatch-high",
  very_high: "legend-swatch-vhigh",
} as const;

export const legendGlucoseRanges = [...GLUCOSE_RANGE_ORDER]
  .reverse()
  .map((key) => ({
    label: GLUCOSE_RANGE_DEFINITIONS[key].label,
    className: rangeClassNames[key],
  }));

export const legendPopulation = [
  {
    code: "T1D",
    label: "Type 1 diabetes",
    description:
      "Individuals with inability to produce insulin, causing high blood sugar (glucose) levels",
    className: "legend-pop-t1d",
  },
  {
    code: "T2D",
    label: "Type 2 diabetes",
    description: "Individuals with type 2 diabetes",
    className: "legend-pop-t2d",
  },
  {
    code: "PreD",
    label: "Prediabetes",
    description: "Individuals with prediabetes",
    className: "legend-pop-pred",
  },
  {
    code: "ND",
    label: "No diabetes",
    description: "Individuals without diabetes",
    className: "legend-pop-nd",
  },
] as const;

const sourceDescription =
  "A CGM dataset linking glucose patterns with macronutrient intake. Useful for studying diet-glucose relationships.";

export const legendDataSources = [
  { code: "G", label: "Continuous Glucose Monitoring", description: sourceDescription },
  { code: "I", label: "Insulin Delivery System", description: sourceDescription },
  { code: "W", label: "Wearable Tracker", description: sourceDescription },
  { code: "M", label: "Mobile App / Manual logs", description: sourceDescription },
  { code: "Q", label: "Questionnaire / Interview", description: sourceDescription },
  { code: "C", label: "Clinical / Other Measurements", description: sourceDescription },
] as const;
