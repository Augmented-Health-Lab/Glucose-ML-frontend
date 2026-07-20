# Google Analytics 4 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Source spec:** `docs/superpowers/specs/2026-07-20-google-analytics-4-integration-design.md`

**Goal:** Add anonymous GA4 instrumentation to the Glucose-ML React app for website user testing, covering navigation, dataset discovery, comparison, detail exploration, guide usage, and load reliability — with no personal, health, or free-form data ever reaching GA4.

**Architecture:** A single `src/analytics/` module owns all GA4 contact. `params.ts` holds pure normalizers (path, route type, environment, bounded counts, dataset-combination serialization) and is fully unit-testable under `node --test`. `gtag.ts` owns script injection, idempotent init, and a fail-safe `sendEvent`. `events.ts` exposes one named helper per approved event; feature components import only those helpers. `AnalyticsRouteTracker.tsx` mounts inside `BrowserRouter` and emits route-aware page views plus per-route scroll milestones. No component ever touches `window.gtag`.

**Tech Stack:** Vite 7, React 19, react-router-dom 7, TypeScript 5.9 (strict), Node 24 test runner (`node --test tests/*.test.ts`, native type stripping), ESLint 9, Vercel static deployment.

## Global Constraints

- GA4 Measurement ID default: `G-7VEBP7G8TE`. `VITE_GA_MEASUREMENT_ID` overrides it.
- Analytics is **enabled** on any deployed build. In local development it is **disabled** unless `VITE_GA_DEBUG=true`, which also sets `debug_mode: true` for GA4 DebugView.
- GA4's automatic initial page view MUST be disabled (`send_page_view: false`); page views are emitted manually, exactly one per navigation.
- Every event carries an `environment` parameter derived from `window.location.hostname` (`production` | `preview` | `development`).
- **Prohibited from ever being sent:** user/participant/cohort IDs or any persistent custom identifier; names, emails, IP-derived values, free-form user text; glucose measurements, health attributes, participant-level data; raw exception messages, stack traces, or arbitrary URLs; values read from uncontrolled query-string parameters.
- **Allowed values only:** public dataset names, fixed UI labels, fixed route types, bounded integer counts, fixed action names, and destination hostnames (hostname only — never full URLs) of approved outbound links.
- Analytics must be a **total no-op** when disabled, when `gtag` is unavailable, or when the script is blocked. An analytics failure must never throw into application code and must never alter or delay UI behavior (especially outbound-link navigation).
- Keep the existing `@vercel/analytics` `<Analytics />` integration exactly as-is.
- **Node-test safety:** `import.meta.env` is `undefined` under `node --test`. All environment reads MUST happen lazily inside functions (never at module top level) and MUST use optional chaining (`import.meta.env?.VITE_…`), so any analytics module can be imported by a test without throwing.
- No visual redesign, no consent banner, no new runtime dependency (`gtag.js` is loaded by our own script tag).
- Do not modify `vercel.json`, `vite.config.ts`, or the existing Vercel Analytics setup.
- Tests in this repo are Node-runner tests over pure logic plus source-text contract assertions (there is no jsdom or React test renderer). Follow that existing style — do not add a test framework or a DOM environment.
- Verification for every task: `cd frontend/glucose-ml-web && node --test tests/*.test.ts && npm run lint && npm run build`.

---

## File Structure

