import type { HomeDataset } from "../../types/dataset";

export type FilterSelections = Record<string, string[]>;

export function filterHomeDatasets(
  datasets: HomeDataset[],
  filterSelections: FilterSelections
): HomeDataset[] {
  if (Object.values(filterSelections).every((values) => values.length === 0)) {
    return datasets;
  }
  return datasets.filter((dataset) => {
    return Object.entries(filterSelections).every(
      ([filterLabel, selectedValues]) => {
        if (selectedValues.length === 0) return true;

        switch (filterLabel) {
          case "Data Sources": {
            const sourceMap: Record<string, string> = {
              "Continuous Glucose Monitor (CGM)": "G",
              "Insulin Delivery System": "I",
              "Wearable Tracker": "W",
              "Mobile / Manual logs": "M",
              Questionnaire: "Q",
              "Clinical measurements": "C",
            };
            return selectedValues.every((filterValue) =>
              dataset.sources.includes(sourceMap[filterValue])
            );
          }

          case "Population": {
            const typeMap: Record<string, string> = {
              T1D: "T1D",
              T2D: "T2D",
              Prediabetic: "PreD",
              "Non diabetic": "ND",
            };
            return selectedValues.every((filterValue) =>
              dataset.types.includes(typeMap[filterValue])
            );
          }

          case "Study duration": {
            if (dataset.days === "TBD") return false;
            const numDays = Number(dataset.days);
            switch (selectedValues[0]) {
              case "7+ days":
                return numDays >= 7;
              case "14+ days":
                return numDays >= 14;
              case "1 month":
                return numDays >= 30;
              case "2+ months":
                return numDays >= 60;
              default:
                return false;
            }
          }

          case "Sample size": {
            switch (selectedValues[0]) {
              case "20+":
                return dataset.participants >= 20;
              case "50+":
                return dataset.participants >= 50;
              case "100+":
                return dataset.participants >= 100;
              case "500+":
                return dataset.participants >= 500;
              case "1000+":
                return dataset.participants >= 1000;
              default:
                return false;
            }
          }

          case "Access":
            return dataset.access === selectedValues[0];
          default:
            return true;
        }
      }
    );
  });
}
