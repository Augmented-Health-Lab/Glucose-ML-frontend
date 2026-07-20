type AnalyticsPrimitive = string | number | boolean;

export type AnalyticsParameters = Record<
  string,
  AnalyticsPrimitive | undefined
>;

export type AnalyticsEventMap = {
  page_view: {
    page_path: string;
    page_location: string;
    page_referrer?: string;
    page_title: string;
    route_type: string;
    dataset_name?: string;
  };
  scroll_depth: {
    page_path: string;
    route_type: string;
    percent_scrolled: number;
    dataset_name?: string;
  };
  filter_change: {
    filter_name: string;
    filter_value: string;
    action: "add" | "remove";
    active_filter_count: number;
    result_count: number;
  };
  filter_clear: { cleared_filter_count: number; result_count: number };
  dataset_open: { dataset_name: string; origin: "home" | "compare" };
  compare_selection_change: {
    action: "add" | "remove" | "clear";
    selection_count: number;
    dataset_name?: string;
  };
  compare_start: { selection_count: number; dataset_names: string };
  compare_section_toggle: {
    section: "population" | "sources" | "cgm";
    state: "expanded" | "collapsed";
  };
  detail_view_change: {
    dataset_name: string;
    view: "histogram" | "time_in_range";
  };
  dataset_action: {
    dataset_name: string;
    action: "download" | "request_access" | "source" | "helper_scripts";
    destination_hostname: string;
  };
  guide_open: { screen: "home" | "compare" | "dataset_detail" };
  guide_close: { screen: "home" | "compare" | "dataset_detail" };
  content_load_error: {
    screen: "home" | "compare" | "dataset_detail";
    category: "static_data" | "dataset_not_found" | "missing_dataset_id";
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const DEFAULT_MEASUREMENT_ID = "G-7VEBP7G8TE";
const MAX_PARAMETER_LENGTH = 100;
const LOCAL_ANALYTICS_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
  "::1",
  "0.0.0.0",
]);
let initializedMeasurementId: string | null = null;

const viteEnv = (
  import.meta as ImportMeta & {
    env?: Record<string, string | boolean | undefined>;
  }
).env;

function getMeasurementId() {
  const configured = viteEnv?.VITE_GA_MEASUREMENT_ID;
  return typeof configured === "string" && configured.trim()
    ? configured.trim()
    : DEFAULT_MEASUREMENT_ID;
}

function isDebugEnabled() {
  return viteEnv?.VITE_GA_DEBUG === "true";
}

export function shouldEnableAnalytics({
  isDev,
  environment,
  isDebug,
}: {
  isDev: boolean;
  environment: "production" | "preview" | "local";
  isDebug: boolean;
}) {
  return isDebug || (!isDev && environment !== "local");
}

function isAnalyticsEnabled() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  return shouldEnableAnalytics({
    isDev: viteEnv?.DEV === true,
    environment: getAnalyticsEnvironment(),
    isDebug: isDebugEnabled(),
  });
}

function isLocalAnalyticsHostname(hostname: string) {
  return LOCAL_ANALYTICS_HOSTNAMES.has(hostname);
}

export function getAnalyticsEnvironment(): "production" | "preview" | "local" {
  if (typeof window === "undefined") return "local";
  if (isLocalAnalyticsHostname(window.location.hostname)) {
    return "local";
  }
  return ["glucose-ml-project.com", "www.glucose-ml-project.com"].includes(
    window.location.hostname
  )
    ? "production"
    : "preview";
}

export function sanitizeAnalyticsParameters(
  parameters: Record<string, unknown>
): AnalyticsParameters {
  return Object.fromEntries(
    Object.entries(parameters).flatMap<[string, AnalyticsPrimitive]>(
      ([key, value]) => {
        if (typeof value === "string") {
          const normalized = value.trim().slice(0, MAX_PARAMETER_LENGTH);
          return normalized ? [[key, normalized]] : [];
        }
        if (typeof value === "number") {
          return Number.isFinite(value) ? [[key, value]] : [];
        }
        return typeof value === "boolean" ? [[key, value]] : [];
      }
    )
  );
}

export function createGtagQueue(dataLayer: unknown[]) {
  return function gtag() {
    // Google gtag.js requires the function's Arguments object, not a rest array.
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };
}

export function initializeGoogleAnalytics(): boolean {
  if (!isAnalyticsEnabled()) return false;

  try {
    const measurementId = getMeasurementId();
    if (initializedMeasurementId === measurementId) return true;

    window.dataLayer ??= [];
    window.gtag ??= createGtagQueue(window.dataLayer);

    if (!document.querySelector(`script[data-ga-measurement-id="${measurementId}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        measurementId
      )}`;
      script.dataset.gaMeasurementId = measurementId;
      document.head.append(script);
    }

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      anonymize_ip: true,
      debug_mode: isDebugEnabled(),
    });
    initializedMeasurementId = measurementId;
    return true;
  } catch {
    return false;
  }
}

export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  parameters: AnalyticsEventMap[Name]
): void {
  try {
    if (!initializeGoogleAnalytics() || !window.gtag) return;
    window.gtag("event", name, {
      ...sanitizeAnalyticsParameters(parameters),
      environment: getAnalyticsEnvironment(),
    });
  } catch {
    // Analytics must never interrupt application behavior.
  }
}