- Create `frontend/glucose-ml-web/src/analytics/params.ts`: pure normalizers and shared value domains.
- Create `frontend/glucose-ml-web/src/analytics/gtag.ts`: script loading, idempotent init, fail-safe `sendEvent`.
- Create `frontend/glucose-ml-web/src/analytics/events.ts`: one typed helper per approved event.
- Create `frontend/glucose-ml-web/src/analytics/scroll-depth.ts`: pure scroll-milestone state machine.
- Create `frontend/glucose-ml-web/src/analytics/AnalyticsRouteTracker.tsx`: page views + scroll milestones.
- Create `frontend/glucose-ml-web/src/analytics/index.ts`: public barrel — the only import path feature code uses.
- Modify `frontend/glucose-ml-web/src/app/App.tsx`: mount `<AnalyticsRouteTracker />` inside `BrowserRouter`.
- Create `frontend/glucose-ml-web/src/features/home/filter-datasets.ts`: filtering logic extracted from `HomePage` so result counts are computed from the *next* filter state.
- Modify `frontend/glucose-ml-web/src/features/home/HomePage.tsx`, `FilterBar.tsx`, `MultiSelect.tsx`, `DatasetCard.tsx`, `CompareBar.tsx`.
- Modify `frontend/glucose-ml-web/src/features/compare/ComparePage.tsx`, `CompareTable.tsx`, `ComparingChips.tsx`.
- Modify `frontend/glucose-ml-web/src/features/dataset-detail/DatasetHeader.tsx`, `CGMDataSection.tsx`, `DatasetDetail.tsx`.
- Modify `frontend/glucose-ml-web/src/features/background/BackgroundPage.tsx`.
- Create tests: `tests/analytics-params.test.ts`, `tests/analytics-gtag-contract.test.ts`, `tests/analytics-events.test.ts`, `tests/analytics-route-tracker.test.ts`, `tests/analytics-privacy-contract.test.ts`, `tests/home-filter-datasets.test.ts`, `tests/analytics-instrumentation-contract.test.ts`.
- Create `docs/superpowers/specs/2026-07-20-ga4-reporting-setup.md`: custom dimensions and Exploration recipes.

---

## Event and Parameter Reference (binding for all tasks)

Every event additionally carries `environment`.

| Event | Parameters |
| --- | --- |
| `page_view` | `page_path` (normalized, no query), `page_title`, `route_type`, `dataset_name` (dataset-detail routes only) |
| `scroll_depth` | `percent` (25 \| 50 \| 75 \| 90), `route_type`, `dataset_name` (dataset-detail routes only) |
| `filter_change` | `filter_category`, `filter_option`, `filter_action` (`add` \| `remove`), `active_filter_count`, `result_count` |
| `filter_clear` | `cleared_filter_count`, `result_count` |
| `dataset_open` | `dataset_name`, `origin` (`home` \| `compare`) |
| `compare_selection_change` | `selection_action` (`add` \| `remove` \| `clear`), `dataset_name` (omitted for `clear`), `selection_count` |
| `compare_start` | `selection_count`, `dataset_combination` (sorted, `\|`-joined public names) |
| `compare_section_toggle` | `section` (`population` \| `sources` \| `cgm`), `section_state` (`expanded` \| `collapsed`) |
| `detail_view_change` | `dataset_name`, `detail_view` (`histogram` \| `time_in_range`) |
| `dataset_action` | `dataset_name`, `action` (`download` \| `request_access` \| `source` \| `helper_scripts`), `destination_host` |
| `guide_open` / `guide_close` | `screen` (`home` \| `compare` \| `dataset_detail`) |
| `content_load_error` | `screen`, `error_category` (`network` \| `not_found` \| `parse` \| `missing_data` \| `unknown`) |

`route_type` domain: `home` \| `background` \| `about` \| `dataset_detail` \| `compare` \| `other`.

---

### Task 1: Analytics core — pure parameter normalizers

**Files:**
- Create: `frontend/glucose-ml-web/src/analytics/params.ts`
- Test: `frontend/glucose-ml-web/tests/analytics-params.test.ts`

**Interfaces:**
- Produces: `ROUTE_TYPES`, `type RouteType`, `type Environment`, `type ErrorCategory`, `type ScreenName`, `getRouteType(pathname)`, `normalizePagePath(pathname)`, `getDatasetNameFromPath(pathname)`, `getEnvironment(hostname)`, `boundedCount(value)`, `serializeDatasetCombination(names)`, `getDestinationHost(url)`, `categorizeLoadError(error)`.
- Consumes: nothing. This module must be dependency-free and side-effect-free.

- [ ] **Step 1: Write failing tests for the normalizers**

