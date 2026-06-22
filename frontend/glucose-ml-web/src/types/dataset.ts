export type RangeKey = "very_low" | "low" | "target" | "high" | "very_high";

export type HomeDataset = {
  title: string;
  participants: number;
  days: number | string;
  access: string;
  description: string;
  types: string[];
  sources: string[];
};

export type TablePopulationGroup = {
  type: string;
  count: number | null;
};

export type TableDataset = {
  name: string;
  "year release": string;
  total: number;
  male: number | null;
  female: number | null;
  Unknown?: number | null;
  "age range": string;
  Ethinicities: string;
  "CGM Device": string;
  "Total days of glucose": number | string;
  "Glucose samples": number;
  "average days per participant": number | string | null;
  data_source?: Record<string, string>;
  populationGroups?: TablePopulationGroup[];
  "Link to dataset"?: string;
  "Link to Git"?: string;
  "Links to paper"?: string;
};

export type DatasetDetailJson = Record<string, DetailDatasetJson>;

export type DetailDatasetJson = {
  title: string;
  subtitle: string;
  description: string;
  links: {
    downloadUrl: string;
    sourceUrl: string;
  };
  dataSources: {
    insulin: string;
    cgm: string;
    selfReport: string;
    activityTracker: string;
  };
  participants: {
    total: number;
    populationGroups: TablePopulationGroup[];
  };
  demographics: {
    gender: {
      female: number;
      male: number;
      other: number;
      unknown: number;
    };
    ethnicities: Record<string, number>;
    ageRangeYears: {
      min: number | null;
      max: number | null;
    };
  };
  cgmData: {
    cgmDevice: string;
    totalDaysOfGlucose: number | null;
    glucoseSamples: number | null;
    averageDaysPerParticipant: number | null;
  };
};

export type TirByType = Record<string, Partial<Record<RangeKey, number>>>;
export type TirByDataset = Record<string, TirByType>;

export type GlucoseDistributionCounts = {
  very_low: number;
  low: number;
  target: number;
  high: number;
  very_high: number;
  total: number;
};

export type GlucoseDistributionByDataset = Record<
  string,
  GlucoseDistributionCounts
>;

export type CompareDataset = {
  title: string;
  participants: string;
  ageRange: string;
  diabetesTypes: string[];
  gender: string;
  sources: {
    cgm: boolean;
    insulin: boolean;
    wearable: boolean;
    manual: boolean;
  };
  cgmDevice: string;
  glucoseSamples: string;
  daysWithCgm: string;
  averageDays: string;
  lowPercent: string;
  targetPercent: string;
  highPercent: string;
  tir: Partial<Record<RangeKey, number>>;
};

export type DiabetesType = "T1D" | "T2D" | "PreD" | "ND";

export type GlucoseRangeKey = "VeryLow" | "Low" | "Target" | "High" | "VeryHigh";

export type StackedBarGroup = {
  group: "T1D" | "T2D" | "PreD" | "ND";
  total: number;
  segments: { key: GlucoseRangeKey; value: number }[];
};

export type DataSource = { icon: string; name: string; detail: string };

export type DatasetPopulationGroup = {
  type: DiabetesType;
  count: number;
  label?: string;
};

export type GlucoseRange = {
  range: "Very high" | "High" | "Target" | "Low" | "Very low";
  percentage: number;
};

export type PublicationReference = {
  citation: string;
  url?: string;
};

export type PublicationReferencesByDataset = Record<
  string,
  PublicationReference[]
>;

export interface DatasetDetail {
  id: string;
  title: string;
  metadata: string;
  access?: string;
  participantsTotal: number;
  populationGroups: DatasetPopulationGroup[];
  duration: string;
  dateRange: string;
  fullDescription: string;
  actions: {
    downloadLabel: string;
    paperLabel: string;
  };
  datasetLink?: string;
  downloadLink?: string;
  paperLink?: string;
  publicationReferences?: PublicationReference[];
  population: {
    total: number;
    diabetesTypes: { type: DiabetesType; count: number }[];
    gender: string;
    ethnicities: string;
    ageRange: string;
  };
  demographics: {
    gender: string;
    ethnicities: string;
    ageRange: string;
  };
  dataSources: DataSource[];
  cgmData: {
    device: string;
    totalDays: number;
    totalSamples: number;
    avgDaysPerParticipant: number;
  };
  cgmSummary: {
    device: string;
    totalDays: number;
    glucoseSamples: number;
    avgDaysPerParticipant: number;
    totalDaysRange?: string;
  };
  glucoseRanges: GlucoseRange[];
  timeInRanges: StackedBarGroup[];
  histogramData?: Array<{
    bin_start: number;
    bin_end: number;
    x: number;
    y: number;
    label: string;
  }>;
}
