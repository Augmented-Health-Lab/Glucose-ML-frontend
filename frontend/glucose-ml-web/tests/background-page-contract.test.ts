import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const backgroundPageTsx = readFileSync(
  new URL("../src/features/background/BackgroundPage.tsx", import.meta.url),
  "utf8"
);
const backgroundPageCss = readFileSync(
  new URL("../src/features/background/background-page.css", import.meta.url),
  "utf8"
);
const backgroundCgmChartTsx = readFileSync(
  new URL("../src/features/background/BackgroundCgmChart.tsx", import.meta.url),
  "utf8"
);

test("background section buttons explicitly scroll to their matching sections", () => {
  assert.match(backgroundPageTsx, /handleAnchorClick/);
  assert.match(backgroundPageTsx, /<button/);
  assert.match(backgroundPageTsx, /getStickyHeaderHeight/);
  assert.match(backgroundPageTsx, /window\.scrollTo\(\{\s*top:\s*target\.offsetTop\s*-\s*getStickyHeaderHeight\(\)/s);
  assert.match(backgroundPageTsx, /window\.history\.pushState\(null,\s*"",\s*href\)/);
});

test("only the background tab filters remain sticky while scrolling", () => {
  assert.match(
    backgroundPageCss,
    /\.background-anchor-nav-shell\s*\{[^}]*position:\s*sticky[^}]*top:\s*0/s
  );
  assert.doesNotMatch(
    backgroundPageCss,
    /\.background-hero\s*\{[^}]*position:\s*sticky/s
  );
  assert.match(backgroundPageTsx, /className="background-anchor-nav-shell"/);
  assert.match(
    backgroundPageCss,
    /\.background-anchor-nav-shell\s*\{[^}]*padding:\s*0\s+0\s+24px/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-anchor-nav\s*\{[^}]*justify-content:\s*center/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-anchor-nav__item\s*\{[^}]*border:\s*1px\s+solid\s+#e1e8e7[^}]*background:\s*#f5f8f8[^}]*color:\s*#3d403f/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-anchor-nav__item\s*\{[^}]*\n\s+height:\s*41px/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-anchor-nav__item--active\s*\{[^}]*border-color:\s*#e1e8e7[^}]*background:\s*#2f8c88[^}]*color:\s*#ffffff/s
  );
});

test("background section anchors reserve space for the sticky header", () => {
  assert.match(
    backgroundPageCss,
    /\.background-section\s*\{[^}]*scroll-margin-top:\s*var\(--background-sticky-offset\)/s
  );
  assert.doesNotMatch(
    backgroundPageCss,
    /--background-sticky-offset:\s*0px/
  );
  assert.match(backgroundPageTsx, /window\.addEventListener\("hashchange"/);
  assert.match(backgroundPageTsx, /getAnchorHrefFromHash/);
});

test("background active section follows scrolling below the sticky header", () => {
  assert.match(backgroundPageTsx, /selectActiveAnchorHref/);
  assert.match(
    backgroundPageTsx,
    /window\.addEventListener\("scroll",\s*handleScroll,\s*\{\s*passive:\s*true,?\s*\}\)/s
  );
  assert.match(
    backgroundPageTsx,
    /window\.addEventListener\("resize",\s*scheduleActiveAnchorSync\)/
  );
  assert.match(
    backgroundPageTsx,
    /window\.requestAnimationFrame\(syncActiveAnchor\)/
  );
  assert.match(
    backgroundPageTsx,
    /window\.cancelAnimationFrame\(animationFrameId\)/
  );
  assert.match(backgroundPageTsx, /navigationHrefRef\.current = href/);
  assert.match(
    backgroundPageTsx,
    /navigationHref:\s*navigationHrefRef\.current/
  );
  assert.match(backgroundPageTsx, /scrollSettleTimeoutId/);
});

test("background hero header matches Figma centered spacing", () => {
  assert.match(
    backgroundPageCss,
    /\.background-page\s*\{[^}]*--background-sticky-offset:\s*65px/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-hero\s*\{[^}]*padding:\s*60px\s+0\s+24px[^}]*text-align:\s*center/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-eyebrow\s*\{[^}]*margin:\s*0\s+0\s+8px[^}]*line-height:\s*24px/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-hero h1\s*\{[^}]*font-size:\s*36px[^}]*line-height:\s*44px/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-hero__subtitle\s*\{[^}]*margin:\s*8px\s+0\s+0[^}]*line-height:\s*24px/s
  );
});

test("background learn more links route to the CDC diabetes overview", () => {
  const cdcDiabetesOverviewHref = "https://www.cdc.gov/diabetes/about/index.html";

  assert.match(
    backgroundPageTsx,
    /https:\/\/www\.cdc\.gov\/diabetes\/about\/index\.html/
  );
  assert.equal(
    backgroundPageTsx.split(cdcDiabetesOverviewHref).length - 1,
    2
  );
  assert.doesNotMatch(backgroundPageTsx, /niddk\.nih\.gov/);
});

test("background glossary section appears above the model rationale section", () => {
  const dataIndex = backgroundPageTsx.indexOf('id="data"');
  const modelsIndex = backgroundPageTsx.indexOf('id="models"');
  const glossaryIndex = backgroundPageTsx.indexOf('id="glossary"');
  const diversityIndex = backgroundPageTsx.indexOf('id="diversity"');

  assert.ok(dataIndex !== -1);
  assert.ok(modelsIndex !== -1);
  assert.ok(glossaryIndex !== -1);
  assert.ok(diversityIndex !== -1);
  assert.ok(dataIndex < glossaryIndex);
  assert.ok(glossaryIndex < modelsIndex);
  assert.ok(modelsIndex < diversityIndex);
});