Create `tests/analytics-params.test.ts` covering:
- `getRouteType`: `/` → `home`; `/background` → `background`; `/about` → `about`; `/dataset/CGMacros` → `dataset_detail`; `/compare` → `compare`; `/anything-else` → `other`. Trailing slashes and a leading `/dataset/` with no id must not produce `dataset_detail`.
- `normalizePagePath`: strips query string and hash (`/compare?datasets=A,B#top` → `/compare`); collapses a dataset-detail path to `/dataset/:name` **with** the decoded public dataset name preserved as its own parameter (see next bullet) — i.e. `normalizePagePath("/dataset/CGMacros%20Dexcom")` → `/dataset/CGMacros Dexcom`; normalizes a trailing slash to `/`.
- `getDatasetNameFromPath`: `/dataset/CGMacros%20Dexcom` → `CGMacros Dexcom`; returns `undefined` for every non-dataset route; returns `undefined` rather than throwing for a malformed percent-escape (`/dataset/%E0%A4%A`).
- `getEnvironment`: `www.glucose-ml-project.com` and `glucose-ml-project.com` → `production`; any `*.vercel.app` host → `preview`; `localhost` and `127.0.0.1` → `development`; unknown host → `preview`.
- `boundedCount`: clamps to `0..999`, floors non-integers, returns `0` for `NaN`/negative/non-finite input.
- `serializeDatasetCombination`: sorts case-insensitively and joins with `|` so `["Park 2025","CGMacros"]` and `["CGMacros","Park 2025"]` both give `CGMacros|Park 2025`; de-duplicates; truncates the result to 100 characters.
- `getDestinationHost`: `https://github.com/x/y` → `github.com`; returns `undefined` for a relative path, an empty string, or an unparseable URL. Must return the hostname only — assert the result never contains a path segment.
- `categorizeLoadError`: an `Error` whose message matches `/network|fetch|load failed/i` → `network`; `/404|not found/i` → `not_found`; `/json|unexpected token|parse/i` → `parse`; a message naming missing data → `missing_data`; anything else, including a non-`Error` value → `unknown`. **Assert that the returned value is always one of the five fixed categories and never contains any substring of the original message** — this is the privacy-critical property.

Run:

```bash
cd frontend/glucose-ml-web && node --test tests/analytics-params.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 2: Implement `params.ts` to pass the tests**

Export the exact identifiers listed under Interfaces. Every union type must be declared as a `const` array plus a derived type so the domains are testable. No environment reads, no `window` access, no imports.

Run the same command. Expected: PASS.

- [ ] **Step 3: Verify**

```bash
cd frontend/glucose-ml-web && node --test tests/*.test.ts && npm run lint && npm run build
```

---

### Task 2: Analytics core — gtag loading, idempotent init, fail-safe send

**Files:**
- Create: `frontend/glucose-ml-web/src/analytics/gtag.ts`
- Test: `frontend/glucose-ml-web/tests/analytics-gtag-contract.test.ts`

**Interfaces:**
- Consumes: `getEnvironment` from `./params`.
- Produces: `initAnalytics()`, `sendEvent(name, params?)`, `isAnalyticsEnabled()`, `resetAnalyticsForTests()`.

**Behavior contract:**
- `isAnalyticsEnabled()` reads env **lazily**: enabled when `import.meta.env?.PROD` is true, or when `import.meta.env?.VITE_GA_DEBUG === "true"`. Disabled otherwise. A blank/whitespace measurement ID disables analytics.
- Measurement ID = `import.meta.env?.VITE_GA_MEASUREMENT_ID` trimmed, falling back to `G-7VEBP7G8TE`.
- `initAnalytics()` is idempotent: repeated calls inject the `gtag.js` script tag at most once and call `gtag("config", …)` at most once. It must pass `send_page_view: false`, and `debug_mode: true` only when `VITE_GA_DEBUG === "true"`.
- `sendEvent` wraps everything in `try { … } catch { /* analytics must never break the app */ }`, returns `void`, and no-ops when disabled, when `window` is undefined, or when `window.gtag` is missing. It always merges in `environment` from `getEnvironment(window.location.hostname)`.
- `sendEvent` strips parameters whose value is `undefined`, `null`, or an empty string before sending.
- `resetAnalyticsForTests()` clears the internal init flags so tests can assert idempotency.

- [ ] **Step 1: Write failing contract tests**

This module touches `window`/`document`, which do not exist under `node --test`. Test it two ways in `tests/analytics-gtag-contract.test.ts`:

*Behavioral* — install minimal fakes on `globalThis` (`globalThis.window = { location: { hostname: "www.glucose-ml-project.com" }, gtag: recorderFn, dataLayer: [] }`, `globalThis.document` with a stub `createElement`/`head.appendChild`) and, using dynamic `await import(...)` after the fakes are set, assert:
- calling `initAnalytics()` twice appends exactly one script element and issues exactly one `config` call;
- the `config` call includes `send_page_view: false`;
- `sendEvent("page_view", { page_path: "/" })` records one `gtag("event", "page_view", {...})` call whose params include `environment: "production"`;
- `sendEvent` with `window.gtag` deleted, and `sendEvent` with a `gtag` that throws, both return normally without throwing;
- `undefined`/`null`/`""` parameters are omitted from the sent payload.

Clean up the globals in a `finally`/`after` hook so other test files are unaffected.

*Source-text* — assert `gtag.ts` contains `send_page_view: false`, contains the fallback id `G-7VEBP7G8TE`, references `VITE_GA_MEASUREMENT_ID` and `VITE_GA_DEBUG`, and that no `import.meta.env` read appears at module top level (assert every `import.meta.env` occurrence is indented, i.e. inside a function body).

Expected: FAIL — module does not exist.

- [ ] **Step 2: Implement `gtag.ts`**

Declare the `window.gtag`/`window.dataLayer` types in this file (module-scoped `declare global`). Load `https://www.googletagmanager.com/gtag/js?id=<ID>` async.

