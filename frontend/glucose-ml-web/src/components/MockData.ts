// src/components/MockData.ts

// -------------------------
// Filters (used by FilterBar)
// -------------------------
export const FILTERS = [
  {
    label: "Data types",
    prompt: "Select data type(s)",
    multi: true,
    options: [
      "CGM",
      "Insulin delivery",
      "Activity tracker",
      "Self report",
      "Questionnaire",
      "Lab measurements",
    ],
  },
  {
    label: "Population",
    prompt: "Select population group(s)",
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
    prompt: "Select sample size",
    multi: false,
    options: ["20+", "50+", "100+", "500+", "1000+"],
  },
  {
    label: "Access",
    prompt: "Select access type",
    multi: false,
    options: ["Public access", "Controlled"],
  },
] as const;

// -------------------------
// Home cards data (DatasetGrid / DatasetCard)
// -------------------------
export const DATASET_MOCKS = [
  {
    title: "CGMacros",
    metadata: "48 participants • 22 days • Public access",
    description:
      "A CGM dataset linking glucose patterns with macronutrient intake. Useful for studying diet–glucose relationships.",
    types: ["T2D", "PreD", "ND"],
    sources: ["G", "I", "A", "S"],
  },
  {
    title: "AI-ReadI",
    metadata: "250 participants • 14 days • Public access",
    description:
      "A 14-day real-world CGM dataset with diverse participants, supporting glucose modeling and ML research.",
    types: ["T1D", "PreD", "ND"],
    sources: ["G", "A", "M"],
  },
] as const;

export type DatasetCardMock = (typeof DATASET_MOCKS)[number];

// -------------------------
// Types expected by dataset_detail components
// -------------------------
export type DiabetesType = "T1D" | "T2D" | "PreD" | "ND";

// ✅ Used by GlucoseRangeChart.tsx
export type GlucoseRangeKey = "VeryLow" | "Low" | "Target" | "High" | "VeryHigh";

// ✅ Used by GlucoseRangeChart.tsx
export type StackedBarGroup = {
  group: "T1D" | "T2D" | "ND";
  total: number;
  segments: { key: GlucoseRangeKey; value: number }[];
};

// ✅ Used by DataSourcesSection.tsx
export type DataSource = { icon: string; name: string; detail: string };

// ✅ Used by PopulationSection.tsx
export type PopulationGroup = { type: DiabetesType; count: number; label?: string };

// Keeps your existing chart data shape for the older GlucoseRangeChart version
export type GlucoseRange = {
  range: "Very high" | "High" | "Target" | "Low" | "Very low";
  percentage: number;
};

// -------------------------
// Detail page model
// -------------------------
export interface DatasetDetail {
  id: string;
  title: string; // MUST match /dataset/${title}
  metadata: string;
  participantsTotal: number;
  populationGroups: PopulationGroup[];


  // Header
  duration: string; // e.g. "Year released: 2024"
  dateRange: string;
  fullDescription: string;

  // ✅ Needed by DatasetHeader.tsx in your newer code
  actions: {
    downloadLabel: string;
    paperLabel: string;
  };

  // Cards (your existing structure)
  population: {
    total: number;
    diabetesTypes: { type: DiabetesType; count: number }[];
    gender: string;
    ethnicities: string;
    ageRange: string;
  };

  // ✅ Needed by DemographicsSection.tsx in your newer code
  demographics: {
    gender: string;
    ethnicities: string;
    ageRange: string;
  };

  // ✅ Needed by DataSourcesSection.tsx in your newer code
  dataSources: DataSource[];

  // Existing CGM summary (older components)
  cgmData: {
    device: string;
    totalDays: number;
    totalSamples: number;
    avgDaysPerParticipant: number;
  };

  // ✅ Needed by CGMDataSection.tsx in your newer code
  cgmSummary: {
    device: string;
    totalDays: number;
    glucoseSamples: number;
    avgDaysPerParticipant: number;
  };

