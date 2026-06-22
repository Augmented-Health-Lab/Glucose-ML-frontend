import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const appShellTsx = read("../src/components/app-shell/AppShell.tsx");
const appShellCss = read("../src/components/app-shell/app-shell.css");
const datasetDetailTsx = read(
  "../src/features/dataset-detail/DatasetDetail.tsx"
);
const datasetHeaderTsx = read(
  "../src/features/dataset-detail/DatasetHeader.tsx"
);
const datasetHeaderCss = read(
  "../src/features/dataset-detail/dataset-header.css"
);
const populationTsx = read(
  "../src/features/dataset-detail/PopulationSection.tsx"
);
const populationCss = read(
  "../src/features/dataset-detail/population-section.css"
);
const chartCss = read(
  "../src/features/dataset-detail/glucose-range-chart.css"
);
const authorshipTsx = read(
  "../src/features/dataset-detail/AuthorshipSection.tsx"
);

test("app shell navigation follows the Figma icon and link order", () => {
  const explore = appShellTsx.indexOf(">\n            Explore");
  const background = appShellTsx.indexOf(">\n            Background");
  const about = appShellTsx.indexOf(">\n            About");

  assert.ok(explore >= 0);
  assert.ok(background > explore);
  assert.ok(about > background);
  assert.match(appShellTsx, /nav-home\.svg/);
  assert.match(appShellTsx, /nav-background\.svg/);
  assert.match(appShellTsx, /nav-about\.svg/);
  assert.match(
    appShellCss,
    /\.app-shell-link\s*\{[^}]*display:\s*inline-flex[^}]*gap:\s*8px/s
  );
  assert.equal(
    existsSync(new URL("../public/figma-assets/nav-home.svg", import.meta.url)),
    true
  );
  assert.equal(
    existsSync(new URL("../public/figma-assets/nav-about.svg", import.meta.url)),
    true
  );
  assert.equal(
    existsSync(
      new URL("../public/figma-assets/nav-background.svg", import.meta.url)
    ),
    true
  );
});

test("detail header matches Figma description and dataset-source styling", () => {
  assert.match(
    datasetHeaderCss,
    /\.detail-header__description\s*\{[^}]*font-weight:\s*400/s
  );
  assert.match(datasetHeaderTsx, /detail-header__source-button/);
  assert.match(datasetHeaderTsx, /icon-search\.svg/);
  assert.match(
    datasetHeaderCss,
    /\.detail-header__source-button\s*\{[^}]*background:\s*#f5f8f8/s
  );
});

test("dataset detail omits the guide control absent from the target frame", () => {
  assert.doesNotMatch(datasetDetailTsx, /GuideButton/);
  assert.doesNotMatch(datasetDetailTsx, /dataset-detail-page__guide-row/);
  assert.doesNotMatch(datasetDetailTsx, /LegendModal/);
});

test("population card includes the Figma divider below Total", () => {
  assert.match(populationTsx, /detail-card__divider/);
  assert.match(
    populationCss,
    /\.detail-card__divider\s*\{[^}]*height:\s*1px[^}]*background:\s*#e1e8e7/s
  );
});

test("time-in-range plot uses the fixed Figma geometry", () => {
  assert.match(chartCss, /\.tir-frame\s*\{[^}]*width:\s*min\(787px,\s*100%\)/s);
  assert.match(chartCss, /\.tir-legend\s*\{[^}]*padding:\s*0 0 68px/s);
  assert.match(chartCss, /\.tir-bars\s*\{[^}]*gap:\s*44px[^}]*width:\s*686px/s);
  assert.match(
    chartCss,
    /\.tir-row\s*\{[^}]*grid-template-columns:\s*58px\s+minmax\(0,\s*617px\)/s
  );
  assert.match(chartCss, /\.tir-y-axis\s*\{[^}]*top:\s*-39px/s);
  assert.match(chartCss, /\.tir-x-axis\s*\{[^}]*width:\s*721px[^}]*margin-top:\s*40px[^}]*margin-left:\s*66px/s);
  assert.match(
    datasetDetailTsx,
    /const preferredGroupOrder = \["T1D", "T2D", "PreD", "ND"\]/
  );
});

test("authorship uses the exact Figma section label", () => {
  assert.match(authorshipTsx, />\s*Publication references\s*</);
  assert.doesNotMatch(authorshipTsx, /Publication Reference\(s\)/);
});
