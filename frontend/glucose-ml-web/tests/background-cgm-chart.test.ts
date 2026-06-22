import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CHART_SERIES_STYLES,
  DEFAULT_VISIBLE_GROUP_KEYS,
  createLinePath,
  toggleVisibleGroup,
} from "../src/features/background/background-cgm-chart.ts";

const chartData = JSON.parse(
  readFileSync(
    new URL("../public/static_data/background_cgm_chart.json", import.meta.url),
    "utf8"
  )
) as {
  synthetic: boolean;
  description: string;
  series: Array<{
    key: string;
    points: Array<{ hour: number; glucose: number }>;
  }>;
};

test("background CGM chart contains synthetic illustrative series only", () => {
  assert.equal(chartData.synthetic, true);
  assert.match(chartData.description, /synthetic/i);
  assert.deepEqual(
    chartData.series.map(({ key }) => key),
    ["t1d", "t2d", "pred", "nd"]
  );

  const serialized = JSON.stringify(chartData);
  assert.doesNotMatch(
    serialized,
    /"(?:subject|subject_id|person_id|date|dataset)"\s*:/i
  );
});

test("background CGM chart legend contains group labels only", () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(CHART_SERIES_STYLES).map(([key, style]) => [
        key,
        style.legendLabel,
      ])
    ),
    {
      t1d: "Type 1 diabetes",
      t2d: "Type 2 diabetes",
      pred: "Prediabetes",
      nd: "No diabetes",
    }
  );
});

test("background CGM chart points are non-empty and chronological", () => {
  for (const series of chartData.series) {
    assert.ok(series.points.length > 0);
    assert.ok(
      series.points.every(
        (point, index, points) =>
          point.hour >= 0 &&
          point.hour < 24 &&
          Number.isFinite(point.glucose) &&
          (index === 0 || point.hour >= points[index - 1].hour)
      )
    );
  }
});

test("background CGM chart starts with every group visible", () => {
  assert.deepEqual(DEFAULT_VISIBLE_GROUP_KEYS, ["t1d", "t2d", "pred", "nd"]);
});

test("background CGM chart groups toggle independently and can all be hidden", () => {
  assert.deepEqual(toggleVisibleGroup(DEFAULT_VISIBLE_GROUP_KEYS, "t1d"), [
    "t2d",
    "pred",
    "nd",
  ]);
  assert.deepEqual(toggleVisibleGroup(["t1d"], "t1d"), []);
  assert.deepEqual(toggleVisibleGroup([], "t1d"), ["t1d"]);
});

test("background CGM chart preserves the supplied series colors", () => {
  assert.equal(CHART_SERIES_STYLES.t1d.color, "#e61919");
  assert.equal(CHART_SERIES_STYLES.t2d.color, "#f58516");
  assert.equal(CHART_SERIES_STYLES.pred.color, "#ebd91a");
  assert.equal(CHART_SERIES_STYLES.nd.color, "#1de04e");
});

test("background CGM chart maps data points into the fixed SVG plot", () => {
  assert.equal(createLinePath([{ hour: 0, glucose: 0 }]), "M 82 646");
});
