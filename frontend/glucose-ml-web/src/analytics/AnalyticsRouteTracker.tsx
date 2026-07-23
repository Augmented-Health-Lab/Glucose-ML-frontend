/**
 * The single component that drives GA4 page views and scroll-depth
 * milestones for the whole SPA. Renders nothing — it only observes
 * `useLocation()` and the window's scroll position and reports through the
 * typed helpers in `./events.ts`, plus `initAnalytics` from `./gtag.ts`.
 * Both are imported directly rather than through the public barrel
 * (`./index.ts`): `./index.ts` itself re-exports this component, so routing
 * the import through the barrel would make the two modules circularly
 * dependent on each other.
 *
 * The `/dataset/<id>` path segment `getDatasetNameFromPath` (`./params.ts`)
 * decodes is arbitrary, attacker- or typo-controlled text — `params.ts` is
 * documented dependency-free and cannot validate it against the real
 * dataset list. This component resolves it through the static
 * `canonicalDatasetName` lookup (`../utils/dataset-names.ts`) before ever
 * using it, so an unrecognized path segment is dropped, and a recognized one
 * is replaced with its canonical spelling, rather than the raw decoded text
 * ever being sent to GA4 as `dataset_name`.
 *
 * Two effects, both keyed on `pathname` alone:
 *
 * - page-view effect: fires exactly one `page_view` per navigation. It must
 *   never depend on the router's query-string field (or read it) — query
 *   strings must never reach analytics, since a route's identity for
 *   reporting purposes is its path, not any parameters appended to it.
 *
 * - scroll effect: (re)creates a fresh "already sent" milestone set and
 *   (re)attaches a passive `scroll` listener on every navigation.
 *
 * `../app/RouteScrollManager.tsx` scrolls the page programmatically on every
 * navigation — synchronously via `useLayoutEffect`, and asynchronously via a
 * `ResizeObserver` that retries the restore until it lands — which generates
 * real `scroll` events that are not user activity on the newly-entered
 * route. Left unguarded, one of those synthetic events could be attributed
 * to the wrong route (e.g. crossing a milestone that gets tagged with the
 * route being left, not the route being entered, if it fires before the
 * scroll effect's cleanup/setup for the new route has run). The scroll
 * handler below guards against this itself — by comparing the pathname it
 * was set up for against the live pathname — rather than relying on React
 * flushing this effect's cleanup and setup before the browser dispatches the
 * async `scroll` event; see the comment on `currentPathnameRef` and inside
 * `handleScroll`.
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

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, trackScrollDepth } from "./events.ts";
import { initAnalytics } from "./gtag.ts";
import { normalizePagePath, getRouteType, getDatasetNameFromPath } from "./params.ts";
import { getScrollPercent, nextMilestones, type ScrollMilestone } from "./scroll-depth.ts";
import { canonicalDatasetName } from "../utils/dataset-names.ts";

const AnalyticsRouteTracker = () => {
  const { pathname } = useLocation();
  const routeType = getRouteType(pathname);
  const rawDatasetName = getDatasetNameFromPath(pathname);
  // See the file header: the raw decoded path segment must be resolved
  // against the known-dataset list before it is used for anything sent to
  // GA4 — an unrecognized value (stale link, typo, hand-edited URL) is
  // dropped here, and a recognized one is replaced by its canonical
  // spelling, rather than the raw decoded text ever being forwarded as
  // `dataset_name`.
  const datasetName =
    rawDatasetName !== undefined ? canonicalDatasetName(rawDatasetName) : undefined;

  // The most recently rendered pathname. Assigned during render, so it is
  // always up to date before any effect — cleanup or setup, for any
  // navigation — runs for the corresponding commit: React always finishes
  // rendering (running this component's function body) before it runs any
  // effects for that update. The scroll handler below reads this ref to
  // learn the *current* route independent of whether the scroll effect's
  // own cleanup/setup has run yet, which is what makes the guard correct
  // regardless of listener attach/detach timing.
  const currentPathnameRef = useRef(pathname);
  currentPathnameRef.current = pathname;

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView({
      pagePath: normalizePagePath(pathname),
      pageTitle: document.title,
      routeType,
      datasetName,
    });
    // Must depend on [pathname] only: routeType/datasetName are pure,
    // synchronous derivations of pathname (see params.ts) computed once per
    // render above, and the router's query string must never be added here
    // or read by this effect — a route's identity for analytics is its path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const sentMilestones = new Set<ScrollMilestone>();
    // The pathname this listener instance was set up for. Captured once,
    // when this effect runs, and never reassigned.
    const trackedPathname = pathname;

    const handleScroll = () => {
      // Guard against RouteScrollManager's synthetic scroll activity (see
      // the file header) being misattributed to the wrong route: only
      // record/emit a milestone if the route this listener was created for
      // is still the live route. Without this, a scroll event that fires
      // between a navigation's render and this effect's cleanup/setup
      // running could otherwise cross a milestone for the route being left,
      // or the route being entered, using the wrong route's identity.
      if (currentPathnameRef.current !== trackedPathname) return;

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
    // Evaluate once immediately on route entry, not only on future `scroll`
    // events: browsers dispatch no `scroll` event at all for a route whose
    // content doesn't overflow the viewport, so without this call a short
    // page would silently report zero scroll_depth milestones even though
    // `getScrollPercent` (../analytics/scroll-depth.ts) is documented to
    // return 100 — "immediately" — for exactly that case. `sentMilestones`
    // is shared with the listener above, so a real scroll event crossing
    // the same milestone right after this call cannot double-emit it.
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, routeType, datasetName]);

  return null;
};

export default AnalyticsRouteTracker;
