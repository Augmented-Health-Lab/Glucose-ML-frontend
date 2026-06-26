import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import * as legendData from "../src/features/dataset-detail/legend-data.ts";

const { legendDataSources, legendGlucoseRanges, legendPopulation } = legendData;

const legendModalTsx = readFileSync(
  new URL("../src/features/dataset-detail/LegendModal.tsx", import.meta.url),
  "utf8"
);
const legendModalCss = readFileSync(
  new URL("../src/features/dataset-detail/legend-modal.css", import.meta.url),
  "utf8"
);

test("guide legend data follows Figma frame 36789", () => {
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
    legendPopulation.map(({ label, description }) => [label, description]),
    [
      [
        "Type 1 diabetes",
        "With Type 1, the body produces little or no insulin, and glucose levels must be actively managed through external insulin.",
      ],
      [
        "Type 2 diabetes",
        "With Type 2, the body does not produce enough insulin or does not use insulin properly. T2D is the most common type of diabetes.",
      ],
      [
        "Prediabetes",
        "With Prediabetes, the blood glucose levels are higher than normal but not high enough to be diagnosed with T2D.",
      ],
      [
        "No diabetes",
        "Individuals with no diabetes or prediabetes diagnosis.",
      ],
    ]
  );

  assert.deepEqual(
    legendDataSources.map(({ label, description }) => [label, description]),
    [
      [
        "Continuous Glucose Monitoring",
        "A wearable technology that continuously measures glucose levels from the interstitial fluid just under the skin.",
      ],
      [
        "Insulin Delivery System",
        "A system for administering continuous or precise doses of insulin to manage blood glucose levels. Insulin delivery systems can include an insulin pump, insulin pen, a vial and syringe.",
      ],
      [
        "Wearable Tracker",
        "A wearable technology that continuously monitors health habits, physical activity, and physiological signals. Common wearable trackers include Fitbit, Garmin, Apple Watch, etc.",
      ],
      [
        "Manual logs",
        "User logs often through a mobile app. Common activities that are manually logged include meals, exercise events, menstrual cycles, etc.",
      ],
      [
        "Questionnaire",
        "Surveys or interviews used to collect participant-reported information during a research study. Common information reported via questionnaires include demographics such as age, sex/gender, race/ethnicity, etc.",
      ],
      [
        "Clinical / Other Measurements",
        "Measurements obtained in the clinic such as weight, height, vital signs (e.g. blood pressure, heart rate), lab measurements (e.g. fasting glucose, hemoglobin A1C, cholesterol), and other measurements (e.g. imaging).",
      ],
    ]
  );

  assert.deepEqual(
    legendData.legendAccessTiers?.map(({ label, description }) => [
      label,
      description,
    ]),
    [
      [
        "Open access",
        "This access tier provides immediate access to public datasets. In this case, datasets are often released under licenses that allow for copy, redistribution, and adaptation.",
      ],
      [
        "Controlled access",
        "This access tier requires prospective users to acknowledge and accept a data use agreement before datasets are made available. Datasets in this categories are public but must be requested and released directly to prospective users.",
      ],
    ]
  );
});

test("guide modal uses frame 36789 title, sections, and two-column order", () => {
  assert.match(legendModalTsx, /Guide to Exploring CGM Datasets/);
  assert.match(legendModalTsx, /New to CGM data\? See background/);
  assert.match(legendModalTsx, /Glucose Distribution/);
  assert.match(legendModalTsx, /Data Sources/);
  assert.match(legendModalTsx, /Accessibility/);
  assert.match(legendModalTsx, /legendAccessTiers/);

  assert.match(
    legendModalCss,
    /\.legend-modal\s*\{[^}]*height:\s*min\(1200px,\s*calc\(100vh - 56px\)\)/s
  );
  assert.match(
    legendModalCss,
    /\.legend-modal\s*\{[^}]*border:\s*1px\s+solid\s+var\(--glm-color-card-border\)[^}]*border-radius:\s*20\.202px[^}]*box-shadow:\s*var\(--glm-shadow-card\)/s
  );
  assert.match(
    legendModalCss,
    /\.legend-columns\s*\{[^}]*grid-template-columns:\s*410px minmax\(0,\s*414px\)/s
  );
  assert.match(
    legendModalCss,
    /\.legend-modal-content\s*\{[^}]*min-height:\s*1200px[^}]*padding:\s*40px\s+40px\s+23px/s
  );
});

test("guide modal hard-locks scroll at its top and bottom boundaries", () => {
  assert.match(
    legendModalCss,
    /\.legend-modal-overlay\s*\{[^}]*overscroll-behavior:\s*none/s
  );
  assert.match(
    legendModalCss,
    /\.legend-modal\s*\{[^}]*overscroll-behavior:\s*none/s
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
    /\.legend-ribbon\s*\{[^}]*width:\s*57px[^}]*height:\s*89px/s
  );
  assert.match(
    legendModalCss,
    /\.legend-ribbon::before\s*\{[^}]*inset:\s*0\s+-4px\s+-7px\s+-4px[^}]*background:\s*url\("\/figma-assets\/guide-ribbon\.svg"\)\s+center\s*\/\s*100%\s+100%\s+no-repeat/s
  );
  assert.doesNotMatch(legendModalCss, /clip-path:\s*polygon/);
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
