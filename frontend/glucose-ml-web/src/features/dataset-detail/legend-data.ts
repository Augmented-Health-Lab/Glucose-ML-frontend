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
      "With Type 1, the body produces little or no insulin, and glucose levels must be actively managed through external insulin.",
    className: "legend-pop-t1d",
  },
  {
    code: "T2D",
    label: "Type 2 diabetes",
    description:
      "With Type 2, the body does not produce enough insulin or does not use insulin properly. T2D is the most common type of diabetes.",
    className: "legend-pop-t2d",
  },
  {
    code: "PreD",
    label: "Prediabetes",
    description:
      "With Prediabetes, the blood glucose levels are higher than normal but not high enough to be diagnosed with T2D.",
    className: "legend-pop-pred",
  },
  {
    code: "ND",
    label: "No diabetes",
    description: "Individuals with no diabetes or prediabetes diagnosis.",
    className: "legend-pop-nd",
  },
] as const;

export const legendDataSources = [
  {
    code: "G",
    label: "Continuous Glucose Monitoring",
    description:
      "A wearable technology that continuously measures glucose levels from the interstitial fluid just under the skin.",
  },
  {
    code: "I",
    label: "Insulin Delivery System",
    description:
      "A system for administering continuous or precise doses of insulin to manage blood glucose levels. Insulin delivery systems can include an insulin pump, insulin pen, a vial and syringe.",
  },
  {
    code: "W",
    label: "Wearable Tracker",
    description:
      "A wearable technology that continuously monitors health habits, physical activity, and physiological signals. Common wearable trackers include Fitbit, Garmin, Apple Watch, etc.",
  },
  {
    code: "M",
    label: "Manual logs",
    description:
      "User logs often through a mobile app. Common activities that are manually logged include meals, exercise events, menstrual cycles, etc.",
  },
  {
    code: "Q",
    label: "Questionnaire",
    description:
      "Surveys or interviews used to collect participant-reported information during a research study. Common information reported via questionnaires include demographics such as age, sex/gender, race/ethnicity, etc.",
  },
  {
    code: "C",
    label: "Clinical / Other Measurements",
    description:
      "Measurements obtained in the clinic such as weight, height, vital signs (e.g. blood pressure, heart rate), lab measurements (e.g. fasting glucose, hemoglobin A1C, cholesterol), and other measurements (e.g. imaging).",
  },
] as const;

export const legendAccessTiers = [
  {
    type: "Open",
    label: "Open access",
    icon: "/figma-assets/icon-public.png",
    description:
      "This access tier provides immediate access to public datasets. In this case, datasets are often released under licenses that allow for copy, redistribution, and adaptation.",
  },
  {
    type: "Controlled",
    label: "Controlled access",
    icon: "/figma-assets/icon-key-controlled.png",
    description:
      "This access tier requires prospective users to acknowledge and accept a data use agreement before datasets are made available. Datasets in this categories are public but must be requested and released directly to prospective users.",
  },
] as const;
