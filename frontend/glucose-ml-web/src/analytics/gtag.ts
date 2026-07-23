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
 * TEST-ONLY escape hatch for `getEnv()`. `import.meta.env` cannot be faked
 * from a separate test module under plain `node --test` (each ES module
 * owns its own `import.meta`, and the module namespace this file exports is
 * read-only from the outside), so the mechanical `initAnalytics`/`sendEvent`
 * tests install a fake env here via `__setAnalyticsEnvForTests` instead.
 * Production code never touches this.
 *
 * This must never be re-exported from the public `src/analytics/index.ts`
 * barrel (a later task) and must never be imported by application code —
 * only by this module's own test file.
 */
let envOverrideForTests: AnalyticsEnv | undefined;

/**
 * TEST-ONLY. Installs (or clears, when passed `undefined`) a fake env in
 * place of `import.meta.env`. See `envOverrideForTests` above for why this
 * seam exists and why it must stay test-only.
 */
export function __setAnalyticsEnvForTests(env: AnalyticsEnv | undefined): void {
  envOverrideForTests = env;
}

function getEnv(): AnalyticsEnv | undefined {
  if (envOverrideForTests) return envOverrideForTests;
  return import.meta.env;
}

// ---------------------------------------------------------------------------
// Pure enablement / measurement-id logic
// ---------------------------------------------------------------------------

/**
 * Plain-value input to `shouldEnableAnalytics`, mirroring the handful of
 * `import.meta.env` fields the enablement decision depends on.
 */
export interface AnalyticsEnablementInput {
  prod: boolean;
  gaDebug: string | undefined;
  measurementId: string | undefined;
}

/**
 * Pure enablement decision, independent of `import.meta.env`/`getEnv()`.
 * Enabled when `prod` is `true` or `gaDebug` is `"true"`; disabled
 * otherwise. Disabled regardless of the above when `measurementId` is
 * explicitly blank or whitespace-only. (Leaving `measurementId` `undefined`
 * is different: `resolveMeasurementId` falls back to
 * `FALLBACK_MEASUREMENT_ID` in that case, and analytics stays enabled.)
 */
export function shouldEnableAnalytics({
  prod,
  gaDebug,
  measurementId,
}: AnalyticsEnablementInput): boolean {
  const flagEnabled = prod === true || gaDebug === "true";
  if (!flagEnabled) return false;

  if (typeof measurementId === "string" && measurementId.trim() === "") {
    return false;
  }

  return true;
}

/**
 * Pure normalizer: trims `raw` and falls back to `FALLBACK_MEASUREMENT_ID`
 * when it is `undefined`, not a string, or blank/whitespace-only.
 */
export function resolveMeasurementId(raw: string | undefined): string {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed === "" ? FALLBACK_MEASUREMENT_ID : trimmed;
}

function getMeasurementId(): string {
  return resolveMeasurementId(getEnv()?.VITE_GA_MEASUREMENT_ID);
}

// ---------------------------------------------------------------------------
// isAnalyticsEnabled
// ---------------------------------------------------------------------------

/**
 * Thin wrapper: lazily reads the relevant `import.meta.env` fields and
 * delegates the actual decision to the pure `shouldEnableAnalytics`.
 */
export function isAnalyticsEnabled(): boolean {
  const env = getEnv();
  return shouldEnableAnalytics({
    prod: env?.PROD === true,
    gaDebug: env?.VITE_GA_DEBUG,
    measurementId: env?.VITE_GA_MEASUREMENT_ID,
  });
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
 * be exercised again. Production code never calls this. Does not touch the
 * env override — see `__setAnalyticsEnvForTests` for that separate concern.
 */
export function resetAnalyticsForTests(): void {
  scriptInjected = false;
  configured = false;
}
