export type DatasetCountry = {
  label: string;
  icon: string;
};

export const COUNTRIES = {
  spain: { label: "Spain", icon: "/figma-assets/icon-spain.png" },
  switzerland: { label: "Switzerland", icon: "/figma-assets/icon-switzerland.png" },
  china: { label: "China", icon: "/figma-assets/icon-china.png" },
  chile: { label: "Chile", icon: "/figma-assets/icon-chile.png" },
  uk: { label: "United Kingdom", icon: "/figma-assets/icon-united-kingdom.png" },
  us: { label: "United States", icon: "/figma-assets/icon-united-states.png" },
} as const satisfies Record<string, DatasetCountry>;

// Keys are dataset titles normalized by normalizeTitle below. Datasets absent
// from this map are collected in the US; dataset-country.test.ts checks that
// assumption against the country stated in each dataset description.
const DATASET_COUNTRIES: Record<string, DatasetCountry> = {
  colas2019: COUNTRIES.spain,
  t1diabetesgranada: COUNTRIES.spain,
  hupaucm: COUNTRIES.spain,
  d1namo: COUNTRIES.switzerland,
  shanghait1dm: COUNTRIES.china,
  shanghait2dm: COUNTRIES.china,
  uchtt1dm: COUNTRIES.chile,
  t1duom: COUNTRIES.uk,
  brist1dopen: COUNTRIES.uk,
};

export function normalizeTitle(title: string): string {
  return title.replace(/[\s_-]+/g, "").toLowerCase();
}

export function getDatasetCountry(datasetTitle: string): DatasetCountry {
  return DATASET_COUNTRIES[normalizeTitle(datasetTitle)] ?? COUNTRIES.us;
}
