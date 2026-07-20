import { getPublicDatasetName } from "./public-datasets.ts";

export type RouteAnalyticsContext = {
  pagePath: string;
  pageTitle: string;
  routeType:
    | "home"
    | "background"
    | "about"
    | "compare"
    | "dataset_detail"
    | "other";
  datasetName?: string;
};

const STATIC_ROUTES: Record<string, RouteAnalyticsContext> = {
  "/": {
    pagePath: "/",
    pageTitle: "Explore CGM datasets",
    routeType: "home",
  },
  "/background": {
    pagePath: "/background",
    pageTitle: "CGM background",
    routeType: "background",
  },
  "/about": {
    pagePath: "/about",
    pageTitle: "About Glucose-ML",
    routeType: "about",
  },
  "/compare": {
    pagePath: "/compare",
    pageTitle: "Compare CGM datasets",
    routeType: "compare",
  },
};

const SCROLL_MILESTONES = [25, 50, 75, 90] as const;

export function getRouteAnalyticsContext(
  pathname: string
): RouteAnalyticsContext {
  const staticRoute = STATIC_ROUTES[pathname];
  if (staticRoute) return staticRoute;

  if (pathname.startsWith("/dataset/")) {
    try {
      const datasetName = getPublicDatasetName(
        decodeURIComponent(pathname.slice("/dataset/".length))
      );
      if (datasetName) {
        return {
          pagePath: `/dataset/${encodeURIComponent(datasetName)}`,
          pageTitle: `${datasetName} dataset`,
          routeType: "dataset_detail",
          datasetName,
        };
      }
    } catch {
      // Invalid route escapes are reported only as a generic detail route.
    }

    return {
      pagePath: "/dataset/other",
      pageTitle: "Dataset detail",
      routeType: "dataset_detail",
    };
  }

  return {
    pagePath: "/other",
    pageTitle: "Glucose-ML",
    routeType: "other",
  };
}

export function getSafeReferrerOrigin(referrer: string): string | undefined {
  try {
    const url = new URL(referrer);
    return url.protocol === "http:" || url.protocol === "https:"
      ? `${url.origin}/`
      : undefined;
  } catch {
    return undefined;
  }
}

export function getNewScrollMilestones(
  seen: ReadonlySet<number>,
  scrollTop: number,
  scrollHeight: number,
  viewportHeight: number
) {
  const scrollableHeight = Math.max(scrollHeight - viewportHeight, 0);
  const percent =
    scrollableHeight === 0
      ? 100
      : Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
  return SCROLL_MILESTONES.filter(
    (milestone) => percent >= milestone && !seen.has(milestone)
  );
}
