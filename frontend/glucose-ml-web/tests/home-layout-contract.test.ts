import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const gridCss = readFileSync(
  new URL("../src/features/home/dataset-grid.css", import.meta.url),
  "utf8"
);
const cardCss = readFileSync(
  new URL("../src/features/home/dataset-card.css", import.meta.url),
  "utf8"
);
const filterCss = readFileSync(
  new URL("../src/features/home/filter-bar.css", import.meta.url),
  "utf8"
);
const pageTitleCss = readFileSync(
  new URL("../src/features/home/page-title.css", import.meta.url),
  "utf8"
);
const homePageCss = readFileSync(
  new URL("../src/features/home/home-page.css", import.meta.url),
  "utf8"
);
const homePageTsx = readFileSync(
  new URL("../src/features/home/HomePage.tsx", import.meta.url),
  "utf8"
);
const filterDatasetsTs = readFileSync(
  new URL("../src/features/home/filter-datasets.ts", import.meta.url),
  "utf8"
);
const compareBarTsx = readFileSync(
  new URL("../src/features/home/CompareBar.tsx", import.meta.url),
  "utf8"
);
const datasetGridTsx = readFileSync(
  new URL("../src/features/home/DatasetGrid.tsx", import.meta.url),
  "utf8"
);
const datasetCardTsx = readFileSync(
  new URL("../src/features/home/DatasetCard.tsx", import.meta.url),
  "utf8"
);
const multiSelectTsx = readFileSync(
  new URL("../src/features/home/MultiSelect.tsx", import.meta.url),
  "utf8"
);
const glucoseDistributionBarTsx = readFileSync(
  new URL("../src/features/home/GlucoseDistributionBar.tsx", import.meta.url),
  "utf8"
);
const compareDataTs = readFileSync(
  new URL("../src/utils/compare-data.ts", import.meta.url),
  "utf8"
);
const multiSelectCss = readFileSync(
  new URL("../src/features/home/multi-select.css", import.meta.url),
  "utf8"
);
const filtersTs = readFileSync(
  new URL("../src/data/filters.ts", import.meta.url),
  "utf8"
);