- [ ] **Step 3: Verify** with the full command from Global Constraints.

---

### Task 3: Typed event helpers

**Files:**
- Create: `frontend/glucose-ml-web/src/analytics/events.ts`
- Create: `frontend/glucose-ml-web/src/analytics/index.ts`
- Test: `frontend/glucose-ml-web/tests/analytics-events.test.ts`
- Test: `frontend/glucose-ml-web/tests/analytics-privacy-contract.test.ts`

**Interfaces:**
- Consumes: `sendEvent` from `./gtag`; normalizers and types from `./params`.
- Produces one exported helper per row of the Event and Parameter Reference table above: `trackPageView`, `trackScrollDepth`, `trackFilterChange`, `trackFilterClear`, `trackDatasetOpen`, `trackCompareSelectionChange`, `trackCompareStart`, `trackCompareSectionToggle`, `trackDetailViewChange`, `trackDatasetAction`, `trackGuideOpen`, `trackGuideClose`, `trackContentLoadError`.
- `index.ts` re-exports every helper, `initAnalytics`, `AnalyticsRouteTracker` (added in Task 4), and the shared types. Feature code imports **only** from `src/analytics`.

**Requirements:**
- Each helper takes a single typed argument object using the union types from `params.ts`, so an invalid action or section is a compile error.
- Each helper is responsible for normalization before sending: counts go through `boundedCount`, dataset combinations through `serializeDatasetCombination`, outbound URLs through `getDestinationHost` (send the host, never the URL), errors through `categorizeLoadError`.
- `trackDatasetAction` must accept the raw href and send only `destination_host`; if the host cannot be derived, omit the parameter rather than sending the URL.
- `trackCompareSelectionChange` omits `dataset_name` when the action is `clear`.
- Helpers must never accept or forward an arbitrary parameter bag — no `...rest`, no `Record<string, unknown>` passthrough.

- [ ] **Step 1: Write failing tests**

`tests/analytics-events.test.ts`: stub the `gtag` module boundary by installing the fake `window.gtag` recorder from Task 2 and importing the real helpers. For every helper, assert the exact event name and the exact set of parameter keys against the reference table. Include the cases: `trackCompareStart` sorts its combination; `trackDatasetAction` with `https://github.com/org/repo/tree/main/x` sends `destination_host: "github.com"` and no full URL anywhere in the payload; `trackContentLoadError` given `new Error("Failed to fetch https://internal.example/secret.json")` sends only `error_category` and leaks no substring of that message; counts above the bound are clamped.

