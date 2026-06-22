import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getRouteScrollTop,
  rememberHomeScrollTop,
} from "./route-scroll";

let homeScrollTop = 0;

const RouteScrollManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const targetScrollTop = getRouteScrollTop(pathname, homeScrollTop);
    const scrollToTarget = () => {
      window.scrollTo({
        top: targetScrollTop,
        left: 0,
        behavior: "instant",
      });
    };

    if (pathname !== "/") {
      scrollToTarget();
      return;
    }

    let restoreObserver: ResizeObserver | null = null;
    let isTrackingHomeScroll = false;

    const rememberHomePosition = () => {
      homeScrollTop = rememberHomeScrollTop(
        window.location.pathname,
        window.scrollY,
        homeScrollTop
      );
    };

    const startTrackingHomeScroll = () => {
      if (isTrackingHomeScroll) return;

      window.addEventListener("scroll", rememberHomePosition, {
        passive: true,
      });
      isTrackingHomeScroll = true;
    };

    const restoreHomePosition = () => {
      scrollToTarget();

      if (window.scrollY === targetScrollTop) {
        restoreObserver?.disconnect();
        startTrackingHomeScroll();
      }
    };

    restoreHomePosition();

    if (window.scrollY !== targetScrollTop) {
      restoreObserver = new ResizeObserver(restoreHomePosition);
      restoreObserver.observe(document.body);
    }

    return () => {
      restoreObserver?.disconnect();

      if (isTrackingHomeScroll) {
        window.removeEventListener("scroll", rememberHomePosition);
      }
    };
  }, [pathname]);

  return null;
};

export default RouteScrollManager;