test("dataset grid uses responsive Figma card columns without forcing page overflow", () => {
  assert.match(
    gridCss,
    /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/
  );
  assert.match(gridCss, /max-width:\s*1313px/);
  assert.match(gridCss, /column-gap:\s*41\.5px/);
  assert.match(gridCss, /justify-content:\s*space-between/);
  assert.doesNotMatch(gridCss, /max-width:\s*1376px/);
  assert.match(
    gridCss,
    /@media\s*\(max-width:\s*1100px\)[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
  );
  assert.match(
    gridCss,
    /@media\s*\(max-width:\s*680px\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/
  );
});

test("dataset cards keep glucose distribution aligned to the row bottom", () => {
  assert.match(cardCss, /\.dataset-card\s*\{[^}]*height:\s*100%/s);
  assert.match(cardCss, /\.dataset-card__sections\s*\{[^}]*flex:\s*1/s);
  assert.match(
    cardCss,
    /\.dataset-card__section--distribution\s*\{[^}]*margin-top:\s*auto/s
  );
});

test("dataset card glucose distribution labels render boundary ticks", () => {
  assert.match(datasetCardTsx, />\s*GLUCOSE DISTRIBUTION\s*</);
  assert.doesNotMatch(datasetCardTsx, /GLUCOSE DISTRIBUTION \(%\)/);
  assert.match(glucoseDistributionBarTsx, /getDistributionBoundaryTicks/);
  assert.match(glucoseDistributionBarTsx, /layoutDistributionBoundaryTicks/);
  assert.match(glucoseDistributionBarTsx, /new ResizeObserver/);
  assert.match(glucoseDistributionBarTsx, /dist-tick-mark/);
  assert.match(glucoseDistributionBarTsx, /aria-label=/);
  assert.match(homePageTsx, /dataset_card_glucose_distribution\.json/);
  assert.match(homePageTsx, /glucoseDistributionMap/);
  assert.doesNotMatch(homePageTsx, /averageDistribution/);
  assert.doesNotMatch(glucoseDistributionBarTsx, /glucoseCutPoints/);
  assert.doesNotMatch(glucoseDistributionBarTsx, /index % 2/);
  assert.doesNotMatch(glucoseDistributionBarTsx, /getClinicalTickPositions/);
});

test("dataset diabetes badges render Figma wording in flexible pills", () => {
  assert.match(datasetCardTsx, />DIABETES GROUPS</);
  assert.doesNotMatch(datasetCardTsx, />Diabetes Groups</);
  assert.doesNotMatch(datasetCardTsx, />POPULATION</);
  assert.match(
    cardCss,
    /\.dataset-card__section-label\s*\{[^}]*font-size:\s*10px[^}]*font-weight:\s*400/s
  );
  assert.match(datasetCardTsx, /T1D:\s*"Type 1"/);
  assert.match(datasetCardTsx, /T2D:\s*"Type 2"/);
  assert.match(datasetCardTsx, /PreD:\s*"Prediabetes"/);
  assert.match(datasetCardTsx, /ND:\s*"No Diabetes"/);
  assert.match(cardCss, /\.round-icon\s*\{[^}]*min-height:\s*27px/s);
  assert.match(cardCss, /\.round-icon\s*\{[^}]*padding:\s*6px\s+10px/s);
  assert.doesNotMatch(cardCss, /\.round-icon\s*\{[^}]*width:\s*34px/s);
  assert.doesNotMatch(multiSelectTsx, /option\.charAt\(0\)\.toUpperCase\(\)/);
});

test("dataset card metadata icons share a single Figma color and alignment system", () => {
  assert.match(datasetCardTsx, /MetadataIcon/);
  assert.doesNotMatch(datasetCardTsx, /dataset-card__metadata[\s\S]*<img/);
  assert.match(
    cardCss,
    /\.dataset-card__meta-icon\s*\{[^}]*background:\s*var\(--glm-color-meta-icon,\s*#59636e\)/s
  );
  assert.match(
    cardCss,
    /\.dataset-card__meta-icon\s*\{[^}]*mask:\s*var\(--dataset-card-meta-icon-url\)\s*center\s*\/\s*contain\s*no-repeat/s
  );
  assert.match(
    cardCss,
    /\.dataset-card__meta-icon--people\s*\{[^}]*width:\s*18px[^}]*height:\s*18px/s
  );
  assert.doesNotMatch(cardCss, /\.dataset-card__meta-item:nth-child/);
});

test("dataset cards label the release year as Year", () => {
  assert.match(datasetCardTsx, />\s*Year \{year\}\s*</);
  assert.doesNotMatch(datasetCardTsx, />\s*Released \{year\}\s*</);
});

test("controlled access icons are rotated to match Figma on cards and filters", () => {
  assert.match(datasetCardTsx, /dataset-card__meta-icon--controlled/);
  assert.match(
    cardCss,
    /\.dataset-card__meta-icon--controlled\s*\{[^}]*transform:\s*rotate\(180deg\)/s
  );
  assert.match(multiSelectTsx, /multi-select-option__access-icon--controlled/);
  assert.match(
    multiSelectCss,
    /\.multi-select-option__access-icon--controlled\s*\{[^}]*transform:\s*rotate\(180deg\)/s
  );
});

test("dataset card checkbox uses the centered Figma check asset", () => {
  assert.match(
    cardCss,
    /\.dataset-card__checkbox::before\s*\{[^}]*width:\s*24px[^}]*height:\s*24px/s
  );
  assert.match(
    cardCss,
    /\.dataset-card__checkbox::before\s*\{[^}]*mask:\s*url\("\/figma-assets\/icon-checkbox-check\.svg"\)\s*center\s*\/\s*24px\s*24px\s*no-repeat/s
  );
  assert.doesNotMatch(
    cardCss,
    /\.dataset-card__checkbox::before\s*\{[^}]*rotate\(-45deg\)/s
  );
  assert.match(
    cardCss,
    /\.dataset-card__checkbox:checked::before\s*\{[^}]*transform:\s*scale\(1\)/s
  );
});

test("dataset cards and compare checkboxes use teal hover outlines", () => {
  assert.match(
    cardCss,
    /\.dataset-card:hover\s*\{[^}]*border-color:\s*var\(--glm-color-brand-dark\)[^}]*box-shadow:\s*inset\s+0\s+0\s+0\s+1px\s+var\(--glm-color-brand-dark\),\s*0\s+2px\s+8px\s+rgba\(58,\s*58,\s*59,\s*0\.18\)/s
  );
  assert.doesNotMatch(
    cardCss,
    /\.dataset-card:hover\s*\{[^}]*z-index:/s
  );
  assert.doesNotMatch(
    cardCss,
    /\.dataset-card:hover\s*\{[^}]*border-width:/s
  );
  assert.match(
    cardCss,
    /\.dataset-card__checkbox:hover:not\(:disabled\)\s*\{[^}]*border-color:\s*var\(--glm-color-brand-dark\)[^}]*box-shadow:\s*inset\s+0\s+0\s+0\s+1px\s+var\(--glm-color-brand-dark\)/s
  );
  assert.doesNotMatch(
    cardCss,
    /\.dataset-card__checkbox:hover:not\(:disabled\)\s*\{[^}]*border-width:/s
  );
});

