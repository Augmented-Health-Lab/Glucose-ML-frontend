/**
 * The single component that drives GA4 page views and scroll-depth
 * milestones for the whole SPA. Renders nothing — it only observes
 * `useLocation()` and the window's scroll position and reports through the
 * typed helpers in `./events.ts` (via the public barrel, `./index.ts`).
 *
 * Two effects, both keyed on `pathname` alone:
 *
 * - page-view effect: fires exactly one `page_view` per navigation. It must
 *   never depend on the router's query-string field (or read it) — query
 *   strings must never reach analytics, since a route's identity for
 *   reporting purposes is its path, not any parameters appended to it.
 *
 * - scroll effect: (re)creates a fresh "already sent" milestone set and
 *   (re)attaches a passive `scroll` listener. Because this reset and the
 *   listener attach/detach live in the *same* effect, React's normal
 *   cleanup-before-setup ordering on a dependency change guarantees the
 *   previous route's listener is gone and the new route's milestone set is
 *   empty before either can observe a scroll event — see
 *   `../app/RouteScrollManager.tsx`, which scrolls programmatically on every
 *   navigation (restoring a saved offset on `/`, resetting to top
 *   elsewhere). Without this, that synthetic scroll could otherwise cross a
 *   milestone attributed to the route being left, not the route being
 *   entered.
 *
 * StrictMode note: `src/app/main.tsx` renders the app inside
 * `<StrictMode>`, which double-invokes effects (setup → cleanup → setup) on
 * initial mount in development only. `initAnalytics()` is documented as
 * idempotent, so its extra invocation is harmless. `trackPageView`, though,
 * has no cleanup to pair with its setup, so the very first page view of a
 * dev session is sent twice in a row to GA4 DebugView. This is standard,
 * widely-documented React dev-mode behavior, it does not happen in a
 * production build (StrictMode's double-invoke is dev-only), and it does
 * not repeat on subsequent navigations (only the initial mount is doubled).
 * We deliberately do not add a module-level "already sent" guard to
 * suppress it: that kind of global mutable flag would be fragile (wrong
 * across multiple router instances/tests, and it would mask genuine
 * double-mount bugs) for a cosmetic dev-only artifact.
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initAnalytics, trackPageView, trackScrollDepth } from "./index.ts";
import { normalizePagePath, getRouteType, getDatasetNameFromPath } from "./params.ts";
import { getScrollPercent, nextMilestones, type ScrollMilestone } from "./scroll-depth.ts";

const AnalyticsRouteTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView({
      pagePath: normalizePagePath(pathname),
      pageTitle: document.title,
      routeType: getRouteType(pathname),
      datasetName: getDatasetNameFromPath(pathname),
    });
  }, [pathname]);

  useEffect(() => {
    const routeType = getRouteType(pathname);
    const datasetName = getDatasetNameFromPath(pathname);
    const sentMilestones = new Set<ScrollMilestone>();

    const handleScroll = () => {
      const percent = getScrollPercent({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
      });

      for (const milestone of nextMilestones(percent, sentMilestones)) {
        sentMilestones.add(milestone);
        trackScrollDepth({ percent: milestone, routeType, datasetName });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  return null;
};

export default AnalyticsRouteTracker;
