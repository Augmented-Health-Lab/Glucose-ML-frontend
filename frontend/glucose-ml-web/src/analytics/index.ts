/**
 * Public barrel for `src/analytics/`. This is the **only** import path
 * feature code should use — never `./gtag`, never `./params` directly for
 * sending, and never `window.gtag`.
 *
 * Deliberately re-exports only named, typed event helpers plus `initAnalytics`
 * and the shared value domains. It must NOT re-export the raw, unchecked
 * event-sending function from `./gtag.ts`, nor any test-only escape hatch
 * used to reset or fake that module's internal state — application code
 * must never be able to reach a generic sender through this barrel.
 */

export {
  trackPageView,
  trackScrollDepth,
  trackFilterChange,
  trackFilterClear,
  trackDatasetOpen,
  trackCompareSelectionChange,
  trackCompareStart,
  trackCompareSectionToggle,
  trackDetailViewChange,
  trackDatasetAction,
  trackGuideOpen,
  trackGuideClose,
  trackContentLoadError,
} from "./events.ts";

export type {
  TrackPageViewParams,
  TrackScrollDepthParams,
  TrackFilterChangeParams,
  TrackFilterClearParams,
  TrackDatasetOpenParams,
  TrackCompareSelectionChangeParams,
  TrackCompareStartParams,
  TrackCompareSectionToggleParams,
  TrackDetailViewChangeParams,
  TrackDatasetActionParams,
  TrackGuideParams,
  TrackContentLoadErrorParams,
  ScrollPercent,
  FilterAction,
  FilterCategory,
  FilterOption,
  DatasetOpenOrigin,
  CompareSelectionAction,
  CompareSection,
  SectionState,
  DetailView,
  DatasetActionType,
  GuideScreenName,
} from "./events.ts";

export { initAnalytics } from "./gtag.ts";

export {
  ROUTE_TYPES,
  ENVIRONMENTS,
  ERROR_CATEGORIES,
  SCREEN_NAMES,
} from "./params.ts";

export type { RouteType, Environment, ErrorCategory, ScreenName } from "./params.ts";

export { default as AnalyticsRouteTracker } from "./AnalyticsRouteTracker.tsx";
