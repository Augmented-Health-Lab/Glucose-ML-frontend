# Glucose-ML Web Application

Vite, React, and TypeScript application for the Glucose-ML public frontend.

```bash
npm ci
node --test tests/*.test.ts
npm run lint
npm run build
npm run dev
```

Runtime aggregate data and required visual assets are under `public/`. Participant-level and subject-level dataset content is intentionally excluded from this repository.

## Google Analytics 4

Deployed builds send anonymous interaction analytics to GA4 property
`G-7VEBP7G8TE`. Override the property at build time with
`VITE_GA_MEASUREMENT_ID`. Local development does not send events by default;
run `VITE_GA_DEBUG=true npm run dev` to validate events in GA4 DebugView.

The application never sends user IDs, study/cohort identifiers, health values,
free-form text, raw errors, or arbitrary query parameters. Preview deployments
are labeled `preview`, the public site is labeled `production`, and localhost
debug traffic is labeled `local` through the `environment` event parameter.

Because the application sends manual React Router page views, disable GA4's
automatic browser-history page views to prevent duplicates: open Admin → Data
streams → Stream `1525054633` → Enhanced measurement settings → Page views →
Show advanced settings, then clear **Page changes based on browser history
events**. Keep other useful Enhanced Measurement options enabled.

### Custom definitions

In Admin → Data display → Custom definitions, create event-scoped custom
dimensions for `environment`, `route_type`, `dataset_name`, `origin`,
`filter_name`, `filter_value`, `action`, `dataset_names`, `section`, `state`,
`view`, `destination_hostname`, `screen`, and `category`.

Create event-scoped custom metrics for `active_filter_count`, `result_count`,
`selection_count`, `percent_scrolled`, and `cleared_filter_count`.

### User-testing Explorations

Create these GA4 Explorations:

- Discovery funnel: home `page_view` → `filter_change` → `dataset_open`.
- Comparison funnel: `compare_selection_change` → `compare_start` →
  compare-origin `dataset_open`.
- Access funnel: detail `page_view` → `detail_view_change` → `dataset_action`.
- Guide use segmented by `screen` and followed by the next product action.
- `scroll_depth` segmented by `route_type` and `dataset_name`.
- `content_load_error` segmented by `screen` and `environment`.
