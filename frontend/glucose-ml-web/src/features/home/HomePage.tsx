import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../../components/app-shell/AppShell";
import PageTitle from "./PageTitle";
import FilterBar from "./FilterBar";
import CompareBar from "./CompareBar";
import DatasetGrid from "./DatasetGrid";
import LegendModal from "../dataset-detail/LegendModal";
import GuideButton from "../../components/guide-button/GuideButton";
import { fetchJson } from "../../utils/fetch-json";
import {
  canonicalDatasetName,
  findTableDataset,
  normalizeDatasetName,
} from "../../utils/dataset-names";
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
import { filterDatasets } from "./filter-datasets";
import {
  trackCompareSelectionChange,
  trackContentLoadError,
  trackFilterChange,
  trackFilterClear,
  trackGuideClose,
  trackGuideOpen,
} from "../../analytics";
import type { FilterAction, FilterCategory, FilterOption } from "../../analytics";
import "./home-page.css";

const FILTER_STORAGE_KEY = "home-filter-selections";

function readStoredFilterSelections(): { [key: string]: string[] } {
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stickyControlsRef = useRef<HTMLElement | null>(null);
  const [filterSelections, setFilterSelections] = useState<{
    [key: string]: string[];
  }>(readStoredFilterSelections);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(filterSelections)
      );
    } catch {
      // storage unavailable; filters just won't persist
    }
  }, [filterSelections]);
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
  const [stickyControlsStuck, setStickyControlsStuck] = useState(false);

  useEffect(() => {
    let animationFrame = 0;

    const updateStickyControlsState = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        const stickyControls = stickyControlsRef.current;
        if (!stickyControls) return;

        setStickyControlsStuck(
          stickyControls.getBoundingClientRect().top <= 0 && window.scrollY > 0
        );
      });
    };

    updateStickyControlsState();
    window.addEventListener("scroll", updateStickyControlsState, {
      passive: true,
    });
    window.addEventListener("resize", updateStickyControlsState);

    return () => {
      window.removeEventListener("scroll", updateStickyControlsState);
      window.removeEventListener("resize", updateStickyControlsState);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

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

        trackContentLoadError({ screen: "home", error });
        setLoadError(error instanceof Error ? error.message : String(error));
      });

    return () => controller.abort();
  }, []);

  // filter!!
  const filteredDatasets = useMemo(
    () => filterDatasets(datasets, filterSelections),
    [filterSelections, datasets]
  );

  // Set by handleFilterOptionToggle and consumed by the very next
  // handleFilterChange call. MultiSelect always invokes onOptionToggle
  // immediately before onChange from within the same synchronous click
  // handler (see MultiSelect.handleOptionClick), so this ref is never stale
  // when handleFilterChange reads it — no async work can intervene. Reusing
  // the exact `selected` array MultiSelect computed (rather than
  // re-deriving it here from category/option/action) keeps the reported
  // next state guaranteed identical to the state that actually gets
  // committed, without duplicating MultiSelect's multi vs. single-select
  // logic.
  const pendingFilterToggleRef = useRef<{
    category: FilterCategory;
    option: FilterOption;
    action: FilterAction;
  } | null>(null);

  // callback for filter option toggles (fired by MultiSelect before onChange)
  const handleFilterOptionToggle = (
    category: FilterCategory,
    option: FilterOption,
    action: FilterAction
  ) => {
    pendingFilterToggleRef.current = { category, option, action };
  };

  // callback for filter
  const handleFilterChange = (label: string, selected: string[]) => {
    const nextFilterSelections = { ...filterSelections, [label]: selected };
    const toggle = pendingFilterToggleRef.current;
    pendingFilterToggleRef.current = null;

    if (toggle && toggle.category === label) {
      trackFilterChange({
        filterCategory: toggle.category,
        filterOption: toggle.option,
        filterAction: toggle.action,
        activeFilterCount: Object.values(nextFilterSelections).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
        resultCount: filterDatasets(datasets, nextFilterSelections).length,
      });
    }

    setFilterSelections(nextFilterSelections);
  };

  // callback for clearing all filters at once (exactly one filter_clear event)
  const handleClearFilters = () => {
    const clearedFilterCount = Object.values(filterSelections).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    const nextFilterSelections = Object.fromEntries(
      Object.keys(filterSelections).map((label) => [label, [] as string[]])
    );

    trackFilterClear({
      clearedFilterCount,
      resultCount: filterDatasets(datasets, nextFilterSelections).length,
    });

    setFilterSelections(nextFilterSelections);
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

    if (nextSelectedCards.length !== selectedCards.length) {
      // `title` is always a real dataset title on the `checked` (add) path —
      // it comes straight from a rendered DatasetCard, which only ever
      // renders titles from the fetched dataset list. On the uncheck
      // (remove) path, though, `handleRemoveCompareSelection` below can
      // forward a title sourced from `selectedCards`, which is parsed
      // directly from the `?datasets=` query string with no membership
      // check. Guarding here — for both branches — keeps a stale/hand-edited
      // link's arbitrary query text out of `dataset_name`, by sending only
      // the canonical spelling `canonicalDatasetName` resolves to (never the
      // raw `title`), without changing which chips render or which URL gets
      // navigated to.
      const canonicalName = canonicalDatasetName(title);
      if (canonicalName !== undefined) {
        trackCompareSelectionChange({
          selectionAction: checked ? "add" : "remove",
          datasetName: canonicalName,
          selectionCount: nextSelectedCards.length,
        });
      }
    }

    navigate(makeHomeUrl(nextSelectedCards), { replace: true });
  };

  const handleRemoveCompareSelection = (title: string) => {
    handleCardSelect(title, false);
  };

  const handleClearCompareSelection = () => {
    trackCompareSelectionChange({ selectionAction: "clear", selectionCount: 0 });
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
  const stickyControlsClassName = [
    "home-page__sticky-controls",
    stickyControlsStuck ? "home-page__sticky-controls--stuck" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AppShell>
      <div className="home-page">
        <div className="home-page__hero-bg" aria-hidden="true" />
        <main className="home-page__content">
          <PageTitle datasets={datasets} />
          <section
            ref={stickyControlsRef}
            className={stickyControlsClassName}
            aria-label="Dataset search controls"
          >
            <FilterBar
              filterSelections={filterSelections}
              onFilterChange={handleFilterChange}
              onFilterOptionToggle={handleFilterOptionToggle}
              onClearFilters={handleClearFilters}
              filterButtonEnabled={hasFilter}
              resultCount={filteredDatasets.length}
              totalCount={datasets.length}
            />
            <section className="home-page__guide-row">
              <p>
                Use checkboxes to compare datasets. Click a card for details.
              </p>
              <GuideButton
                onClick={() => {
                  trackGuideOpen({ screen: "home" });
                  setLegendOpen(true);
                }}
              />
            </section>
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
        <LegendModal
          open={legendOpen}
          onClose={() => {
            trackGuideClose({ screen: "home" });
            setLegendOpen(false);
          }}
        />
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
