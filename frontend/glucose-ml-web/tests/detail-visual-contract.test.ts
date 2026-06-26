import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const headerCss = readFileSync(
  new URL("../src/features/dataset-detail/dataset-header.css", import.meta.url),
  "utf8"
);
const headerTsx = readFileSync(
  new URL("../src/features/dataset-detail/DatasetHeader.tsx", import.meta.url),
  "utf8"
);
const metricCss = readFileSync(
  new URL("../src/features/dataset-detail/cgm-metric-tile.css", import.meta.url),
  "utf8"
);
const metricTsx = readFileSync(
  new URL("../src/features/dataset-detail/CgmMetricTile.tsx", import.meta.url),
  "utf8"
);
const cgmSectionCss = readFileSync(
  new URL("../src/features/dataset-detail/cgm-data-section.css", import.meta.url),
  "utf8"
);
const cgmSectionTsx = readFileSync(
  new URL("../src/features/dataset-detail/CGMDataSection.tsx", import.meta.url),
  "utf8"
);
const cgmTabGroupTsx = readFileSync(
  new URL("../src/features/dataset-detail/CgmTabGroup.tsx", import.meta.url),
  "utf8"
);
const cgmTabGroupCss = readFileSync(
  new URL("../src/features/dataset-detail/cgm-tab-group.css", import.meta.url),
  "utf8"
);
const glucoseRangeChartTsx = readFileSync(
  new URL("../src/features/dataset-detail/GlucoseRangeChart.tsx", import.meta.url),
  "utf8"
);
const histogramChartTsx = readFileSync(
  new URL("../src/features/dataset-detail/HistogramChart.tsx", import.meta.url),
  "utf8"
);
const histogramCss = readFileSync(
  new URL("../src/features/dataset-detail/histogram-chart.css", import.meta.url),
  "utf8"
);
const dataSourcesCss = readFileSync(
  new URL("../src/features/dataset-detail/data-sources-section.css", import.meta.url),
  "utf8"
);
const downloadIconSvg = readFileSync(
  new URL("../public/figma-assets/icon-download.svg", import.meta.url),
  "utf8"
);

test("detail access icon rotation is only applied to controlled access", () => {
  assert.match(headerTsx, /normalizeDatasetAccess\(dataset\.access\)/);
  assert.match(headerTsx, /detail-header__access-icon--controlled/);
  assert.doesNotMatch(
    headerCss,
    /\.detail-header__metadata span:nth-child\(2\) img\s*\{[^}]*transform:\s*rotate\(180deg\)/s
  );
  assert.match(
    headerCss,
    /\.detail-header__access-icon--controlled\s*\{[^}]*transform:\s*rotate\(180deg\)/s
  );
});

test("secondary detail actions use Figma hover and clicked background states", () => {
  const primitivesCss = readFileSync(
    new URL("../src/styles/primitives.css", import.meta.url),
    "utf8"
  );

  assert.match(
    primitivesCss,
    /\.glm-button-secondary:hover\s*\{[^}]*background:\s*var\(--glm-color-teal-page\)/s
  );
  assert.match(
    primitivesCss,
    /\.glm-button-secondary:active\s*\{[^}]*background:\s*var\(--glm-color-medium-grey\)/s
  );
});

test("primary detail action uses Frame 36633 default colors and Frame 36356 hover colors", () => {
  const primitivesCss = readFileSync(
    new URL("../src/styles/primitives.css", import.meta.url),
    "utf8"
  );

  assert.match(
    primitivesCss,
    /\.glm-button-primary\s*\{[^}]*background:\s*var\(--glm-color-brand-dark\)[^}]*border-color:\s*var\(--glm-color-brand-dark\)[^}]*color:\s*var\(--glm-color-white\)/s
  );
  assert.match(
    primitivesCss,
    /\.glm-button-primary:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--glm-color-grey-border\)[^}]*border-color:\s*var\(--glm-color-brand-dark\)[^}]*color:\s*var\(--glm-color-brand-dark\)/s
  );
  assert.match(primitivesCss, /\.glm-button\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(headerCss, /\.detail-header__actions\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(primitivesCss, /\.glm-button__icon\s*\{[^}]*display:\s*inline-block[^}]*width:\s*16px[^}]*height:\s*16px/s);
  assert.match(primitivesCss, /\.glm-button__download-icon\s*\{[^}]*background:\s*currentColor[^}]*mask:\s*url\("\/figma-assets\/icon-download\.svg"\)/s);
  assert.match(downloadIconSvg, /stroke="white"/);
});