test("background metrics use the Figma primary terms and disclose the remaining terms", () => {
  assert.match(backgroundPageTsx, /const primaryMetricTerms/);
  assert.match(backgroundPageTsx, /const additionalMetricTerms/);
  assert.match(backgroundPageTsx, /CGM wear time/);
  assert.match(backgroundPageTsx, /Time above range/);
  assert.match(backgroundPageTsx, /Time in range/);
  assert.match(backgroundPageTsx, /Time below range/);
  assert.match(backgroundPageTsx, /Glycemic variability/);
  assert.match(backgroundPageTsx, /Mean glucose/);
  assert.match(backgroundPageTsx, /Sampling frequency/);
  assert.match(backgroundPageTsx, /aria-expanded=\{showAllMetrics\}/);
  assert.match(backgroundPageTsx, /showAllMetrics \? "See less" : "See more"/);
  assert.match(backgroundPageCss, /\.background-glossary-toggle/);
});

test("background page wording follows Figma frame 36685", () => {
  assert.match(
    backgroundPageTsx,
    /This page provides basic background and context needed to understand\s+the Glucose-ML project and mission - no prior knowledge is needed\./
  );
  assert.match(backgroundPageTsx, /What is a Continuous Glucose Monitor \(CGM\)\?/);
  assert.doesNotMatch(backgroundPageTsx, /What is a Continuous Glucose Monitoring \(CGM\)\?/);
  assert.match(backgroundPageTsx, /What CGM data look like/);
  assert.match(backgroundPageTsx, /Why real CGM data matters/);
  assert.match(backgroundPageTsx, /Why dataset diversity matters/);
  assert.match(backgroundPageTsx, /What are common CGM Metrics\?/);
  assert.match(backgroundPageTsx, /Why real CGM data matters for research\?/);
  assert.match(backgroundPageTsx, /Why dataset diversity is important\?/);
});

test("background anchor buttons follow the rendered section order", () => {
  const dataAnchorIndex = backgroundPageTsx.indexOf('href: "#data"');
  const glossaryAnchorIndex = backgroundPageTsx.indexOf('href: "#glossary"');
  const modelsAnchorIndex = backgroundPageTsx.indexOf('href: "#models"');
  const diversityAnchorIndex = backgroundPageTsx.indexOf('href: "#diversity"');

  assert.ok(dataAnchorIndex !== -1);
  assert.ok(glossaryAnchorIndex !== -1);
  assert.ok(modelsAnchorIndex !== -1);
  assert.ok(diversityAnchorIndex !== -1);
  assert.ok(dataAnchorIndex < glossaryAnchorIndex);
  assert.ok(glossaryAnchorIndex < modelsAnchorIndex);
  assert.ok(modelsAnchorIndex < diversityAnchorIndex);
});

test("background CGM chart renders accessible responsive SVG series", () => {
  assert.match(backgroundCgmChartTsx, /viewBox="0 0 1200 720"/);
  assert.match(backgroundCgmChartTsx, /role="img"/);
  assert.match(backgroundCgmChartTsx, /<title id=\{titleId\}>/);
  assert.match(backgroundCgmChartTsx, /<desc id=\{descriptionId\}>/);
  assert.match(backgroundCgmChartTsx, /createLinePath\(series\.points\)/);
  assert.match(
    backgroundCgmChartTsx,
    /visibleGroupKeys\.includes\(series\.key\)/
  );
  assert.match(
    backgroundCgmChartTsx,
    /strokeDasharray=\{style\.dashArray\}/
  );
});

test("background CGM group pills toggle the interactive chart", () => {
  assert.match(backgroundPageTsx, /DEFAULT_VISIBLE_GROUP_KEYS/);
  assert.match(backgroundPageTsx, /toggleVisibleGroup/);
  assert.match(backgroundPageTsx, /aria-pressed=\{isSelected\}/);
  assert.match(backgroundPageTsx, /background-filter-pill--unselected/);
  assert.match(backgroundPageTsx, /background_cgm_chart\.json/);
  assert.match(backgroundPageTsx, /<BackgroundCgmChart/);
  assert.match(backgroundPageTsx, /Select groups to show:/);
  assert.match(backgroundPageTsx, /key:\s*"nd"[\s\S]*tone:\s*"nd"/);
  assert.match(
    backgroundPageCss,
    /\.background-filter-pill--t1d\s*\{[^}]*background:\s*#db292c/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-filter-pill--t2d\s*\{[^}]*background:\s*#e97319/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-filter-pill--pred\s*\{[^}]*background:\s*#e1d721/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-filter-pill--nd\s*\{[^}]*background:\s*#1ce04d/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-filter-pill--unselected\s*\{[^}]*background:\s*#e3e6e5[^}]*color:\s*#9ca6a4/s
  );
  assert.match(
    backgroundPageCss,
    /\.background-timeseries\s*\{[^}]*aspect-ratio:\s*1319\s*\/\s*794[^}]*border-radius:\s*20px/s
  );
  assert.match(
    backgroundPageCss,
    /@media\s*\(max-height:\s*820px\)\s*and\s*\(min-width:\s*900px\)\s*\{[\s\S]*\.background-timeseries\s*\{[^}]*width:\s*min\(100%,\s*calc\(\(100vh\s*-\s*230px\)\s*\*\s*1319\s*\/\s*794\)\)[^}]*margin-inline:\s*auto/s
  );
});