test("filter row can wrap instead of widening the viewport", () => {
  assert.match(filterCss, /\.home-filter-row\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(filterCss, /\.home-filter-row__left\s*\{[^}]*min-width:\s*0/s);
});

test("home filter controls stay sticky with guidance and result actions", () => {
  assert.match(
    homePageTsx,
    /<section[\s\S]*ref=\{stickyControlsRef\}[\s\S]*className=\{stickyControlsClassName\}[\s\S]*aria-label="Dataset search controls"[\s\S]*<FilterBar[\s\S]*<section className="home-page__guide-row">[\s\S]*Use checkboxes to compare datasets\.\s*Click a card for details\.[\s\S]*<GuideButton/s
  );
  assert.match(homePageTsx, /useRef<HTMLElement \| null>\(null\)/);
  assert.match(homePageTsx, /stickyControlsStuck/);
  assert.match(homePageTsx, /home-page__sticky-controls--stuck/);
  assert.match(homePageTsx, /getBoundingClientRect\(\)\.top\s*<=\s*0/);
  assert.match(
    homePageCss,
    /\.home-page__sticky-controls\s*\{[^}]*position:\s*sticky[^}]*top:\s*0[^}]*z-index:\s*10/s
  );
  assert.match(
    homePageCss,
    /\.home-page\s*\{[^}]*background:\s*var\(--glm-color-teal-page\)/s
  );
  assert.match(
    homePageCss,
    /\.home-page__hero-bg\s*\{[^}]*background:\s*var\(--glm-color-teal-page\)/s
  );
  assert.match(
    homePageCss,
    /\.home-page__sticky-controls\s*\{[^}]*padding-top:\s*20px[^}]*background:\s*var\(--glm-color-teal-page\)/s
  );
  assert.match(
    homePageCss,
    /\.home-page__sticky-controls\s*\{[^}]*isolation:\s*isolate/s
  );
  assert.doesNotMatch(
    homePageCss,
    /\.home-page__sticky-controls\s*\{[^}]*box-shadow:/s
  );
  assert.match(
    homePageCss,
    /\.home-page__sticky-controls::before,[\s\S]*\.home-page__sticky-controls::after\s*\{[^}]*position:\s*absolute[^}]*width:\s*100vw[^}]*pointer-events:\s*none/s
  );
  assert.match(
    homePageCss,
    /\.home-page__sticky-controls::before\s*\{[^}]*background:\s*var\(--glm-color-teal-page\)/s
  );
  assert.match(
    homePageCss,
    /\.home-page__sticky-controls--stuck::after\s*\{[^}]*bottom:\s*-12px[^}]*height:\s*12px[^}]*linear-gradient/s
  );
  assert.doesNotMatch(
    homePageCss,
    /\.home-page__sticky-controls::after\s*\{[^}]*linear-gradient/s
  );
  assert.match(
    pageTitleCss,
    /\.page-title\s*\{[^}]*margin-bottom:\s*20px/s
  );
  assert.match(
    homePageCss,
    /\.home-page__guide-row\s*\{[^}]*min-height:\s*20px[^}]*flex-wrap:\s*wrap/s
  );
  assert.doesNotMatch(
    homePageCss,
    /\.home-page__guide-row\s*\{[^}]*\n\s*height:\s*20px/s
  );
  assert.match(
    filterCss,
    /\.home-filter-row__count\s*\{[^}]*flex:\s*0\s+0\s+auto/s
  );
  assert.match(
    filterCss,
    /\.home-filter-row__clear\s*\{[^}]*flex:\s*0\s+0\s+auto/s
  );
});

