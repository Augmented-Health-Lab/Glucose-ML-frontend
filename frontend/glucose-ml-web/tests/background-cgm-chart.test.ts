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
  series: Array<{
    key: "t1d" | "t2d" | "pred" | "nd";
    dataset: string;
    subject: string;
    date: string;
    points: Array<{ hour: number; glucose: number }>;
  }>;
};

const approvedSeries = [
  {
    key: "t1d",
    dataset: "AZT1D",
    subject: "Subject 11",
    date: "2024-01-10",
    pointCount: 288,
  },
  {
    key: "t2d",
    dataset: "CGMacros",
    subject: "012",
    date: "2023-03-02",
    pointCount: 1440,
  },
  {
    key: "pred",
    dataset: "CGMacros",
    subject: "044",
    date: "2022-10-19",
    pointCount: 1440,
  },
  {
    key: "nd",
    dataset: "CGMacros",
    subject: "034",
    date: "2022-03-03",
    pointCount: 1440,
  },
] as const;

test("background CGM chart contains exactly the approved participant-day series", () => {
  assert.deepEqual(
    chartData.series.map(({ key, dataset, subject, date, points }) => ({
      key,
      dataset,
      subject,
      date,
      pointCount: points.length,
    })),
    approvedSeries
  );
});

test("background CGM chart legend identifies the approved source subjects", () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(CHART_SERIES_STYLES).map(([key, style]) => [
        key,
        style.legendLabel,
      ])
    ),
    {
      t1d: "T1D (AZT1D: Subject 11)",
      t2d: "T2D (CGMacros: 012)",
      pred: "PreD (CGMacros: 044)",
      nd: "ND (CGMacros: 034)",
    }
  );
});

test("background CGM chart points use only numeric chronological chart fields", () => {
  for (const series of chartData.series) {
    assert.ok(series.points.length > 0);
    for (const [index, point] of series.points.entries()) {
      assert.deepEqual(Object.keys(point).sort(), ["glucose", "hour"]);
      assert.ok(Number.isFinite(point.hour));
      assert.ok(Number.isFinite(point.glucose));
      assert.ok(point.hour >= 0 && point.hour < 24);
      if (index > 0) assert.ok(point.hour >= series.points[index - 1].hour);
    }
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