test("controlled access detail actions replace downloads with access requests", () => {
  const primitivesCss = readFileSync(
    new URL("../src/styles/primitives.css", import.meta.url),
    "utf8"
  );

  assert.match(headerTsx, /const isControlledAccess = accessType === "Controlled"/);
  assert.match(headerTsx, /\{isControlledAccess \? \(/);
  assert.match(headerTsx, /detail-header__request-icon/);
  assert.match(
    primitivesCss,
    /\.glm-button-primary:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--glm-color-grey-border\)/s
  );
  assert.match(
    primitivesCss,
    /\.glm-button-primary:disabled\s*\{[^}]*background:\s*var\(--glm-color-medium-grey\)[^}]*cursor:\s*default[^}]*transition:\s*none/s
  );
});

test("detail headers render the Figma action set for controlled and open datasets", () => {
  assert.match(headerTsx, /Year \{year\}/);
  assert.match(
    headerTsx,
    /const HELPER_SCRIPTS_URL =\s*"https:\/\/github\.com\/Augmented-Health-Lab\/Glucose-ML-Project\/tree\/main\/2_Harmonize-cgm-datasets"/
  );
  assert.match(headerTsx, /isControlledAccess \? \(/);
  assert.match(headerTsx, />\s*Request access\s*</);
  assert.match(headerTsx, />\s*Download dataset\s*</);
  assert.match(headerTsx, />\s*Dataset source\s*</);
  assert.match(headerTsx, />\s*Helper scripts\s*</);
  assert.doesNotMatch(headerTsx, /View original source/);
});

test("CGM overview and time-in-range labels use the approved full wording", () => {
  assert.match(
    cgmSectionTsx,
    />\s*Overview of continuous glucose monitoring \(CGM\) data\s*</
  );
  assert.match(glucoseRangeChartTsx, /T1D:\s*"Type 1 diabetes"/);
  assert.match(glucoseRangeChartTsx, /T2D:\s*"Type 2 diabetes"/);
  assert.match(glucoseRangeChartTsx, /PreD:\s*"Pre-diabetes"/);
  assert.match(glucoseRangeChartTsx, /ND:\s*"No diabetes"/);
  assert.match(glucoseRangeChartTsx, /formatPopulationLabel\(bar\.group\)/);
});

test("CGM metric tiles share the Figma typography and alignment while allowing long values to wrap", () => {
  assert.match(
    cgmSectionCss,
    /grid-template-columns:\s*149px\s+168px\s+136px\s+minmax\(0,\s*213px\)/
  );
  assert.match(cgmSectionCss, /width:\s*min\(690px,\s*100%\)/);
  assert.match(metricCss, /\.cgm-metric-tile\s*\{[^}]*min-height:\s*71px/s);
  assert.doesNotMatch(metricCss, /\.cgm-metric-tile\s*\{[^}]*\n\s*height:\s*71px/s);
  assert.match(metricCss, /\.cgm-metric-tile\s*\{[^}]*overflow:\s*visible/s);
  assert.match(metricCss, /\.cgm-metric-tile\s*\{[^}]*justify-content:\s*flex-start/s);
  assert.match(metricCss, /\.cgm-metric-tile__value\s*\{[^}]*font-size:\s*18px/s);
  assert.doesNotMatch(metricCss, /\.cgm-metric-tile--device/);
  assert.doesNotMatch(metricTsx, /cgm-metric-tile--device/);
  assert.match(metricCss, /\.cgm-metric-tile__value\s*\{[^}]*line-height:\s*1\.2/s);
  assert.match(metricCss, /\.cgm-metric-tile__value\s*\{[^}]*white-space:\s*normal/s);
  assert.match(metricCss, /\.cgm-metric-tile__value\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});

test("data sources labels and values match detail card typography", () => {
  assert.match(dataSourcesCss, /\.source-name\s*\{[^}]*font-size:\s*14\.471px/s);
  assert.match(dataSourcesCss, /\.source-name\s*\{[^}]*font-weight:\s*400/s);
  assert.match(dataSourcesCss, /\.source-detail\s*\{[^}]*font-size:\s*16\.539px/s);
  assert.match(dataSourcesCss, /\.source-detail\s*\{[^}]*font-weight:\s*600/s);
});

test("histogram legend matches the time-in-range legend scale and padding", () => {
  assert.match(histogramCss, /\.histogram-wrap\s*\{[^}]*padding:\s*24px 32px 32px/s);
  assert.match(histogramCss, /\.histogram-legend\s*\{[^}]*justify-content:\s*flex-start/s);
  assert.match(histogramCss, /\.histogram-legend\s*\{[^}]*padding:\s*0 0 28px/s);
  assert.match(histogramCss, /\.histogram-swatch\s*\{[^}]*width:\s*16px/s);
  assert.match(histogramCss, /\.histogram-swatch\s*\{[^}]*height:\s*16px/s);
  assert.match(histogramCss, /\.histogram-swatch\s*\{[^}]*border-radius:\s*2\.067px/s);
  assert.match(histogramCss, /\.histogram-legend-title\s*\{[^}]*font-size:\s*12px/s);
  assert.match(histogramCss, /\.histogram-legend-title\s*\{[^}]*font-weight:\s*400/s);
  assert.match(histogramCss, /\.histogram-legend-range\s*\{[^}]*font-size:\s*10px/s);
  assert.match(histogramCss, /\.histogram-legend-range\s*\{[^}]*font-weight:\s*400/s);
});

test("detail charts use the approved mg/dL ranges", () => {
  assert.match(glucoseRangeChartTsx, /GLUCOSE_DETAIL_RANGE_DEFINITIONS/);
  assert.match(glucoseRangeChartTsx, /GLUCOSE_DETAIL_RANGE_ORDER/);
  assert.match(histogramChartTsx, /GLUCOSE_RANGE_DEFINITIONS/);
  assert.match(histogramChartTsx, /GLUCOSE_RANGE_ORDER/);
  assert.doesNotMatch(glucoseRangeChartTsx, /<54mg\/dL/);
  assert.doesNotMatch(histogramChartTsx, /<54mg\/dL/);
});

test("histogram tooltip shows bin range, units, and count", () => {
  assert.match(histogramChartTsx, /rangeStart:\s*point\.bin_start/);
  assert.match(histogramChartTsx, /rangeEnd:\s*point\.bin_end/);
  assert.match(
    histogramChartTsx,
    /\$\{formatGlucoseBinValue\(rangeStart\)\} - \$\{formatGlucoseBinValue\(rangeEnd\)\} mg\/dL/
  );
  assert.match(histogramChartTsx, /className="histogram-tooltip-count"/);
  assert.match(histogramChartTsx, /count:\s*\{hoveredBar\.count\}/);
  assert.doesNotMatch(histogramChartTsx, /count\s+:\s+\{/);
  assert.doesNotMatch(histogramChartTsx, /mg\/dL,\s*count:/);
  assert.match(histogramCss, /\.histogram-tooltip-count\s*\{[^}]*font-size:\s*15\.14px/s);
  assert.match(histogramCss, /\.histogram-tooltip-count\s*\{[^}]*font-weight:\s*400/s);
});

test("time-in-range chart body hugs graph content instead of forcing empty bottom space", () => {
  assert.doesNotMatch(cgmSectionCss, /\.graph-body\s*\{[^}]*min-height:\s*380px/s);
  assert.match(cgmSectionCss, /\.graph-body\s*\{[^}]*height:\s*auto/s);
  assert.match(cgmSectionCss, /\.graph-body\s*\{[^}]*overflow:\s*visible/s);
});

test("CGM graph container has matching rounded corners on the top and bottom", () => {
  assert.doesNotMatch(cgmSectionCss, /border-radius:\s*12px\s+12px\s+0\s+0/);
  assert.match(cgmSectionCss, /\.cgm-data-section__chart\s*\{[^}]*border-radius:\s*12px/s);
});

test("dataset detail CGM tabs do not expose ambulatory glucose profile", () => {
  assert.doesNotMatch(cgmTabGroupTsx, /Ambulatory glucose profile/);
  assert.doesNotMatch(cgmTabGroupTsx, /"agp"/);
  assert.doesNotMatch(cgmSectionTsx, /Ambulatory glucose profile/);
  assert.doesNotMatch(cgmSectionTsx, /tab === "agp"/);
});

test("dataset detail CGM tabs default to the histogram", () => {
  assert.match(cgmSectionTsx, /useState<TabKey>\("hist"\)/);
  assert.match(cgmTabGroupTsx, /onClick=\{\(\) => onChange\("tir"\)\}/);
});

test("dataset detail CGM tabs keep rounded buttons on a grey strip inside a white shell", () => {
  assert.match(cgmTabGroupCss, /\.cgm-tab-group\s*\{[^}]*background:\s*var\(--glm-color-white\)/s);
  assert.match(cgmTabGroupCss, /\.cgm-tab-group__inner\s*\{[^}]*border-radius:\s*8px/s);
  assert.match(cgmTabGroupCss, /\.cgm-tab-group__inner\s*\{[^}]*background:\s*#f8f8f8/s);
  assert.match(cgmTabGroupCss, /\.cgm-tab-group__button\s*\{[^}]*border-radius:\s*8px/s);
});
