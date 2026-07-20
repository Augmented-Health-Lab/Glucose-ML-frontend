import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const multiSelectTsx = readFileSync(
  new URL("../src/features/home/MultiSelect.tsx", import.meta.url),
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
const filterDatasetsTs = readFileSync(
  new URL("../src/features/home/filter-datasets.ts", import.meta.url),
  "utf8"
);

test("population selector uses the labels from Figma frame 251:2836", () => {
  assert.match(multiSelectTsx, /T1D:\s*"Type 1 Diabetes"/);
  assert.match(multiSelectTsx, /T2D:\s*"Type 2 Diabetes"/);
  assert.match(multiSelectTsx, /Prediabetic:\s*"Prediabetes"/);
  assert.match(multiSelectTsx, /"Non diabetic":\s*"No diabeties"/);
  assert.match(multiSelectTsx, /getOptionLabel\(label,\s*option\)/);
  assert.doesNotMatch(multiSelectTsx, /<RoundIcon/);
});

test("population selector matches the Figma menu geometry and checkbox styling", () => {
  assert.match(
    multiSelectTsx,
    /multi-select-menu--\$\{label[\s\S]*?\.toLowerCase\(\)[\s\S]*?\.replaceAll\(" ", "-"\)\}/
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--population\s*\{[^}]*width:\s*200px[^}]*height:\s*183px[^}]*padding:\s*20px\s+24px[^}]*border:\s*0[^}]*border-radius:\s*12px[^}]*box-shadow:\s*inset\s+0\s+0\s+0\s+1\.539px\s+#e2e6ee/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--population\s+\.multi-select-menu__prompt\s*\{[^}]*padding:\s*0[^}]*font-weight:\s*400/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--population\s+\.multi-select-menu__options\s*\{[^}]*gap:\s*12px/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--population\s+\.multi-select-option__label\s*\{[^}]*white-space:\s*nowrap/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--population\s+\.multi-select-option__checkbox\s*\{[^}]*width:\s*19px[^}]*height:\s*19px[^}]*border:\s*1\.01px\s+solid\s+#b9c3ce/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--population\s+\.multi-select-option\.selected\s+\.multi-select-option__checkbox\s*\{[^}]*background:\s*#3ba7a1[^}]*border-color:\s*#3ba7a1/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--population\s+\.multi-select-option__checkbox::before\s*\{[^}]*mask:\s*url\("\/figma-assets\/icon-checkbox-check\.svg"\)/s
  );
});

test("population filter toggle uses the same Figma typography as the other filters", () => {
  assert.match(
    multiSelectCss,
    /\.multi-select-toggle\s*\{[^}]*font-family:\s*var\(--glm-font\)[^}]*font-size:\s*14px[^}]*font-weight:\s*500/s
  );
});

test("population menu uses the latest Figma text styles", () => {
  assert.match(
    multiSelectCss,
    /:is\([\s\S]*?\.multi-select-menu--population[\s\S]*?\)\s+\.multi-select-menu__prompt\s*\{[^}]*color:\s*#9ba6b1[^}]*font-size:\s*16px/s
  );
  assert.match(
    multiSelectCss,
    /:is\([\s\S]*?\.multi-select-menu--population[\s\S]*?\)\s+\.multi-select-option\s*\{[^}]*color:\s*#59636e[^}]*font-size:\s*16px/s
  );
});

test("single-select filters use the latest Figma labels and data thresholds", () => {
  assert.match(filtersTs, /prompt:\s*"Select duration"/);
  assert.match(filtersTs, /options:\s*\["7\+ days",\s*"14\+ days",\s*"1 month",\s*"2\+ months"\]/);
  assert.match(filtersTs, /prompt:\s*"Select cohort size"/);
  assert.match(filtersTs, /options:\s*\["20\+",\s*"50\+",\s*"100\+",\s*"500\+",\s*"1000\+"\]/);
  assert.match(filtersTs, /prompt:\s*"Select access type"/);
  assert.match(filtersTs, /options:\s*\["Open",\s*"Controlled"\]/);

  assert.match(filterDatasetsTs, /case "1 month":\s*return numDays >= 30/);
  assert.match(filterDatasetsTs, /case "2\+ months":\s*return numDays >= 60/);
  assert.match(filterDatasetsTs, /case "1000\+":\s*return dataset\.participants >= 1000/);
  assert.match(filterDatasetsTs, /return dataset\.access === filterValue/);
});

test("single-select menus match the latest Figma geometry and typography", () => {
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--study-duration\s*\{[^}]*width:\s*163px[^}]*height:\s*183px/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--sample-size\s*\{[^}]*width:\s*185px[^}]*height:\s*214px/s
  );
  assert.match(
    multiSelectCss,
    /\.multi-select-menu--access\s*\{[^}]*width:\s*239px[^}]*height:\s*121px/s
  );
  assert.match(
    multiSelectCss,
    /:is\(\s*\.multi-select-menu--population,\s*\.multi-select-menu--study-duration,\s*\.multi-select-menu--sample-size,\s*\.multi-select-menu--access\s*\)\s*\{[^}]*gap:\s*12px[^}]*padding:\s*20px\s+24px[^}]*border-radius:\s*12px/s
  );
  assert.match(
    multiSelectCss,
    /:is\([\s\S]*?\.multi-select-menu--access[\s\S]*?\)\s+\.multi-select-menu__prompt\s*\{[^}]*color:\s*#9ba6b1[^}]*font-size:\s*16px[^}]*font-weight:\s*400[^}]*line-height:\s*19px/s
  );
  assert.match(
    multiSelectCss,
    /:is\([\s\S]*?\.multi-select-menu--access[\s\S]*?\)\s+\.multi-select-option\s*\{[^}]*gap:\s*9px[^}]*color:\s*#59636e[^}]*font-size:\s*16px[^}]*font-weight:\s*500[^}]*line-height:\s*19px/s
  );
  assert.match(
    multiSelectCss,
    /:is\(\s*\.multi-select-menu--study-duration,\s*\.multi-select-menu--sample-size,\s*\.multi-select-menu--access\s*\)\s+\.multi-select-option__checkbox\s*\{[^}]*width:\s*19px[^}]*height:\s*19px[^}]*border:\s*1\.01px\s+solid\s+#b9c3ce[^}]*border-radius:\s*50%/s
  );
});
