# Google Analytics 4 Integration Design

## Goal

Add detailed, anonymous Google Analytics 4 instrumentation to the Glucose-ML React application for website user testing. Analytics must start immediately for deployed visitors, must not identify participants, and must never include health values, free-form text, or other personal data.

## Configuration

- Use GA4 Measurement ID `G-7VEBP7G8TE` by default.
- Allow `VITE_GA_MEASUREMENT_ID` to override the default for future environments.
- The numeric GA4 Stream ID is not required by the browser integration.
- Keep the existing Vercel Analytics integration as an independent traffic baseline.
- Disable GA4's automatic initial page view and emit route-aware page views manually so the React single-page application records exactly one page view per navigation.
- In GA4 Stream `1525054633`, disable Enhanced Measurement's **Page changes based on browser history events** option. Google documents that this setting can emit history-based page views even when `send_page_view` is false, which would duplicate the application's manual React Router events.
- Deployed production and preview builds enable analytics immediately.
- Local development does not send analytics unless `VITE_GA_DEBUG=true` is set. Debug mode also marks events for GA4 DebugView.
- Add an `environment` event parameter derived from the hostname so production and preview traffic can be separated in GA4 reports.

## Architecture

Create a focused `src/analytics/` module with these responsibilities:

1. Load `gtag.js` once and create the GA data layer.
2. Initialize the configured property idempotently with automatic page views disabled.
3. Expose typed functions for the approved events and parameters.
4. Normalize and bound parameter values before they reach GA4.
5. Behave as a safe no-op when analytics is disabled, unavailable, or blocked.
6. Track React Router navigation and per-route scroll milestones from one component mounted inside `BrowserRouter`.

Feature components will call named analytics helpers from their existing interaction handlers. Raw `window.gtag` calls will not be distributed through the application.

## Privacy Rules

The analytics layer must not set or send:

- user IDs, participant IDs, cohort IDs, or persistent custom identifiers;
- names, email addresses, IP-derived custom values, or free-form user text;
- glucose measurements, health attributes, or dataset participant-level data;
- raw exception messages, stack traces, or arbitrary URLs;
- values read from uncontrolled query-string parameters.

Allowed domain values include public dataset names, fixed UI labels, fixed route types, bounded counts, fixed action names, and destination hostnames for approved outbound links. GA4 receives anonymous interaction data only.

## Events

### Navigation and engagement

- `page_view`: normalized path, page title, route type, dataset name when the route is a dataset detail page, and environment.
- `scroll_depth`: 25, 50, 75, and 90 percent milestones, each emitted once per route visit and reset after navigation.

SPA page views will be sent after route changes. `page_location` will be built from the current origin and a normalized, whitelisted route path; the initial `page_referrer` will be reduced to its web origin before sending. Query-string values will not be copied wholesale into analytics. The compare route may report its selected public dataset names through the approved compare event parameters instead.

### Dataset discovery

- `filter_change`: filter category, selected fixed option, `add` or `remove`, active-filter count, and resulting dataset count.
- `filter_clear`: number of filters cleared and resulting dataset count.
- `dataset_open`: public dataset name and origin (`home` or `compare`).

Each filter option change produces one event. Result counts are calculated from the same next filter state that the interface applies, avoiding stale counts.

### Dataset comparison

- `compare_selection_change`: `add`, `remove`, or `clear`; public dataset name when applicable; and resulting selection count.
- `compare_start`: selected dataset count and the selected public dataset-name combination.
- `compare_section_toggle`: `population`, `sources`, or `cgm`, plus the resulting `expanded` or `collapsed` state.

Dataset combinations are sorted before serialization so equivalent comparisons aggregate together.

### Dataset details and outbound actions

- `detail_view_change`: public dataset name and selected visualization (`histogram` or `time_in_range`).
- `dataset_action`: public dataset name, fixed action (`download`, `request_access`, `source`, or `helper_scripts`), and approved destination hostname.

Outbound events are emitted from the link activation handler without delaying or preventing navigation. GA4 Enhanced Measurement may still record its standard outbound-click event; the custom event provides domain-specific meaning.

### Guidance and reliability

- `guide_open` and `guide_close`: fixed screen context (`home`, `compare`, or `dataset_detail`).
- `content_load_error`: fixed screen context and safe error category only. Raw messages, URLs, and exception content are excluded.

The application continues normally if an analytics call throws or the GA script is blocked.

## Components Affected

- Application routing: mount the route/scroll analytics component and retain Vercel Analytics.
- Home filters and comparison controls: record filtering and selection flow.
- Dataset cards and compare table: record the origin of dataset-detail navigation.
- Compare controls and expandable sections: record comparison construction and exploration.
- Dataset-detail visualization tabs and primary outbound actions: record detailed content and conversion-like actions.
- Guide modal entry and exit points: record help usage by screen.
- Data-loading states: record safe failure categories at the screen boundary.

No visual redesign or consent banner is included. Analytics begins immediately as explicitly requested.

## Testing and Verification

Automated coverage will verify:

- GA initialization is idempotent and disables the automatic initial page view;
- analytics is a no-op when disabled or blocked;
- page views use normalized, approved route data and do not leak arbitrary query strings;
- scroll milestones fire once per route visit;
- event names, actions, and parameter keys match this specification;
- feature handlers instrument the major discovery, comparison, detail, guide, outbound, and error flows;
- prohibited user or health identifiers are not introduced by the analytics module.

Verification commands:

```bash
node --test tests/*.test.ts
npm run lint
npm run build
```

A browser pass will exercise home filtering, dataset selection, comparison, detail navigation, visualization changes, modal use, and outbound action activation while checking for console errors. Local GA delivery can be inspected with `VITE_GA_DEBUG=true` and GA4 DebugView.

## GA4 Reporting Setup

Documentation will list the custom dimensions needed to expose event parameters in reports. Recommended user-testing Explorations will include:

1. Discovery funnel: `page_view` (home) → `filter_change` → `dataset_open`.
2. Comparison funnel: `compare_selection_change` → `compare_start` → `dataset_open` from compare.
3. Access funnel: detail `page_view` → `detail_view_change` → `dataset_action`.
4. Help analysis: `guide_open` segmented by screen and subsequent actions.
5. Engagement analysis: scroll milestones segmented by route type and dataset.
6. Reliability analysis: `content_load_error` by screen and environment.

These reports remain aggregate and anonymous.
