import type { HomeDataset } from "../../types/dataset";

/**
 * Pure extraction of the home page's filter predicate. Used both by the
 * render-time `useMemo` in `HomePage` and — critically — by its filter
 * change handlers, which need the *post-change* result count before React
 * has committed the new `filterSelections` state. Calling this function
 * again with the next filter state (rather than reading `filteredDatasets`
 * from the previous render) is what keeps `result_count` accurate.
 *
 * Behavior must stay identical to the inline version this replaced: same
 * category keys, same value maps, same AND-across-categories and
 * AND-within-category (for multi-select categories) semantics.
 */
export function filterDatasets(
  datasets: HomeDataset[],
  filterSelections: { [key: string]: string[] }
): HomeDataset[] {
  if (Object.values(filterSelections).every((arr) => arr.length === 0)) {
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
            const filterValue = selectedValues[0];

            switch (filterValue) {
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
            const filterValue = selectedValues[0];
            switch (filterValue) {
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

          case "Access": {
            const filterValue = selectedValues[0];
            return dataset.access === filterValue;
          }

          default:
            return true;
        }
      }
    );
  });
}
