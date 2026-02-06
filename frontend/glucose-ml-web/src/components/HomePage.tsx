import PageTitle from "./PageTitle";
import FilterBar from "./FilterBar";
import CompareBar from "./CompareBar";
import DatasetGrid from "./DatasetGrid";
import { useState, useEffect } from "react";
import LegendModal from "./dataset_detail/LegendModal";

const HomePage = () => {
  const [filterSelections, setFilterSelections] = useState<{
    [key: string]: string[];
  }>({});
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<any[]>([]);
  const [legendOpen, setLegendOpen] = useState(false);

  // load static datasets info
  useEffect(() => {
    fetch("/static_data/homepage_data.json")
      .then((res) => res.json())
      .then((data) => setDatasets(data));
  }, []);

  // filter!!
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
                "Insulin system": "I",
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
                case "1+ month":
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

    setFilteredDatasets(filtered);
  }, [filterSelections, datasets]);

  // callback for filter
  const handleFilterChange = (label: string, selected: string[]) => {
    setFilterSelections((prev) => ({ ...prev, [label]: selected }));
    console.log(filterSelections);
  };

  // callback for card
  const handleCardSelect = (title: string, checked: boolean) => {
    setSelectedCards((prev) =>
      checked ? [...prev, title] : prev.filter((t) => t !== title)
    );
  };

  const hasFilter = Object.values(filterSelections).some(
    (arr) => arr.length > 0
  );

  return (
    <div className="container-lg my-5">
      <PageTitle
        title="Explore glucose datasets used in AI research"
        text="Find CGM datasets, compare their structure, and download the right datasets for your study."
      />
      <LegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />

      <FilterBar
        filterSelections={filterSelections}
        onFilterChange={handleFilterChange}
        filterButtonEnabled={hasFilter}
        onLegendClick={() => setLegendOpen(true)}
      />
      <CompareBar />
      <DatasetGrid
        datasets={filteredDatasets}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
      />
    </div>
  );
};

export default HomePage;
