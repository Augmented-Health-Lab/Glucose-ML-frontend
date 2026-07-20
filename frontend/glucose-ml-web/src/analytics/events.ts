import { trackEvent } from "./google-analytics.ts";
import {
  filterPublicDatasetNames,
  getPublicDatasetName,
} from "./public-datasets.ts";

export function serializeDatasetNames(datasetNames: string[]) {
  return filterPublicDatasetNames(datasetNames)
    .sort((a, b) => a.localeCompare(b))
    .join("|");
}

export function getDestinationHostname(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.hostname
      : "unknown";
  } catch {
    return "unknown";
  }
}

export const trackFilterChange = (parameters: {
  filterName: string;
  filterValue: string;
  action: "add" | "remove";
  activeFilterCount: number;
  resultCount: number;
}) => trackEvent("filter_change", {
  filter_name: parameters.filterName,
  filter_value: parameters.filterValue,
  action: parameters.action,
  active_filter_count: parameters.activeFilterCount,
  result_count: parameters.resultCount,
});

export const trackFilterClear = (clearedFilterCount: number, resultCount: number) =>
  trackEvent("filter_clear", {
    cleared_filter_count: clearedFilterCount,
    result_count: resultCount,
  });

export const trackDatasetOpen = (
  datasetName: string,
  origin: "home" | "compare"
) => {
  const approvedDatasetName = getPublicDatasetName(datasetName);
  if (!approvedDatasetName) return;
  trackEvent("dataset_open", {
    dataset_name: approvedDatasetName,
    origin,
  });
};

export const trackCompareSelectionChange = (
  action: "add" | "remove" | "clear",
  selectionCount: number,
  datasetName?: string
) => trackEvent("compare_selection_change", {
  action,
  selection_count: selectionCount,
  dataset_name: getPublicDatasetName(datasetName),
});

export const trackCompareStart = (datasetNames: string[]) => {
  const approvedDatasetNames = filterPublicDatasetNames(datasetNames);
  trackEvent("compare_start", {
    selection_count: approvedDatasetNames.length,
    dataset_names: serializeDatasetNames(approvedDatasetNames),
  });
};

export const trackCompareSectionToggle = (
  section: "population" | "sources" | "cgm",
  expanded: boolean
) => trackEvent("compare_section_toggle", {
  section,
  state: expanded ? "expanded" : "collapsed",
});

export const trackDetailViewChange = (
  datasetName: string,
  view: "histogram" | "time_in_range"
) => {
  const approvedDatasetName = getPublicDatasetName(datasetName);
  if (!approvedDatasetName) return;
  trackEvent("detail_view_change", {
    dataset_name: approvedDatasetName,
    view,
  });
};

export const trackDatasetAction = (
  datasetName: string,
  action: "download" | "request_access" | "source" | "helper_scripts",
  destinationUrl: string
) => {
  const approvedDatasetName = getPublicDatasetName(datasetName);
  if (!approvedDatasetName) return;
  trackEvent("dataset_action", {
    dataset_name: approvedDatasetName,
    action,
    destination_hostname: getDestinationHostname(destinationUrl),
  });
};

export const trackGuide = (
  action: "open" | "close",
  screen: "home" | "compare" | "dataset_detail"
) => trackEvent(action === "open" ? "guide_open" : "guide_close", { screen });

export const trackContentLoadError = (
  screen: "home" | "compare" | "dataset_detail",
  category: "static_data" | "dataset_not_found" | "missing_dataset_id"
) => trackEvent("content_load_error", { screen, category });
