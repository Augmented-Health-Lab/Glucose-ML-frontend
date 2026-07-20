/**
 * Typed GA4 event helpers — the only surface feature components are allowed
 * to call. One named function per row of the Event and Parameter Reference
 * table (see `docs/superpowers/plans/2026-07-20-google-analytics-4-integration.md`).
 *
 * Every helper takes a single, fully-typed argument object built from fixed
 * literal unions, so an invalid action/section/screen/view is a compile
 * error. No helper accepts or forwards an arbitrary parameter bag — no rest
 * parameter, no untyped passthrough object — the exact set of keys sent to
 * GA4 is visible at the call site in this file.
 *
 * Normalization happens here, not in the caller: counts go through
 * `boundedCount`, dataset combinations through `serializeDatasetCombination`,
 * outbound hrefs through `getDestinationHost` (only the hostname is ever
 * sent, never the URL), and errors through `categorizeLoadError` (only one
 * of five fixed categories is ever sent, never the original message).
 *
 * This module never touches `window.gtag` directly — everything goes
 * through `sendEvent` in `./gtag.ts`.
 */

import { sendEvent } from "./gtag.ts";
import {
  boundedCount,
  serializeDatasetCombination,
  getDestinationHost,
  categorizeLoadError,
  type RouteType,
  type ScreenName,
} from "./params.ts";

// ---------------------------------------------------------------------------
// Event-local literal unions (not shared enough to belong in params.ts)
// ---------------------------------------------------------------------------

export type ScrollPercent = 25 | 50 | 75 | 90;
export type FilterAction = "add" | "remove";
export type DatasetOpenOrigin = "home" | "compare";
export type CompareSelectionAction = "add" | "remove" | "clear";
export type CompareSection = "population" | "sources" | "cgm";
export type SectionState = "expanded" | "collapsed";
export type DetailView = "histogram" | "time_in_range";
export type DatasetActionType = "download" | "request_access" | "source" | "helper_scripts";

// ---------------------------------------------------------------------------
// page_view
// ---------------------------------------------------------------------------

export interface TrackPageViewParams {
  pagePath: string;
  pageTitle: string;
  routeType: RouteType;
  /** Dataset-detail routes only. */
  datasetName?: string;
}

export function trackPageView(params: TrackPageViewParams): void {
  sendEvent("page_view", {
    page_path: params.pagePath,
    page_title: params.pageTitle,
    route_type: params.routeType,
    dataset_name: params.datasetName,
  });
}

// ---------------------------------------------------------------------------
// scroll_depth
// ---------------------------------------------------------------------------

export interface TrackScrollDepthParams {
  percent: ScrollPercent;
  routeType: RouteType;
  /** Dataset-detail routes only. */
  datasetName?: string;
}

export function trackScrollDepth(params: TrackScrollDepthParams): void {
  sendEvent("scroll_depth", {
    percent: params.percent,
    route_type: params.routeType,
    dataset_name: params.datasetName,
  });
}

// ---------------------------------------------------------------------------
// filter_change / filter_clear
// ---------------------------------------------------------------------------

export interface TrackFilterChangeParams {
  filterCategory: string;
  filterOption: string;
  filterAction: FilterAction;
  activeFilterCount: number;
  resultCount: number;
}

export function trackFilterChange(params: TrackFilterChangeParams): void {
  sendEvent("filter_change", {
    filter_category: params.filterCategory,
    filter_option: params.filterOption,
    filter_action: params.filterAction,
    active_filter_count: boundedCount(params.activeFilterCount),
    result_count: boundedCount(params.resultCount),
  });
}

export interface TrackFilterClearParams {
  clearedFilterCount: number;
  resultCount: number;
}

export function trackFilterClear(params: TrackFilterClearParams): void {
  sendEvent("filter_clear", {
    cleared_filter_count: boundedCount(params.clearedFilterCount),
    result_count: boundedCount(params.resultCount),
  });
}

