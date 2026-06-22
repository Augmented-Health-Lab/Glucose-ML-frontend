import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const compareTableTsx = readFileSync(
  new URL("../src/features/compare/CompareTable.tsx", import.meta.url),
  "utf8"
);
const comparingChipsTsx = readFileSync(
  new URL("../src/features/compare/ComparingChips.tsx", import.meta.url),
  "utf8"
);
const comparePageTsx = readFileSync(
  new URL("../src/features/compare/ComparePage.tsx", import.meta.url),
  "utf8"
);
const compareDataTs = readFileSync(
  new URL("../src/utils/compare-data.ts", import.meta.url),
  "utf8"
);
const rangeBarsTsx = readFileSync(
  new URL("../src/features/compare/RangeBars.tsx", import.meta.url),
  "utf8"
);
const compareCss = readFileSync(
  new URL("../src/features/compare/compare-page.css", import.meta.url),
  "utf8"
);

test("compare page uses Figma-exported icons instead of react-icons or text chevrons", () => {
  assert.doesNotMatch(compareTableTsx, /react-icons/);
  assert.doesNotMatch(comparingChipsTsx, /react-icons/);
  assert.doesNotMatch(compareTableTsx, /⌄/);
  assert.match(compareTableTsx, /FIGMA_COMPARE_ICONS/);
  assert.match(comparingChipsTsx, /FIGMA_COMPARE_ICONS/);
  assert.match(compareTableTsx, /compare-table__section-icon/);
});

test("compare section headers are buttons with Figma chevrons", () => {
  assert.match(compareTableTsx, /<button[\s\S]*className="compare-table__section-row"/);
  assert.match(compareTableTsx, /aria-expanded/);
  assert.match(compareCss, /\.compare-table__section-icon-wrap\s*\{[^}]*width:\s*20px[^}]*height:\s*20px/s);
  assert.match(compareCss, /\.compare-table__section-icon\s*\{[^}]*width:\s*12\.083px[^}]*height:\s*7\.083px/s);
});

test("dataset details controls navigate to the matching dataset detail page", () => {
  assert.match(compareTableTsx, /useNavigate/);
  assert.match(compareTableTsx, /encodeURIComponent\(dataset\.title\)/);
  assert.match(compareTableTsx, /className="compare-table__details-button"/);
  assert.doesNotMatch(compareTableTsx, /<span>View dataset details/);
});

test("glucose range bars align under dataset columns with the legend left under the label", () => {
  assert.match(
    compareCss,
    /\.compare-table__range-row\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*var\(--compare-table-columns\)/s
  );
  assert.match(compareCss, /\.compare-table--3\s*\{[^}]*--compare-table-columns:\s*313px repeat\(3,\s*1fr\)/s);
  assert.match(compareCss, /\.compare-table--2\s*\{[^}]*--compare-table-columns:\s*313px repeat\(2,\s*1fr\)/s);
  assert.match(compareCss, /\.compare-table--1\s*\{[^}]*--compare-table-columns:\s*313px minmax\(0,\s*1fr\)/s);
  assert.match(compareCss, /\.compare-range__legend\s*\{[^}]*grid-column:\s*1/s);
  assert.match(compareCss, /\.compare-range__bars\s*\{[^}]*display:\s*contents/s);
  assert.match(compareCss, /\.compare-range__bar-wrap\s*\{[^}]*justify-content:\s*flex-start/s);
  assert.match(rangeBarsTsx, /compare-range__bar-wrap/);
});

test("glucose range bars reveal detailed time-in-range values on hover and focus", () => {
  assert.match(rangeBarsTsx, /tabIndex=\{0\}/);
  assert.match(rangeBarsTsx, /aria-describedby=\{tooltipId\}/);
  assert.match(rangeBarsTsx, /compare-range__tooltip/);
  assert.match(rangeBarsTsx, /compare-range__tooltip-title/);
  assert.match(rangeBarsTsx, /compare-range__tooltip-item/);
  assert.match(rangeBarsTsx, /formatRangeValue/);
  assert.match(compareCss, /\.compare-range__bar-wrap:hover\s+\.compare-range__tooltip/s);
  assert.match(compareCss, /\.compare-range__bar-wrap:focus-within\s+\.compare-range__tooltip/s);
});