`tests/analytics-privacy-contract.test.ts` (source-text, scans every file in `src/analytics/`): assert none of them contain the identifiers `userId`, `user_id`, `participant`, `cohort`, `email`, `setUserId`, `user_properties`, `glucose`, `hba1c`, `error.message`, `err.message`, `stack`, `location.search`, or `window.location.href`. Assert no file calls `gtag(` outside `gtag.ts`.

- [ ] **Step 2: Implement `events.ts` and `index.ts`.**

- [ ] **Step 3: Verify.**

---

### Task 4: Route tracker — SPA page views and scroll milestones

**Files:**
- Create: `frontend/glucose-ml-web/src/analytics/scroll-depth.ts`
- Create: `frontend/glucose-ml-web/src/analytics/AnalyticsRouteTracker.tsx`
- Modify: `frontend/glucose-ml-web/src/app/App.tsx`
- Modify: `frontend/glucose-ml-web/src/analytics/index.ts` (export the tracker)
- Test: `frontend/glucose-ml-web/tests/analytics-route-tracker.test.ts`

**Interfaces:**
- `scroll-depth.ts` produces pure functions: `SCROLL_MILESTONES = [25, 50, 75, 90]`, `getScrollPercent({ scrollY, viewportHeight, documentHeight })`, and `nextMilestones(percent, alreadySent)` returning the milestones newly crossed. No DOM access.
- `AnalyticsRouteTracker.tsx` is a `null`-rendering component using `useLocation()`.

**Behavior:**
- On mount, call `initAnalytics()` once.
- On every `pathname` change (including the first render), emit exactly one `page_view` with the normalized path, `document.title`, route type, and dataset name when applicable.
- Attach a passive `scroll` listener; emit each of the four milestones at most once per route visit; reset the sent-milestone set on navigation. Detach on unmount.
- `getScrollPercent` must return `100` when the document is not taller than the viewport (guard against divide-by-zero), so a short page reports its milestones rather than none.

- [ ] **Step 1: Write failing tests**

`tests/analytics-route-tracker.test.ts`:
- Pure tests of `getScrollPercent` (including the non-scrollable-document guard and clamping to `0..100`) and `nextMilestones` (crossing 25 then jumping to 90 yields `[50, 75, 90]` on the second call and `[]` on a repeat call).
- Source-text contract on `AnalyticsRouteTracker.tsx`: it calls `initAnalytics`, calls `trackPageView`, depends on `[pathname]` (not on `location.search`), adds the scroll listener with `{ passive: true }`, and returns `null`.
- Source-text contract on `App.tsx`: `<AnalyticsRouteTracker />` appears inside `<BrowserRouter>`, and `<Analytics />` (Vercel) is still present.

- [ ] **Step 2: Implement, then mount in `App.tsx` next to `<RouteScrollManager />`.**

`RouteScrollManager` already sets `history.scrollRestoration = "manual"` and programmatically scrolls on navigation. Make sure a programmatic restore scroll cannot emit milestones for the *previous* route: reset the milestone set in the same effect that handles the pathname change, before the listener is re-attached.

- [ ] **Step 3: Verify.**

---

### Task 5: Home instrumentation — filters, compare selection, guide, load errors

**Files:**
- Create: `frontend/glucose-ml-web/src/features/home/filter-datasets.ts`
- Modify: `frontend/glucose-ml-web/src/features/home/HomePage.tsx`, `FilterBar.tsx`, `MultiSelect.tsx`, `DatasetCard.tsx`, `CompareBar.tsx`
- Test: `frontend/glucose-ml-web/tests/home-filter-datasets.test.ts`

**Context — the stale-count problem.** `HomePage.handleFilterChange(label, selected)` receives the whole next array for one category; `filteredDatasets` is a render-time `useMemo` over `[filterSelections, datasets]`, so the post-change result count is **not** available inside the handler. Extract the filtering predicate out of that `useMemo` into `filter-datasets.ts` as a pure `filterDatasets(datasets, filterSelections)`, have the `useMemo` call it, and have the handler call it again with the next filter state to compute `result_count`. Behavior must be identical — this is a pure extraction.

