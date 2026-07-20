/**
 * Google Analytics 4 (gtag.js) loading, idempotent initialization, and a
 * fail-safe event sender.
 *
 * This module owns the only place in the app that talks to `window.gtag`
 * directly. It:
 *   - injects the gtag.js script tag and configures the GA4 property
 *     at most once, with automatic page views disabled (the app emits
 *     route-aware page views itself);
 *   - exposes `sendEvent`, a total no-op-on-failure wrapper around
 *     `window.gtag("event", ...)` that never throws and never delays the
 *     app, regardless of whether analytics is enabled, blocked, or absent;
 *   - reads all build-time configuration lazily, inside function bodies,
 *     via optional chaining on `import.meta.env`. `import.meta.env` is
 *     `undefined` under `node --test` (it only exists via Vite's build-time
 *     replacement), so a top-level read would throw and make this module
 *     unimportable by tests — every read here happens inside a function.
 *
 * Typed event helpers (Task 3) are built on top of `sendEvent`; this module
 * knows nothing about specific event names or parameter shapes.
 */

import { getEnvironment } from "./params.ts";

// ---------------------------------------------------------------------------
// Global typings
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// ---------------------------------------------------------------------------
// Env access
// ---------------------------------------------------------------------------

const FALLBACK_MEASUREMENT_ID = "G-7VEBP7G8TE";
const GTAG_SCRIPT_ORIGIN = "https://www.googletagmanager.com/gtag/js";

interface AnalyticsEnv {
  PROD?: boolean;
  VITE_GA_DEBUG?: string;
  VITE_GA_MEASUREMENT_ID?: string;
}

/**
 * Test-only override for `getEnv()`. `import.meta.env` cannot be faked from
 * a separate test module under plain `node --test` (each ES module owns its
 * own `import.meta`, and the module namespace this file exports is
 * read-only from the outside), so `resetAnalyticsForTests` accepts an
 * optional fake `env` in its place. Production code never passes this.
 */
export interface AnalyticsTestOverrides {
  env?: AnalyticsEnv;
}

let envOverrideForTests: AnalyticsEnv | undefined;

function getEnv(): AnalyticsEnv | undefined {
  if (envOverrideForTests) return envOverrideForTests;
  return import.meta.env;
}

function getMeasurementId(): string {
  const raw = getEnv()?.VITE_GA_MEASUREMENT_ID;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed === "" ? FALLBACK_MEASUREMENT_ID : trimmed;
}

// ---------------------------------------------------------------------------
// isAnalyticsEnabled
// ---------------------------------------------------------------------------

export function isAnalyticsEnabled(): boolean {
  const env = getEnv();
  const flagEnabled = env?.PROD === true || env?.VITE_GA_DEBUG === "true";
  if (!flagEnabled) return false;

  // An explicitly blank/whitespace-only measurement id disables analytics.
  // (Leaving it unset is different: getMeasurementId() falls back to
  // FALLBACK_MEASUREMENT_ID in that case, and analytics stays enabled.)
  const rawId = env?.VITE_GA_MEASUREMENT_ID;
  if (typeof rawId === "string" && rawId.trim() === "") return false;

  return true;
}

// ---------------------------------------------------------------------------
// initAnalytics
// ---------------------------------------------------------------------------

let scriptInjected = false;
let configured = false;

export function initAnalytics(): void {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (!isAnalyticsEnabled()) return;

    const measurementId = getMeasurementId();

    if (!scriptInjected) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `${GTAG_SCRIPT_ORIGIN}?id=${measurementId}`;
      document.head.appendChild(script);
      scriptInjected = true;
    }

    window.dataLayer = window.dataLayer ?? [];
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag(...args: unknown[]): void {
        window.dataLayer?.push(args);
      };
    }

    if (!configured) {
      window.gtag("js", new Date());
      window.gtag("config", measurementId, {
        send_page_view: false,
        ...(getEnv()?.VITE_GA_DEBUG === "true" ? { debug_mode: true } : {}),
      });
      configured = true;
    }
  } catch {
    // Analytics must never break the app.
  }
}

// ---------------------------------------------------------------------------
// sendEvent
// ---------------------------------------------------------------------------

export type EventParamValue = string | number | boolean | null | undefined;
export type EventParams = Record<string, EventParamValue>;

export function sendEvent(name: string, params: EventParams = {}): void {
  try {
    if (typeof window === "undefined") return;
    if (!isAnalyticsEnabled()) return;
    if (typeof window.gtag !== "function") return;

    const merged: EventParams = {
      ...params,
      environment: getEnvironment(window.location.hostname),
    };

    const cleaned: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === null || value === "") continue;
      cleaned[key] = value;
    }

    window.gtag("event", name, cleaned);
  } catch {
    // Analytics must never break the app.
  }
}

// ---------------------------------------------------------------------------
// resetAnalyticsForTests
// ---------------------------------------------------------------------------

/**
 * Test-only utility: clears the idempotency flags so `initAnalytics()` can
 * be exercised again, and optionally installs a fake `env` in place of
 * `import.meta.env` for the duration of the test. Production code never
 * calls this.
 */
export function resetAnalyticsForTests(overrides?: AnalyticsTestOverrides): void {
  scriptInjected = false;
  configured = false;
  envOverrideForTests = overrides?.env;
}
