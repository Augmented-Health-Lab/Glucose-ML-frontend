import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { HOME_SUMMARY_STATS } from "../src/data/home-summary-stats.ts";

const pageTitleSource = readFileSync(
  new URL("../src/features/home/PageTitle.tsx", import.meta.url),
  "utf8"
);
const backgroundPageSource = readFileSync(
  new URL("../src/features/background/BackgroundPage.tsx", import.meta.url),
  "utf8"
);
const backgroundPageCss = readFileSync(
  new URL("../src/features/background/background-page.css", import.meta.url),
  "utf8"
);

test("home and background summaries share the approved display values", () => {
  assert.deepEqual(HOME_SUMMARY_STATS, [
    { value: "20+", label: "Datasets" },
    { value: "4,393", label: "Participants" },
    { value: "337,984", label: "Days of CGM" },
    { value: "44.9M", label: "Glucose samples" },
  ]);
  assert.match(pageTitleSource, /from "\.\.\/\.\.\/data\/home-summary-stats"/);
  assert.match(
    backgroundPageSource,
    /from "\.\.\/\.\.\/data\/home-summary-stats"/
  );
  assert.match(pageTitleSource, /HOME_SUMMARY_STATS\.map/);
  assert.match(backgroundPageSource, /HOME_SUMMARY_STATS\.map/);
});

test("background summary figures use the same Figma color token as the home figures", () => {
  assert.match(
    backgroundPageCss,
    /\.background-stat-row dt\s*\{[^}]*color:\s*var\(--glm-color-brand-dark\)/s
  );
});