// ---------------------------------------------------------------------------
// dataset_open
// ---------------------------------------------------------------------------

export interface TrackDatasetOpenParams {
  datasetName: string;
  origin: DatasetOpenOrigin;
}

export function trackDatasetOpen(params: TrackDatasetOpenParams): void {
  sendEvent("dataset_open", {
    dataset_name: params.datasetName,
    origin: params.origin,
  });
}

// ---------------------------------------------------------------------------
// compare_selection_change
// ---------------------------------------------------------------------------

/**
 * Discriminated on `selectionAction` so `datasetName` is required for
 * `add`/`remove` and unavailable for `clear` at the type level — a caller
 * cannot pass a `dataset_name` for a `clear` action even by mistake.
 */
export type TrackCompareSelectionChangeParams =
  | { selectionAction: "add" | "remove"; datasetName: string; selectionCount: number }
  | { selectionAction: "clear"; selectionCount: number };

export function trackCompareSelectionChange(params: TrackCompareSelectionChangeParams): void {
  sendEvent("compare_selection_change", {
    selection_action: params.selectionAction,
    dataset_name: params.selectionAction === "clear" ? undefined : params.datasetName,
    selection_count: boundedCount(params.selectionCount),
  });
}

// ---------------------------------------------------------------------------
// compare_start
// ---------------------------------------------------------------------------

export interface TrackCompareStartParams {
  selectionCount: number;
  datasetNames: readonly string[];
}

export function trackCompareStart(params: TrackCompareStartParams): void {
  sendEvent("compare_start", {
    selection_count: boundedCount(params.selectionCount),
    dataset_combination: serializeDatasetCombination(params.datasetNames),
  });
}

// ---------------------------------------------------------------------------
// compare_section_toggle
// ---------------------------------------------------------------------------

export interface TrackCompareSectionToggleParams {
  section: CompareSection;
  sectionState: SectionState;
}

export function trackCompareSectionToggle(params: TrackCompareSectionToggleParams): void {
  sendEvent("compare_section_toggle", {
    section: params.section,
    section_state: params.sectionState,
  });
}

// ---------------------------------------------------------------------------
// detail_view_change
// ---------------------------------------------------------------------------

export interface TrackDetailViewChangeParams {
  datasetName: string;
  detailView: DetailView;
}

export function trackDetailViewChange(params: TrackDetailViewChangeParams): void {
  sendEvent("detail_view_change", {
    dataset_name: params.datasetName,
    detail_view: params.detailView,
  });
}

// ---------------------------------------------------------------------------
// dataset_action
// ---------------------------------------------------------------------------

export interface TrackDatasetActionParams {
  datasetName: string;
  action: DatasetActionType;
  /** Raw outbound href. Only its hostname is ever sent — see `getDestinationHost`. */
  href: string;
}

export function trackDatasetAction(params: TrackDatasetActionParams): void {
  sendEvent("dataset_action", {
    dataset_name: params.datasetName,
    action: params.action,
    destination_host: getDestinationHost(params.href),
  });
}

// ---------------------------------------------------------------------------
// guide_open / guide_close
// ---------------------------------------------------------------------------

export interface TrackGuideParams {
  screen: ScreenName;
}

export function trackGuideOpen(params: TrackGuideParams): void {
  sendEvent("guide_open", { screen: params.screen });
}

export function trackGuideClose(params: TrackGuideParams): void {
  sendEvent("guide_close", { screen: params.screen });
}

// ---------------------------------------------------------------------------
// content_load_error
// ---------------------------------------------------------------------------

export interface TrackContentLoadErrorParams {
  screen: ScreenName;
  /** Arbitrary caught value; collapsed to a fixed category before sending. */
  error: unknown;
}

export function trackContentLoadError(params: TrackContentLoadErrorParams): void {
  sendEvent("content_load_error", {
    screen: params.screen,
    error_category: categorizeLoadError(params.error),
  });
}