test("compare glucose charts use the approved mg/dL ranges", () => {
  assert.match(rangeBarsTsx, /GLUCOSE_RANGE_DEFINITIONS/);
  assert.match(rangeBarsTsx, /GLUCOSE_RANGE_ORDER/);
  assert.doesNotMatch(rangeBarsTsx, /<54mg\/dL/);
  assert.doesNotMatch(rangeBarsTsx, /54-69mg\/dL/);
});

test("compare rows can expand for wrapped CGM device names", () => {
  assert.match(compareCss, /\.compare-table__row\s*\{[^}]*min-height:\s*51px/s);
  assert.doesNotMatch(compareCss, /\.compare-table__row\s*\{[^}]*\n\s*height:\s*51px/s);
  assert.match(compareCss, /\.compare-table__row\s*\{[^}]*line-height:\s*normal/s);
});

test("compare table yes and no icons use Figma path dimensions inside a 20px slot", () => {
  assert.match(compareCss, /\.compare-table__icon-cell\s*\{[^}]*width:\s*20px[^}]*height:\s*20px/s);
  assert.match(compareCss, /\.compare-table__source-icon--yes\s*\{[^}]*width:\s*12\.8px[^}]*height:\s*9\.799px/s);
  assert.match(compareCss, /\.compare-table__source-icon--no\s*\{[^}]*width:\s*12px[^}]*height:\s*12px/s);
});

test("compare chip remove icons use the smaller Figma x sizing", () => {
  assert.match(comparingChipsTsx, /compare-chips__icon--remove/);
  assert.match(comparingChipsTsx, /compare-chips__icon--add/);
  assert.match(compareCss, /\.compare-chips__remove-button\s*\{[^}]*width:\s*16px[^}]*height:\s*16px/s);
  assert.match(compareCss, /\.compare-chips__icon--remove\s*\{[^}]*width:\s*9\.333px[^}]*height:\s*9\.333px/s);
  assert.match(compareCss, /\.compare-chips__icon--add\s*\{[^}]*width:\s*16px[^}]*height:\s*16px/s);
});

test("compare chip remove buttons update the current comparison selection", () => {
  assert.match(comparingChipsTsx, /onRemoveDataset/);
  assert.match(comparingChipsTsx, /aria-label=\{`Remove \$\{name\} from comparison`\}/);
  assert.match(comparingChipsTsx, /onClick=\{\(\) => onRemoveDataset\(name\)\}/);
});

test("compare diabetes types use full labels in stacked pills", () => {
  assert.match(compareTableTsx, /T1D:\s*"Type 1"/);
  assert.match(compareTableTsx, /T2D:\s*"Type 2"/);
  assert.match(compareTableTsx, /PreD:\s*"Prediabetes"/);
  assert.match(compareTableTsx, /ND:\s*"No Diabetes"/);
  assert.match(compareTableTsx, /compare-table__badge/);
  assert.doesNotMatch(compareTableTsx, /glm-pop-badge-small/);
  assert.match(
    compareCss,
    /\.compare-table__badges\s*\{[^}]*flex-direction:\s*column[^}]*align-items:\s*flex-start[^}]*gap:\s*8px/s
  );
  assert.match(
    compareCss,
    /\.compare-table__badge\s*\{[^}]*min-height:\s*27px[^}]*padding:\s*6px\s+10px[^}]*white-space:\s*nowrap/s
  );
});

test("compare page keeps one remaining dataset selected instead of returning home", () => {
  assert.match(compareDataTs, /parsed\.length\s*>\s*0\s*\?\s*parsed\.slice\(0,\s*MAX_COMPARE_DATASETS\)/);
  assert.doesNotMatch(comparePageTsx, /remaining\.length\s*>=\s*2[\s\S]*navigate\("\/"\)/);
  assert.match(comparePageTsx, /navigate\(makeCompareUrl\(remaining\)\)/);
  assert.match(comparePageTsx, /selectedNames\.length\s*<\s*2[\s\S]*Select another dataset to compare/);
});

test("compare add dataset chip is an actionable button hidden at the three dataset limit", () => {
  assert.match(comparingChipsTsx, /onAddDataset/);
  assert.match(comparingChipsTsx, /datasetNames\.length\s*<\s*MAX_COMPARE_DATASETS/);
  assert.match(comparingChipsTsx, /onClick=\{onAddDataset\}/);
  assert.match(comparePageTsx, /const\s+handleAddDataset/);
  assert.match(comparePageTsx, /navigate\(makeHomeUrl\(selectedNames\)\)/);
});