**Instrumentation:**
- `MultiSelect.handleOptionClick` is the only place that knows add vs remove (`selected.includes(option)`). Add an optional `onOptionToggle?: (option: string, action: "add" | "remove") => void` prop rather than re-deriving the diff upstream; `FilterBar` forwards it with the category label; `HomePage` emits `filter_change` with `filter_category`, `filter_option`, `filter_action`, `active_filter_count` (total selected options across all categories in the next state) and `result_count` from the next state.
- `FilterBar.handleClear` currently calls `onFilterChange(label, [])` once per label, which would emit N `filter_change` events. Add a dedicated `onClearFilters` prop so clearing emits exactly one `filter_clear` with `cleared_filter_count` (options cleared) and `result_count` for the empty filter state — and no `filter_change` events.
- `DatasetCard.handleCardClick` → `trackDatasetOpen({ datasetName: title, origin: "home" })` before `navigate`.
- Compare selection in `HomePage`: `handleCardSelect` emits `compare_selection_change` with `add`/`remove` and the resulting `selection_count`; `handleClearCompareSelection` emits `clear` with `selection_count: 0`. Emit only when the selection actually changes — the duplicate/limit guard path must not emit.
- `CompareBar`'s Compare `<Link>` gets an `onClick` emitting `compare_start` with `selection_count` and the sorted `dataset_combination`. Do not preventDefault; do not block navigation. The disabled-button branch emits nothing.
- Guide: `<GuideButton onClick=…>` emits `guide_open({ screen: "home" })`; `<LegendModal onClose=…>` emits `guide_close({ screen: "home" })`.
- Load error: in the existing `.catch` in `HomePage`, emit `content_load_error({ screen: "home", error })` alongside the existing `setLoadError`. Do not change what is displayed to the user.

- [ ] **Step 1: Write failing tests for `filterDatasets`**

`tests/home-filter-datasets.test.ts`: build small fixture datasets and assert the extracted function reproduces the existing filter semantics for each category (data sources, population, study duration, sample size, access), for multi-select within a category, for the AND relationship across categories, and that an empty selection object returns every dataset. Also assert `filterDatasets` does not mutate its inputs.

Expected: FAIL — module does not exist.

- [ ] **Step 2: Extract `filterDatasets` and rewire the `useMemo` to call it. Confirm the home page still filters identically.**

- [ ] **Step 3: Add the instrumentation listed above. Import helpers only from `../../analytics`.**

- [ ] **Step 4: Verify.**

---

### Task 6: Compare instrumentation — sections, dataset opens, selection changes, guide, load errors

**Files:**
- Modify: `frontend/glucose-ml-web/src/features/compare/ComparePage.tsx`, `CompareTable.tsx`, `ComparingChips.tsx`

**Instrumentation:**
- `CompareTable.toggleSection(section)` emits `compare_section_toggle` with `section` (`population` | `sources` | `cgm` — the existing `SectionKey`, which already matches the approved domain) and `section_state` set from the **resulting** state (sections start expanded, so the first toggle reports `collapsed`).
- `CompareTable`'s "View dataset details" button emits `trackDatasetOpen({ datasetName: dataset.title, origin: "compare" })` before `navigate`.
- `ComparePage.handleRemoveDataset` emits `compare_selection_change` with `remove`, the dataset name, and the resulting `selection_count`. Note the existing behavior: removing the last dataset navigates to `/` — emit the `remove` event with `selection_count: 0` and let the navigation produce its own `page_view`; do not synthesize a `clear` event.
- Guide: `guide_open`/`guide_close` with `screen: "compare"`.
- Load error: emit `content_load_error({ screen: "compare", error })` in the existing error branch, without changing the rendered message.

- [ ] **Step 1: Add the instrumentation. No behavior changes other than the added calls.**

- [ ] **Step 2: Verify.**

---

### Task 7: Dataset-detail and background instrumentation — view changes, outbound actions, load errors

**Files:**
- Modify: `frontend/glucose-ml-web/src/features/dataset-detail/CGMDataSection.tsx`, `DatasetHeader.tsx`, `DatasetDetail.tsx`
- Modify: `frontend/glucose-ml-web/src/features/background/BackgroundPage.tsx`

