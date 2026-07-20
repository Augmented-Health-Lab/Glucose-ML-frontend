import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initializeGoogleAnalytics, trackEvent } from "./google-analytics";
import {
  getNewScrollMilestones,
  getRouteAnalyticsContext,
  getSafeReferrerOrigin,
} from "./route-analytics";

let lastTrackedPageLocation: string | null = null;

export default function RouteAnalytics() {
  const location = useLocation();
  const seenMilestones = useRef(new Set<number>());
  const context = useMemo(
    () => getRouteAnalyticsContext(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    initializeGoogleAnalytics();
    seenMilestones.current = new Set();
    const pageLocation = `${window.location.origin}${context.pagePath}`;

    if (lastTrackedPageLocation !== pageLocation) {
      trackEvent("page_view", {
        page_path: context.pagePath,
        page_location: pageLocation,
        page_referrer:
          lastTrackedPageLocation ?? getSafeReferrerOrigin(document.referrer),
        page_title: context.pageTitle,
        route_type: context.routeType,
        dataset_name: context.datasetName,
      });
      lastTrackedPageLocation = pageLocation;
    }

    let animationFrame = 0;
    const measureScroll = () => {
      animationFrame = 0;
      const milestones = getNewScrollMilestones(
        seenMilestones.current,
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      for (const milestone of milestones) {
        seenMilestones.current.add(milestone);
        trackEvent("scroll_depth", {
          page_path: context.pagePath,
          route_type: context.routeType,
          percent_scrolled: milestone,
          dataset_name: context.datasetName,
        });
      }
    };
    const scheduleMeasurement = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(measureScroll);
    };

    scheduleMeasurement();
    window.addEventListener("scroll", scheduleMeasurement, { passive: true });
    window.addEventListener("resize", scheduleMeasurement);
    return () => {
      window.removeEventListener("scroll", scheduleMeasurement);
      window.removeEventListener("resize", scheduleMeasurement);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [context]);

  return null;
}
