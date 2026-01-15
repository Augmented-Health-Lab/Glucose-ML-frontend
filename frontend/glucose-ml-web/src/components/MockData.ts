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
];

export const DATASET_MOCKS = [
  {
    title: "CGMacros",
    metadata: "50 participants • 14 days • Public access",
    description:
      "A CGM dataset linking glucose patterns with macronutrient intake. Useful for studying diet–glucose relationships.",
    types: ["T2D", "PreD", "ND"],
    sources: ["G", "I", "A", "S", "Q", "M"],
  },
  {
    title: "AI-ReadI",
    metadata: "250 participants • 14 days • Public access",
    description:
      "A 14-day real-world CGM dataset with diverse participants, supporting glucose modeling and ML research.",
    types: ["T1D", "PreD", "ND"],
    sources: ["G", "A", "M"],
  },
  {
    title: "BIG IDEAs",
    metadata: "1000 participants • 20 days • Controlled",
    description:
      "A CGM dataset linking glucose patterns with macronutrient intake. Useful for studying diet–glucose relationships.",
    types: ["T2D", "T1D", "ND"],
    sources: ["G", "I", "S", "Q"],
  },
  {
    title: "DiaTrend",
    metadata: "250 participants • 14 days • Public access",
    description:
      "A multi-day CGM dataset offering detailed glucose time-series for trend and pattern analysis.",
    types: ["T2D", "ND"],
    sources: ["G", "I", "A", "S"],
  },
  {
    title: "T1DEXI",
    metadata: "250 participants • 14 days • Public access",
    description:
      "A 14-day CGM dataset focused on individuals with Type 1 diabetes, capturing daily glucose variability and insulin-related patterns.",
    types: ["T1D"],
    sources: ["G", "I", "M"],
  },
  {
    title: "ShanghaiT2DM",
    metadata: "250 participants • 14 days • Public access",
    description:
      "A CGM dataset of individuals with Type 2 diabetes collected under controlled research conditions for metabolic analysis.",
    types: ["T2D"],
    sources: ["G", "I", "A", "Q"],
  },
];


// DATASET DETAIL DATA

export interface DatasetDetail {
  id: string;
  title: string;
  metadata: string;
  duration: string;
  dateRange: string;
  fullDescription: string;
  types: string[];
  
  population: {
    total: number;
    hba1cGroups: { type: string; count: number }[];
    gender: string;
    ethnicities: string;
    ageRange: string;
  };
  
  dataSources: {
    icon: string;
    name: string;
    detail: string;
  }[];
  
  cgmData: {
    device: string;
    totalDays: number;
    totalSamples: number;
    avgDaysPerParticipant: number;
  };
  
  glucoseRanges: {
    range: string;
    percentage: number;
  }[];
}

// Detailed data for each dataset
export const DATASET_DETAILS_MAP: Record<string, DatasetDetail> = {
  "CGMacros": {
    id: "cgmacros",
    title: "CGMacros",
    metadata: "50 participants • 14 days • Public access",
    duration: "12 weeks",
    dateRange: "14 September 2020 - 14 December 2020",
    fullDescription: "A CGM dataset linking glucose patterns with macronutrient intake. Useful for studying diet-glucose relationships. A CGM dataset linking glucose patterns with macronutrient intake. Useful for studying diet-glucose relationships. A CGM dataset linking glucose patterns with macronutrient intake. Useful for studying diet-glucose relationships.",
    types: ["T2D", "PreD", "ND"],
    
    population: {
      total: 48,
      hba1cGroups: [
        { type: "T2D", count: 6 },
        { type: "PreD", count: 19 },
        { type: "ND", count: 23 }
      ],
      gender: "23 female, 25 male",
      ethnicities: "--",
      ageRange: "22-60"
    },
    
    dataSources: [
      { icon: "I", name: "Insulin", detail: "Basal insulin only" },
      { icon: "G", name: "CGM", detail: "Dexcom" },
      { icon: "S", name: "Self report", detail: "Meals (Carbs, proteins, fat)" },
      { icon: "A", name: "Activity tracker", detail: "Sleep, HRV" }
    ],
    
    cgmData: {
      device: "Dexcom",
      totalDays: 22,
      totalSamples: 425,
      avgDaysPerParticipant: 20
    },
    
    glucoseRanges: [
      { range: "<70mg/dL", percentage: 4 },
      { range: "70-140mg/dL", percentage: 75 },
      { range: "140-180mg/dL", percentage: 10 },
      { range: "180-250mg/dL", percentage: 6 },
      { range: ">250mg/dL", percentage: 5 }
    ]
  },
  
  "AI-ReadI": {
    id: "ai-readi",
    title: "AI-ReadI",
    metadata: "250 participants • 14 days • Public access",
    duration: "14 days",
    dateRange: "1 January 2021 - 14 January 2021",
    fullDescription: "A 14-day real-world CGM dataset with diverse participants, supporting glucose modeling and ML research.",
    types: ["T1D", "PreD", "ND"],
    
    population: {
      total: 250,
      hba1cGroups: [
        { type: "T1D", count: 80 },
        { type: "PreD", count: 90 },
        { type: "ND", count: 80 }
      ],
      gender: "125 female, 125 male",
      ethnicities: "Diverse",
      ageRange: "18-65"
    },
    
    dataSources: [
      { icon: "G", name: "CGM", detail: "Dexcom" },
      { icon: "A", name: "Activity tracker", detail: "Fitbit" },
      { icon: "M", name: "Meals", detail: "Self-reported" }
    ],
    
    cgmData: {
      device: "Dexcom",
      totalDays: 14,
      totalSamples: 3500,
      avgDaysPerParticipant: 14
    },
    
    glucoseRanges: [
      { range: "<70mg/dL", percentage: 5 },
      { range: "70-140mg/dL", percentage: 65 },
      { range: "140-180mg/dL", percentage: 15 },
      { range: "180-250mg/dL", percentage: 10 },
      { range: ">250mg/dL", percentage: 5 }
    ]
  },
};