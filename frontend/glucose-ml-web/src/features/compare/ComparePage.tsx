import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../../components/app-shell/AppShell";
import GuideButton from "../../components/guide-button/GuideButton";
import {
  trackCompareSelectionChange,
  trackContentLoadError,
  trackGuide,
} from "../../analytics/events";
import { fetchJson } from "../../utils/fetch-json";
import {
  buildCompareDataset,
  makeCompareUrl,
  makeHomeUrl,
  parseCompareDatasets,
} from "../../utils/compare-data";
import type {
  CompareDataset,
  DatasetDetailJson,
  HomeDataset,
  TableDataset,
  TirByDataset,
} from "../../types/dataset";
import ComparingChips from "./ComparingChips";
import CompareTable from "./CompareTable";
import LegendModal from "../dataset-detail/LegendModal";
import "./compare-page.css";

type LoadState =
  | { status: "loading"; data: CompareDataset[]; error: null; key: string }
  | { status: "success"; data: CompareDataset[]; error: null; key: string }
  | { status: "error"; data: CompareDataset[]; error: Error; key: string };

const ComparePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedNames = useMemo(
    () => parseCompareDatasets(location.search),
    [location.search]
  );
  const selectedKey = selectedNames.join("\u0000");
  const [legendOpen, setLegendOpen] = useState(false);
  const [state, setState] = useState<LoadState>({
    status: "loading",
    data: [],
    error: null,
    key: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchJson<HomeDataset[]>("static_data/homepage_data.json", controller.signal),
      fetchJson<TableDataset[]>(
        "static_data/table1_detail_data.json",
        controller.signal
      ),
      fetchJson<DatasetDetailJson>(
        "static_data/dataset_details.json",
        controller.signal
      ),
      fetchJson<TirByDataset>(
        "static_data/time_in_ranges_by_type.json",
        controller.signal
      ),
    ])
      .then(([homeRows, tableRows, detailMap, tirMap]) => {
        const data = selectedNames.map((name) =>
          buildCompareDataset(name, homeRows, tableRows, detailMap, tirMap)
        );
        setState({ status: "success", data, error: null, key: selectedKey });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        trackContentLoadError("compare", "static_data");
        setState({
          status: "error",
          data: [],
          error: error instanceof Error ? error : new Error(String(error)),
          key: selectedKey,
        });
      });

    return () => {
      controller.abort();
    };
  }, [selectedKey, selectedNames]);

  const isCurrentSelection = state.key === selectedKey;
  const handleRemoveDataset = (datasetName: string) => {
    const remaining = selectedNames.filter((name) => name !== datasetName);

    trackCompareSelectionChange("remove", remaining.length, datasetName);

    if (remaining.length > 0) {
      navigate(makeCompareUrl(remaining));
      return;
    }

    navigate("/");
  };

  const handleAddDataset = () => {
    navigate(makeHomeUrl(selectedNames));
  };

  const handleOpenGuide = () => {
    trackGuide("open", "compare");
    setLegendOpen(true);
  };

  const handleCloseGuide = () => {
    trackGuide("close", "compare");
    setLegendOpen(false);
  };

  return (
    <AppShell>
      <div className="glm-page compare-page">
        <main className="glm-content compare-page__content">
          <button
            type="button"
            className="compare-page__back"
            onClick={() => navigate(makeHomeUrl(selectedNames))}
          >
            <img src="/figma-assets/icon-chevron-detail.png" alt="" />
            Back
          </button>
          <header className="compare-page__header">
            <h1 className="glm-title">Compare Glucose datasets</h1>
            <p className="glm-subtitle">
              Evaluate datasets side-by-side to choose the strongest fit
            </p>
          </header>
          <div className="compare-page__tools-row">
            <ComparingChips
              datasetNames={selectedNames}
              onRemoveDataset={handleRemoveDataset}
              onAddDataset={handleAddDataset}
            />
            <GuideButton onClick={handleOpenGuide} />
          </div>
          {selectedNames.length < 2 && (
            <p className="compare-page__single-note glm-body">
              Select another dataset to compare side-by-side.
            </p>
          )}
          {state.status === "loading" || !isCurrentSelection ? (
            <p className="glm-body">Loading compare data</p>
          ) : state.status === "error" ? (
            <p className="glm-body">
              Unable to load compare data: {state.error.message}
            </p>
          ) : (
            <CompareTable datasets={state.data} />
          )}
        </main>
        <LegendModal open={legendOpen} onClose={handleCloseGuide} />
      </div>
    </AppShell>
  );
};

export default ComparePage;
