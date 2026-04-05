import PageTitle from "./PageTitle";
import FilterBar from "./FilterBar";
import CompareBar from "./CompareBar";
import DatasetGrid from "./DatasetGrid";
import LegendModal from "./dataset_detail/LegendModal";
import { useSaveScroll, restoreScroll } from "../hooks/useScrollRestoration";
import { useState, useEffect, useRef } from "react";

const FILTER_STORAGE_KEY = "homepage:filters";

function loadSavedFilters(): { [key: string]: string[] } {
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveFilters(filters: { [key: string]: string[] }) {
  try {
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // ignore
  }
}

const HomePage = () => {
  // Restore filters from sessionStorage on mount (survives back-navigation)
  const [filterSelections, setFilterSelections] = useState<{
    [key: string]: string[];
  }>(loadSavedFilters);

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<any[]>([]);
  const [legendOpen, setLegendOpen] = useState(false);

  useSaveScroll("scroll:/");

  const hasRestoredScroll = useRef(false);
  // Restore scroll position once cards are in the DOM
  useEffect(() => {
    if (filteredDatasets.length > 0 && !hasRestoredScroll.current) {
      hasRestoredScroll.current = true;
      restoreScroll("scroll:/");
    }
  }, [filteredDatasets]);

  // Load static datasets info
  useEffect(() => {
    fetch("/static_data/dataset_card_info.json")
      .then((res) => res.json())
      .then((data) => setDatasets(data));
  }, []);

  // Filter datasets
  useEffect(() => {
    if (Object.values(filterSelections).every((arr) => arr.length === 0)) {
      setFilteredDatasets(datasets);
      return;
    }

    const filtered = datasets.filter((dataset) => {
      return Object.entries(filterSelections).every(
        ([filterLabel, selectedValues]) => {
          if (selectedValues.length === 0) return true;

          switch (filterLabel) {
            case "Data types": {
              const sourceMap: Record<string, string> = {
                "Glucose Monitor": "G",
                "Insulin Delivery System": "I",
                "Wearable Tracker": "W",
                "Manual Logs": "M",
                Questionnaire: "Q",
                "Clinical Measurements": "C",
              };
              return selectedValues.every((filterValue) =>
                dataset.sources.includes(sourceMap[filterValue])
              );
            }

            case "Population": {
              const typeMap: Record<string, string> = {
                "Type 1 Diabetes": "T1D",
                "Type 2 Diabetes": "T2D",
                "Pre-Diabetes": "PreD",
                "No Diabetes": "ND",
              };
              return selectedValues.every((filterValue) =>
                dataset.types.includes(typeMap[filterValue])
              );
            }

            case "Study duration": {
              const match = String(dataset.metadata ?? "").match(/(\d+)\s*days/i);
              if (!match) return false;
              const numDays = Number(match[1]);
              const filterValue = selectedValues[0];
              switch (filterValue) {
                case "7+ days":   return numDays >= 7;
                case "14+ days":  return numDays >= 14;
                case "1+ month":  return numDays >= 30;
                case "2+ months": return numDays >= 60;
                default:          return false;
              }
            }

            case "Sample size": {
              const filterValue = selectedValues[0];
              switch (filterValue) {
                case "20+":   return dataset.participants >= 20;
                case "50+":   return dataset.participants >= 50;
                case "100+":  return dataset.participants >= 100;
                case "500+":  return dataset.participants >= 500;
                case "1000+": return dataset.participants >= 1000;
                default:      return false;
              }
            }

            case "Access": {
              return dataset.access === selectedValues[0];
            }

            default:
              return true;
          }
        }
      );
    });

    setFilteredDatasets(filtered);
  }, [filterSelections, datasets]);

  // Save filters immediately inside the setter so they're persisted
  // before React navigates away (useEffect would be too late)
  const handleFilterChange = (label: string, selected: string[]) => {
    setFilterSelections((prev) => {
      const next = { ...prev, [label]: selected };
      saveFilters(next);
      return next;
    });
  };

  const handleClear = () => {
    sessionStorage.removeItem(FILTER_STORAGE_KEY);
    setFilterSelections({});
  };

  const handleCardSelect = (title: string, checked: boolean) => {
    setSelectedCards((prev) =>
      checked ? [...prev, title] : prev.filter((t) => t !== title)
    );
  };

  const hasFilter = Object.values(filterSelections).some(
    (arr) => arr.length > 0
  );

  return (
    <div className="container-lg my-1">
      <PageTitle
        title="Accelerating data-driven research for diabetes"
        text="Explore, discover, and access public continuous glucose monitoring datasets to develop next-generation solutions for diabetes prevention and care."
      />
      <LegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />

      <FilterBar
        filterSelections={filterSelections}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
        filterButtonEnabled={hasFilter}
        onLegendClick={() => setLegendOpen(true)}
      />
      <CompareBar />
      <DatasetGrid
        datasets={filteredDatasets}
        totalDatasets={datasets.length}
        isFiltered={hasFilter}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
      />
    </div>
  );
};

export default HomePage;