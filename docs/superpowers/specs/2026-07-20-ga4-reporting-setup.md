# GA4 Reporting Setup

**Source spec:** `docs/superpowers/specs/2026-07-20-google-analytics-4-integration-design.md` (see "GA4 Reporting Setup")
**Event/parameter reference:** `docs/superpowers/plans/2026-07-20-google-analytics-4-integration.md` ("Event and Parameter Reference")
**Implementation:** `frontend/glucose-ml-web/src/analytics/events.ts`

This document lists the custom dimensions to register in the GA4 property and gives followable recipes for the six Explorations described in the source spec. All data described here is anonymous, aggregate interaction data — no participant, health, or free-form identifying data is ever sent (see the design spec's Privacy Rules). Every report built from these dimensions and metrics is itself aggregate and anonymous; none of it can be used to identify an individual visitor.

## 1. Register custom dimensions

GA4 does not expose custom event parameters in reports or Explorations until each one is registered as a **custom dimension** (Admin → Data display → Custom definitions → Create custom dimension). Register every parameter below as **event-scoped**, using the exact parameter name emitted by `events.ts`. Traffic must reach GA4 with a given parameter at least once before it can be selected in the registration dropdown, so trigger each event once (e.g. via `VITE_GA_DEBUG=true npm run dev` and GA4 DebugView) before registering it.

| Dimension name (suggested) | Event parameter | Value domain | Emitted on |
| --- | --- | --- | --- |
| Page Path | `page_path` | normalized path, no query string (e.g. `/dataset/CGMacros`) | `page_view` |
| Page Title | `page_title` | `document.title` at navigation time — **currently constant**: `index.html` sets one static `<title>` and nothing updates it per route, so every `page_view` sends the same string today. `route_type`/`page_path` carry the real per-route signal; don't register this dimension until per-route titles exist. | `page_view` |
| Route Type | `route_type` | `home` \| `background` \| `about` \| `dataset_detail` \| `compare` \| `other` | `page_view`, `scroll_depth` |
| Dataset Name | `dataset_name` | public dataset name (e.g. `CGMacros`) | `page_view`, `scroll_depth` (dataset-detail only), `dataset_open`, `compare_selection_change` (except `clear`), `detail_view_change`, `dataset_action` |
| Scroll Percent | `percent` | `25` \| `50` \| `75` \| `90` | `scroll_depth` |
| Filter Category | `filter_category` | fixed filter label from `src/data/filters.ts` (e.g. `Data Sources`, `Population`) | `filter_change` |
| Filter Option | `filter_option` | fixed filter option from `src/data/filters.ts` | `filter_change` |
| Filter Action | `filter_action` | `add` \| `remove` | `filter_change` |
| Active Filter Count | `active_filter_count` | integer, `0`–`999` | `filter_change` |
| Result Count | `result_count` | integer, `0`–`999` | `filter_change`, `filter_clear` |
| Cleared Filter Count | `cleared_filter_count` | integer, `0`–`999` | `filter_clear` |
| Dataset Open Origin | `origin` | `home` \| `compare` | `dataset_open` |
| Selection Action | `selection_action` | `add` \| `remove` \| `clear` | `compare_selection_change` |
| Selection Count | `selection_count` | integer, `0`–`999` | `compare_selection_change`, `compare_start` |
| Dataset Combination | `dataset_combination` | sorted, `\|`-joined public dataset names, max 100 characters | `compare_start` |
| Compare Section | `section` | `population` \| `sources` \| `cgm` | `compare_section_toggle` |
| Section State | `section_state` | `expanded` \| `collapsed` | `compare_section_toggle` |
| Detail View | `detail_view` | `histogram` \| `time_in_range` | `detail_view_change` |
| Dataset Action | `action` | `download` \| `request_access` \| `source` \| `helper_scripts` | `dataset_action` |
| Destination Host | `destination_host` | hostname only, no path/query (e.g. `github.com`) | `dataset_action` |
| Screen | `screen` | `content_load_error`: `home` \| `compare` \| `dataset_detail` \| `background`. `guide_open`/`guide_close`: `home` \| `compare` only — `GuideButton`/`LegendModal` aren't mounted on the dataset-detail or background pages, so those two values never appear on the guide events. | `guide_open`, `guide_close`, `content_load_error` |
| Error Category | `error_category` | `network` \| `not_found` \| `parse` \| `missing_data` \| `unknown` | `content_load_error` |
| Environment | `environment` | `production` \| `preview` \| `development` | every event |

`Environment` is carried by every event (merged in by `sendEvent` in `src/analytics/gtag.ts`) and should be used as a segmenting dimension across every Exploration below — in particular, filter to `environment = production` when the goal is to see genuine visitor behavior rather than local/preview testing traffic.

## 2. Explorations

Build each of the following in GA4 → Explore → Blank exploration, using **Free form** or **Funnel exploration** technique as noted. Add the custom dimensions above as **Segments** and **Breakdowns** as described.

### 2.1 Discovery funnel

**Technique:** Funnel exploration.
**Steps:**
1. `page_view` where `route_type` = `home`
2. `filter_change` (any)
3. `dataset_open` where `origin` = `home`

**Breakdown:** `filter_category` on step 2 to see which filter categories precede a dataset open.
**Segment:** `environment` = `production`.
**Reads:** what fraction of home visitors filter before opening a dataset, and which filter categories correlate with conversion to `dataset_open`.

### 2.2 Comparison funnel

**Technique:** Funnel exploration.
**Steps:**
1. `compare_selection_change` where `selection_action` = `add`
2. `compare_start`
3. `dataset_open` where `origin` = `compare`

**Breakdown:** `selection_count` on step 2 (bucket via a numeric dimension range) to see how comparison-set size relates to follow-through.
**Segment:** `environment` = `production`.
**Reads:** how often building a comparison set leads to starting a comparison, and how often a compare view leads back into a dataset-detail page.

### 2.3 Access funnel

**Technique:** Funnel exploration.
**Steps:**
1. `page_view` where `route_type` = `dataset_detail`
2. `detail_view_change`
3. `dataset_action`

**Breakdown:** `action` on step 3 (`download` / `request_access` / `source` / `helper_scripts`) to split by outbound-action type; `dataset_name` to compare per-dataset conversion.
**Segment:** `environment` = `production`.
**Reads:** how often visitors who land on a dataset-detail page explore its visualizations before taking an outbound action, and which action types are most common.

### 2.4 Help analysis

**Technique:** Free form exploration.
**Rows:** `screen`.
**Values:** event count filtered to `guide_open`.
**Segments:** one segment per `screen` value (`home`, `compare` — the only two screens with a guide button; `dataset_detail` never appears on `guide_open`/`guide_close`, see the `Screen` row above) that opened the guide, each followed by a secondary condition on a subsequent event in the same session (e.g. `filter_change`, `compare_start`, `dataset_action`) to see what visitors do right after consulting the guide.
**Breakdown:** add `guide_close` counts alongside `guide_open` per screen to gauge how long the guide stays open (session-level, not per-event duration).
**Reads:** which screens' visitors rely on the guide most, and what they do immediately afterward.

### 2.5 Engagement analysis

**Technique:** Free form exploration.
**Rows:** `route_type`, secondary dimension `dataset_name` (dataset-detail rows only).
**Values:** event count filtered to `scroll_depth`, broken down by `percent`.
**Segments:** `environment` = `production`.
**Reads:** how deeply visitors scroll on each route type, and whether specific datasets' detail pages see deeper engagement than others.

### 2.6 Reliability analysis

**Technique:** Free form exploration.
**Rows:** `screen`.
**Columns:** `error_category`.
**Values:** event count filtered to `content_load_error`.
**Segments:** one segment per `environment` value (`production`, `preview`, `development`) to distinguish real user-facing failures from local/preview testing noise.
**Reads:** which screens and error categories account for the most load failures, and whether failures are concentrated in a particular environment.

## Aggregate and anonymous

All six Explorations above operate on GA4's built-in event counts, users, and sessions, aggregated across many visitors. None of the custom dimensions registered in Section 1 carry a persistent identifier, a name, an email address, a health value, or free-form text (see the design spec's Privacy Rules and `src/analytics/params.ts`'s `categorizeLoadError`/`getDestinationHost` normalizers). These reports remain aggregate and anonymous.