**Instrumentation:**
- `CGMDataSection` owns the tab state as `TabKey = "hist" | "tir"`. On change, emit `detail_view_change` with the dataset name and the **approved** value — map `hist` → `histogram`, `tir` → `time_in_range`. Keep the internal `TabKey` unchanged; do the mapping at the analytics boundary. `CGMDataSection` needs the dataset name — thread it down as a prop from `DatasetDetail` if it is not already available.
- `DatasetHeader` has four plain `<a target="_blank">` outbound links with no existing `onClick`: Request access (`dataset.datasetLink`, controlled-access branch), Download dataset (`dataset.downloadLink`), Dataset source (`dataset.datasetLink`), Helper scripts (`helperScriptsUrl`). Add an `onClick` to each emitting `dataset_action` with the dataset name, the fixed action (`request_access` | `download` | `source` | `helper_scripts`), and the destination host derived from the href. **Do not** call `preventDefault`, do not make the handler async, and do not delay navigation. The disabled-button fallback branch (no link available) emits nothing.
- `DatasetDetail`'s outer `catch` emits `content_load_error({ screen: "dataset_detail", error })` in the existing error branch.
- `BackgroundPage`'s chart `.catch` currently discards the error entirely. Change it to `catch((error) => …)`, emit `content_load_error({ screen: "background", error })`, and keep setting `setChartLoadFailed(true)`. The rendered message must not change, and the error value must not be stored in state or displayed.
- Add `background` to the `ScreenName` union in `params.ts` if Task 1 did not include it.

- [ ] **Step 1: Add the instrumentation.**

- [ ] **Step 2: Verify.**

---

### Task 8: Instrumentation contract test and GA4 reporting documentation

**Files:**
- Create: `frontend/glucose-ml-web/tests/analytics-instrumentation-contract.test.ts`
- Create: `docs/superpowers/specs/2026-07-20-ga4-reporting-setup.md`
- Modify: `frontend/glucose-ml-web/README.md`

**Requirements:**

- [ ] **Step 1: Write the instrumentation contract test**

`tests/analytics-instrumentation-contract.test.ts` asserts, by reading source text:
- each instrumented file imports its helpers from the `analytics` barrel and no feature file references `window.gtag` or `dataLayer`;
- `HomePage.tsx` calls `trackFilterChange`, `trackFilterClear`, `trackCompareSelectionChange`, `trackGuideOpen`, `trackGuideClose`, `trackContentLoadError`; `DatasetCard.tsx` and `CompareTable.tsx` call `trackDatasetOpen`; `CompareBar.tsx` calls `trackCompareStart`; `ComparePage.tsx` calls `trackCompareSectionToggle`'s owner file `CompareTable.tsx` and its own guide/error helpers; `CGMDataSection.tsx` calls `trackDetailViewChange`; `DatasetHeader.tsx` calls `trackDatasetAction`; `DatasetDetail.tsx` and `BackgroundPage.tsx` call `trackContentLoadError`;
- `DatasetHeader.tsx` contains no `preventDefault` in its outbound-link handlers;
- `FilterBar.tsx` exposes `onClearFilters` and its clear button no longer loops `onFilterChange`.

- [ ] **Step 2: Write `docs/superpowers/specs/2026-07-20-ga4-reporting-setup.md`**

List every custom dimension to register in GA4 (event-scoped, one per custom parameter in the reference table, with its parameter name and value domain), and give the six Explorations from the spec's *GA4 Reporting Setup* section as concrete step recipes (dimensions, metrics, funnel steps, segments). State that reports remain aggregate and anonymous.

- [ ] **Step 3: Document the environment variables in `frontend/glucose-ml-web/README.md`**

Cover `VITE_GA_MEASUREMENT_ID` (optional override, default `G-7VEBP7G8TE`), `VITE_GA_DEBUG=true` (enables analytics locally and GA4 DebugView), and the fact that deployed builds enable analytics automatically.

- [ ] **Step 4: Verify.**

---

## Manual Browser Pass (after Task 8)

Run `VITE_GA_DEBUG=true npm run dev` and, with GA4 DebugView open, exercise: home filtering and clearing, dataset card open, compare selection → compare start, compare section toggles and detail open, dataset-detail tab switch, each outbound action, guide open/close on home and compare, and scrolling each route. Confirm one `page_view` per navigation, no duplicate events, no console errors, and that no payload contains a URL, message, or query string.
