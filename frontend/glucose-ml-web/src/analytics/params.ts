/**
 * Pure, dependency-free normalizers for Google Analytics 4 event parameters.
 *
 * This module must stay side-effect-free: no imports, no `window` access, no
 * `import.meta.env` reads, and no top-level work. Later layers (a gtag
 * sender, typed event helpers, a route tracker) build on top of these
 * functions but this module knows nothing about them.
 *
 * Privacy is the point of this module in particular: `categorizeLoadError`
 * collapses arbitrary error messages (which may contain PII, stack traces,
 * or other sensitive substrings) down to one of a small, fixed set of
 * categories, and `getDestinationHost` collapses arbitrary outbound URLs
 * down to a bare hostname so no path or query string ever reaches an
 * analytics event.
 */

// ---------------------------------------------------------------------------
// RouteType
// ---------------------------------------------------------------------------

/**
 * The app's routes are exactly `/`, `/background`, `/about`,
 * `/dataset/:id`, and `/compare`. Anything else is `other`.
 */
export const ROUTE_TYPES = [
  "home",
  "background",
  "about",
  "dataset_detail",
  "compare",
  "other",
] as const;

export type RouteType = (typeof ROUTE_TYPES)[number];

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export const ENVIRONMENTS = ["production", "preview", "development"] as const;

export type Environment = (typeof ENVIRONMENTS)[number];

// ---------------------------------------------------------------------------
// ErrorCategory
// ---------------------------------------------------------------------------

/**
 * Exactly five fixed categories. `categorizeLoadError` must always return
 * one of these and must never let any substring of the original error
 * message escape into an analytics event.
 */
export const ERROR_CATEGORIES = [
  "network",
  "not_found",
  "parse",
  "missing_data",
  "unknown",
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// ScreenName
// ---------------------------------------------------------------------------

/**
 * The subset of routes tracked as distinct "screens" for screen_view-style
 * events. `about` and `other` are intentionally excluded here even though
 * they exist as route types; `background` is included because a later task
 * instruments background-page load errors.
 */
export const SCREEN_NAMES = ["home", "compare", "dataset_detail", "background"] as const;

export type ScreenName = (typeof SCREEN_NAMES)[number];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DATASET_DETAIL_PATTERN = /^\/dataset\/[^/]+$/;

function stripQueryAndHash(pathname: string): string {
  const withoutHash = pathname.split("#")[0] ?? "";
  return withoutHash.split("?")[0] ?? "";
}

function stripTrailingSlash(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

function isDatasetDetailPath(strippedPath: string): boolean {
  return DATASET_DETAIL_PATTERN.test(strippedPath);
}

function canonicalPath(pathname: string): string {
  const withoutQueryOrHash = stripQueryAndHash(pathname);
  const withoutTrailingSlash = stripTrailingSlash(withoutQueryOrHash);
  return withoutTrailingSlash === "" ? "/" : withoutTrailingSlash;
}

// ---------------------------------------------------------------------------
// getRouteType
// ---------------------------------------------------------------------------

export function getRouteType(pathname: string): RouteType {
  const path = canonicalPath(pathname);

  if (path === "/") return "home";
  if (path === "/background") return "background";
  if (path === "/about") return "about";
  if (path === "/compare") return "compare";
  if (isDatasetDetailPath(path)) return "dataset_detail";
  return "other";
}

// ---------------------------------------------------------------------------
// normalizePagePath
// ---------------------------------------------------------------------------

export function normalizePagePath(pathname: string): string {
  const path = canonicalPath(pathname);

  if (isDatasetDetailPath(path)) {
    const rawId = path.slice("/dataset/".length);
    try {
      return `/dataset/${decodeURIComponent(rawId)}`;
    } catch {
      return path;
    }
  }

  return path;
}

// ---------------------------------------------------------------------------
// getDatasetNameFromPath
// ---------------------------------------------------------------------------

export function getDatasetNameFromPath(pathname: string): string | undefined {
  const path = canonicalPath(pathname);

  if (!isDatasetDetailPath(path)) return undefined;

  const rawId = path.slice("/dataset/".length);
  try {
    return decodeURIComponent(rawId);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// getEnvironment
// ---------------------------------------------------------------------------

const PRODUCTION_HOSTS = ["www.glucose-ml-project.com", "glucose-ml-project.com"];
const DEVELOPMENT_HOSTS = ["localhost", "127.0.0.1"];

export function getEnvironment(hostname: string): Environment {
  if (PRODUCTION_HOSTS.includes(hostname)) return "production";
  if (DEVELOPMENT_HOSTS.includes(hostname)) return "development";
  // Vercel preview deploys (*.vercel.app) and any other unrecognized host
  // both fall back to "preview" — safer default than silently reporting an
  // unknown host as production traffic.
  return "preview";
}

// ---------------------------------------------------------------------------
// boundedCount
// ---------------------------------------------------------------------------

const MAX_BOUNDED_COUNT = 999;

export function boundedCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(Math.floor(value), MAX_BOUNDED_COUNT);
}

// ---------------------------------------------------------------------------
// serializeDatasetCombination
// ---------------------------------------------------------------------------

const MAX_SERIALIZED_LENGTH = 100;

export function serializeDatasetCombination(names: readonly string[]): string {
  const unique = Array.from(new Set(names));
  const sorted = unique.sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
  return sorted.join("|").slice(0, MAX_SERIALIZED_LENGTH);
}

// ---------------------------------------------------------------------------
// getDestinationHost
// ---------------------------------------------------------------------------

export function getDestinationHost(url: string): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.hostname || undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// categorizeLoadError
// ---------------------------------------------------------------------------

const NETWORK_PATTERN = /network|fetch|load failed/i;
const NOT_FOUND_PATTERN = /404|not found/i;
const PARSE_PATTERN = /json|unexpected token|parse/i;
const MISSING_DATA_PATTERN = /missing[ _-]?data|no data (?:found|available)/i;

export function categorizeLoadError(error: unknown): ErrorCategory {
  if (!(error instanceof Error) || typeof error.message !== "string") {
    return "unknown";
  }

  const { message } = error;

  if (NETWORK_PATTERN.test(message)) return "network";
  if (NOT_FOUND_PATTERN.test(message)) return "not_found";
  if (PARSE_PATTERN.test(message)) return "parse";
  if (MISSING_DATA_PATTERN.test(message)) return "missing_data";
  return "unknown";
}