test("data source filter uses consistent wording and fits the full CGM label", () => {
  assert.match(filtersTs, /label:\s*"Data Sources"/);
  assert.match(filtersTs, /prompt:\s*"Select a source"/);
  assert.match(filtersTs, /"Continuous Glucose Monitor \(CGM\)"/);
  assert.match(filtersTs, /"Insulin Delivery System"/);
  assert.match(filtersTs, /"Wearable Tracker"/);
  assert.match(filtersTs, /"Mobile \/ Manual logs"/);
  assert.match(filtersTs, /"Questionnaire"/);
  assert.match(filtersTs, /"Clinical measurements"/);
  assert.match(filterDatasetsTs, /"Continuous Glucose Monitor \(CGM\)":\s*"G"/);
  assert.match(filterDatasetsTs, /"Insulin Delivery System":\s*"I"/);
  assert.match(filterDatasetsTs, /"Wearable Tracker":\s*"W"/);
  assert.match(filterDatasetsTs, /"Mobile \/ Manual logs":\s*"M"/);
  assert.match(filterDatasetsTs, /Questionnaire:\s*"Q"/);
  assert.match(filterDatasetsTs, /"Clinical measurements":\s*"C"/);
  assert.doesNotMatch(filtersTs, /label:\s*"Data types"/);
  assert.doesNotMatch(filtersTs, /"Glucose Monitor"/);
  assert.match(
    multiSelectCss,
    /\.multi-select-menu\s*\{[^}]*width:\s*max-content[^}]*max-width:\s*calc\(100vw\s*-\s*32px\)/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-option__label\s*\{[^}]*white-space:\s*normal/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select\s*\{[^}]*max-width:\s*100%/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-toggle\s*\{[^}]*max-width:\s*100%/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-toggle__label\s*\{[^}]*white-space:\s*normal[^}]*overflow-wrap:\s*anywhere/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--data-sources\s*\{[^}]*width:\s*340px[^}]*padding:\s*20px[^}]*border-radius:\s*12px/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--data-sources \.multi-select-menu__options\s*\{[^}]*gap:\s*12px/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--data-sources \.multi-select-option\s*\{[^}]*gap:\s*9px[^}]*font-size:\s*16px[^}]*font-weight:\s*500[^}]*line-height:\s*19px/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--data-sources \.multi-select-option__checkbox\s*\{[^}]*width:\s*19px[^}]*height:\s*19px[^}]*border-radius:\s*4px/s
  );
  assert.match(
    multiSelectCss,
    /@media\s*\(max-width:\s*380px\)[\s\S]*\.multi-select-menu--data-sources\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%[^}]*height:\s*auto/s
  );
});

test("compare bar appears after the first selected dataset", () => {
  assert.doesNotMatch(compareBarTsx, /selectedCards\.length\s*<\s*2[\s\S]*return\s+null/);
  assert.match(compareBarTsx, /const\s+hasSelections\s*=\s*selectedCards\.length\s*>\s*0/);
  assert.match(compareBarTsx, /if\s*\(!hasSelections\)\s*return\s+null/);
});

test("home comparison selection is capped at three datasets", () => {
  assert.match(compareDataTs, /MAX_COMPARE_DATASETS\s*=\s*3/);
  assert.match(homePageTsx, /selectedCards\.length\s*>=\s*MAX_COMPARE_DATASETS/);
  assert.match(datasetGridTsx, /selectionLimitReached/);
  assert.match(datasetCardTsx, /selectionDisabled/);
});

test("home compare bar matches Figma frame 36631 selection controls", () => {
  assert.match(compareBarTsx, /Select up to \{MAX_COMPARE_DATASETS\} datasets to compare:/);
  assert.match(compareBarTsx, /onRemoveSelection/);
  assert.match(compareBarTsx, /onClearSelection/);
  assert.match(compareBarTsx, /home-compare-bar__remove-icon/);
  assert.match(compareBarTsx, /Dataset \{slotIndex \+ 1\}/);
  assert.match(compareBarTsx, /Clear selection/);
  assert.match(homePageTsx, /handleCardSelect\(title,\s*false\)/);
  assert.match(homePageTsx, /navigate\(makeHomeUrl\(\[\]\),\s*\{\s*replace:\s*true\s*\}\)/);
  assert.match(
    compareBarTsx,
    /selectedCards\.length\s*<\s*MAX_COMPARE_DATASETS/
  );
  assert.match(
    compareBarTsx,
    /selectedCards\.map[\s\S]*Array\.from\(\{\s*length:\s*emptySlotCount\s*\}/
  );
  assert.match(
    homePageCss,
    /\.home-compare-bar::before\s*\{[^}]*filter:\s*blur\(4px\)/s
  );
  assert.match(
    homePageCss,
    /\.home-compare-bar__slot--empty\s*\{[^}]*border-style:\s*dashed/s
  );
});

test("home selection is restored from and written back to the dataset query", () => {
  assert.match(homePageTsx, /parseSelectedDatasets\(location\.search\)/);
  assert.match(homePageTsx, /navigate\(makeHomeUrl\(nextSelectedCards\),\s*\{\s*replace:\s*true\s*\}\)/);
  assert.match(compareDataTs, /export function makeHomeUrl/);
});
