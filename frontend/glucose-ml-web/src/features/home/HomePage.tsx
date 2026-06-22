import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../../components/app-shell/AppShell";
import PageTitle from "./PageTitle";
import FilterBar from "./FilterBar";
import CompareBar from "./CompareBar";
import DatasetGrid from "./DatasetGrid";
import LegendModal from "../dataset-detail/LegendModal";
import GuideButton from "../../components/guide-button/GuideButton";
import { fetchJson } from "../../utils/fetch-json";
import { findTableDataset, normalizeDatasetName } from "../../utils/dataset-names";
import {
  makeHomeUrl,
  MAX_COMPARE_DATASETS,
  parseSelectedDatasets,
} from "../../utils/compare-data";
import type {
  GlucoseDistributionByDataset,
  HomeDataset,
  TableDataset,
} from "../../types/dataset";
import type { DatasetCardProps } from "./DatasetCard";
import "./home-page.css";

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filterSelections, setFilterSelections] = useState<{
    [key: string]: string[];
  }>({});
  const selectedCards = useMemo(
    () => parseSelectedDatasets(location.search),
    [location.search]
  );
  const [datasets, setDatasets] = useState<HomeDataset[]>([]);
  const [tableRows, setTableRows] = useState<TableDataset[]>([]);
  const [glucoseDistributionMap, setGlucoseDistributionMap] =
    useState<GlucoseDistributionByDataset>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);

  // load static datasets info
  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchJson<HomeDataset[]>("/static_data/homepage_data.json", controller.signal),
      fetchJson<TableDataset[]>(
        "/static_data/table1_detail_data.json",
        controller.signal
      ),
      fetchJson<GlucoseDistributionByDataset>(
        "/static_data/dataset_card_glucose_distribution.json",
        controller.signal
      ),
    ])
      .then(([homeData, tableData, glucoseDistributionData]) => {
        setDatasets(homeData);
        setTableRows(tableData);
        setGlucoseDistributionMap(glucoseDistributionData);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLoadError(error instanceof Error ? error.message : String(error));
      });

    return () => controller.abort();
  }, []);

  // filter!!
  const filteredDatasets = useMemo(() => {
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
  }, [filterSelections, datasets]);

  // callback for filter
  const handleFilterChange = (label: string, selected: string[]) => {
    setFilterSelections((prev) => ({ ...prev, [label]: selected }));
  };

  // callback for card
  const handleCardSelect = (title: string, checked: boolean) => {
    let nextSelectedCards: string[];

    if (checked) {
      if (
        selectedCards.includes(title) ||
        selectedCards.length >= MAX_COMPARE_DATASETS
      ) {
        return;
      }

      nextSelectedCards = [...selectedCards, title];
    } else {
      nextSelectedCards = selectedCards.filter((t) => t !== title);
    }

    navigate(makeHomeUrl(nextSelectedCards), { replace: true });
  };

  const handleRemoveCompareSelection = (title: string) => {
    handleCardSelect(title, false);
  };

  const handleClearCompareSelection = () => {
    navigate(makeHomeUrl([]), { replace: true });
  };

  const hasFilter = Object.values(filterSelections).some(
    (arr) => arr.length > 0
  );

  const cardDatasets: DatasetCardProps[] = useMemo(
    () =>
      filteredDatasets.map((dataset) => {
        const table = findTableDataset(tableRows, dataset.title);
        const distribution = findDatasetRecord(
          glucoseDistributionMap,
          dataset.title,
          table?.name
        );

        return {
          ...dataset,
          participants: table?.total ?? dataset.participants,
          year: table?.["year release"],
          distribution,
        };
      }),
    [filteredDatasets, glucoseDistributionMap, tableRows]
  );

  return (
    <AppShell>
      <div className="home-page">
        <div className="home-page__hero-bg" aria-hidden="true" />
        <main className="home-page__content">
          <PageTitle datasets={datasets} />
          <FilterBar
            filterSelections={filterSelections}
            onFilterChange={handleFilterChange}
            filterButtonEnabled={hasFilter}
            resultCount={filteredDatasets.length}
            totalCount={datasets.length}
          />
          <section className="home-page__guide-row">
            <p>Use checkboxes to compare datasets. Click a card for details.</p>
            <GuideButton onClick={() => setLegendOpen(true)} />
          </section>
          {loadError && (
            <p className="home-page__error" role="alert">
              Unable to load datasets: {loadError}
            </p>
          )}
          <DatasetGrid
            datasets={cardDatasets}
            selectedCards={selectedCards}
            selectionLimitReached={
              selectedCards.length >= MAX_COMPARE_DATASETS
            }
            onCardSelect={handleCardSelect}
          />
        </main>
        <LegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
        <CompareBar
          selectedCards={selectedCards}
          onRemoveSelection={handleRemoveCompareSelection}
          onClearSelection={handleClearCompareSelection}
        />
      </div>
    </AppShell>
  );
};

export default HomePage;

function findDatasetRecord<T>(
  records: Record<string, T>,
  ...names: Array<string | undefined>
): T | undefined {
  const normalizedNames = new Set(
    names.filter((name): name is string => Boolean(name)).map(normalizeDatasetName)
  );

  return Object.entries(records).find(([key]) =>
    normalizedNames.has(normalizeDatasetName(key))
  )?.[1];
}