  // Existing chart format (older version)
  glucoseRanges: GlucoseRange[];

  // ✅ Needed by CGMDataSection.tsx + GlucoseRangeChart.tsx in your newer code
  timeInRanges: StackedBarGroup[];
}

// -------------------------
// Detail data
// -------------------------
export const DATASET_DETAILS_MAP: Record<string, DatasetDetail> = {
  CGMacros: {
    id: "cgmacros",
    title: "CGMacros",
    metadata: "48 participants • 22 days • Public access",
    duration: "Year released: 2024",
    dateRange: "",
    fullDescription:
      "A CGM dataset linking glucose patterns with macronutrient intake. Useful for studying diet–glucose relationships. A CGM dataset linking glucose patterns with macronutrient intake.",

    // ✅ for DatasetHeader
    actions: {
      downloadLabel: "Download dataset",
      paperLabel: "Link to data source",
    },

    population: {
      total: 48,
      diabetesTypes: [
        { type: "T2D", count: 6 },
        { type: "PreD", count: 19 },
        { type: "ND", count: 23 },
      ],
      gender: "23 female, 25 male",
      ethnicities: "--",
      ageRange: "22–60",
    },

    // ✅ for DemographicsSection (newer component expects dataset.demographics)
    demographics: {
      gender: "23 female, 25 male",
      ethnicities: "--",
      ageRange: "22–60 years",
    },

    dataSources: [
      { icon: "I", name: "Insulin", detail: "Basal insulin only" },
      { icon: "G", name: "CGM", detail: "Dexcom" },
      { icon: "S", name: "Self report", detail: "Meals (carbs, protein, fat)" },
      { icon: "A", name: "Activity tracker", detail: "Sleep, HRV" },
    ],

    // older field
    cgmData: {
      device: "Dexcom",
      totalDays: 22,
      totalSamples: 425,
      avgDaysPerParticipant: 22,
    },

    // ✅ newer field (matches your newer CGMDataSection)
    cgmSummary: {
      device: "Dexcom",
      totalDays: 22,
      glucoseSamples: 425,
      avgDaysPerParticipant: 22,
    },

    // older chart field (kept so older chart code still works)
    glucoseRanges: [
      { range: "Very high", percentage: 4 },
      { range: "High", percentage: 10 },
      { range: "Target", percentage: 65 },
      { range: "Low", percentage: 15 },
      { range: "Very low", percentage: 6 },
    ],
    participantsTotal: 48,
    populationGroups: [
      { type: "T2D", count: 6, label: "T2D" },
      { type: "PreD", count: 19, label: "PreD" },
      { type: "ND", count: 23, label: "ND" },
    ],


    // ✅ newer stacked bars (15 / 65 / 20)
    timeInRanges: [
      {
        group: "T1D",
        total: 15,
        segments: [
          { key: "VeryLow", value: 2 },
          { key: "Low", value: 4 },
          { key: "Target", value: 6 },
          { key: "High", value: 2 },
          { key: "VeryHigh", value: 1 },
        ],
      },
      {
        group: "T2D",
        total: 65,
        segments: [
          { key: "VeryLow", value: 2 },
          { key: "Low", value: 6 },
          { key: "Target", value: 40 },
          { key: "High", value: 12 },
          { key: "VeryHigh", value: 5 },
        ],
      },
      {
        group: "ND",
        total: 20,
        segments: [
          { key: "VeryLow", value: 1 },
          { key: "Low", value: 4 },
          { key: "Target", value: 12 },
          { key: "High", value: 2 },
          { key: "VeryHigh", value: 1 },
        ],
      },
    ],
  },

};

// ✅ Needed by DatasetDetail.tsx error: missing export member 'mockCGMacros'
export const mockCGMacros = DATASET_DETAILS_MAP.CGMacros;

// Optional helper
export function getDatasetDetailByTitle(title: string): DatasetDetail | null {
  return DATASET_DETAILS_MAP[title] ?? null;
}
