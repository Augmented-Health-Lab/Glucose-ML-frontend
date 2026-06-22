import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { legendDataSources, legendGlucoseRanges } from "../src/features/dataset-detail/legend-data.ts";

const legendModalTsx = readFileSync(
  new URL("../src/features/dataset-detail/LegendModal.tsx", import.meta.url),
  "utf8"
);
const legendModalCss = readFileSync(
  new URL("../src/features/dataset-detail/legend-modal.css", import.meta.url),
  "utf8"
);

test("guide legend data follows Figma frame 269:6171", () => {
  assert.deepEqual(
    legendGlucoseRanges.map((range) => range.label),
    [
      "Very high glucose (>250 mg/dL)",
      "High glucose (181-250 mg/dL)",
      "Target glucose (70-180 mg/dL)",
      "Low glucose (55-69 mg/dL)",
      "Very low glucose (<55 mg/dL)",
    ]
  );

  assert.deepEqual(
    legendDataSources.map((source) => source.code),
    ["G", "I", "W", "M", "Q", "C"]
  );
});

test("dataset guide modal exposes the Figma x close button", () => {
  assert.match(legendModalTsx, /figma-assets\/icon-guide-close\.svg/);
  assert.match(legendModalTsx, /legend-modal-close__icon/);
  assert.match(
    legendModalCss,
    /\.legend-ribbon\s*\{[^}]*right:\s*87px/s
  );
  assert.match(
    legendModalCss,
    /\.legend-modal-close\s*\{[^}]*width:\s*24px[^}]*height:\s*24px/s
  );
  assert.match(
    legendModalCss,
    /\.legend-modal-close\s*\{[^}]*top:\s*40px[^}]*right:\s*40px/s
  );
  assert.match(
    legendModalCss,
    /\.legend-modal-close__icon\s*\{[^}]*width:\s*14px[^}]*height:\s*14px/s
  );
  assert.doesNotMatch(legendModalCss, /clip:\s*rect\(0,\s*0,\s*0,\s*0\)/);
});
