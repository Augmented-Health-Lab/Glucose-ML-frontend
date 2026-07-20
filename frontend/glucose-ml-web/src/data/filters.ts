export const FILTERS = [
  {
    label: "Data Sources",
    prompt: "Select a source",
    multi: true,
    options: [
      "Continuous Glucose Monitor (CGM)",
      "Insulin Delivery System",
      "Wearable Tracker",
      "Mobile / Manual logs",
      "Questionnaire",
      "Clinical measurements",
    ],
  },
  {
    label: "Population",
    prompt: "Select a group",
    multi: true,
    options: ["T1D", "T2D", "Prediabetic", "Non diabetic"],
  },
  {
    label: "Study duration",
    prompt: "Select duration",
    multi: false,
    options: ["7+ days", "14+ days", "1 month", "2+ months"],
  },
  {
    label: "Sample size",
    prompt: "Select cohort size",
    multi: false,
    options: ["20+", "50+", "100+", "500+", "1000+"],
  },
  {
    label: "Access",
    prompt: "Select access type",
    multi: false,
    options: ["Open", "Controlled"],
  },
] as const;

export type FilterName = (typeof FILTERS)[number]["label"];
export type FilterOption = (typeof FILTERS)[number]["options"][number];
